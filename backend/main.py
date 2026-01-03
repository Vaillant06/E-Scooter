import os
from datetime import datetime
import hashlib
import google.generativeai as genai
import requests
from passlib.hash import bcrypt
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from passlib.context import CryptContext

from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware

# ===========================================================
#               ENVIRONMENT CONFIG
# ===========================================================

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "dev-secret")

# ===========================================================
#               GEMINI AI CONFIG
# ===========================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set")

genai.configure(api_key=GEMINI_API_KEY)

gemini_model = genai.GenerativeModel("gemini-1.0-pro")


if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("Google OAuth env vars not set")

# ===========================================================
#               APP + MIDDLEWARE
# ===========================================================

app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================
#               DATABASE
# ===========================================================

import psycopg2

conn = psycopg2.connect(DATABASE_URL)

def get_cursor():
    return conn.cursor()

def init_db():
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT,
                auth_provider VARCHAR(20) DEFAULT 'manual',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS scooters (
                id SERIAL PRIMARY KEY,
                scooterId VARCHAR(10) UNIQUE NOT NULL,
                batteryHealth INT NOT NULL,
                status VARCHAR(20) NOT NULL,
                baseFee INT NOT NULL,
                ratePerMin INT NOT NULL,
                image TEXT
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                scooterId VARCHAR(10) REFERENCES scooters(scooterId),
                userId INT REFERENCES users(id),
                model TEXT,
                startTime TIMESTAMP NOT NULL,
                endTime TIMESTAMP,
                totalMinutes INT,
                active BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                scooter_id VARCHAR(10) REFERENCES scooters(scooterId),
                user_id INT REFERENCES users(id),
                total_minutes INT NOT NULL,
                total_cost NUMERIC(10,2) NOT NULL,
                payment_mode TEXT NOT NULL,
                transaction_id TEXT UNIQUE NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.commit()

init_db()


# ===========================================================
#               PASSWORD HASHING
# ===========================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    digest = hashlib.sha256(password.encode()).digest()
    return bcrypt.hash(digest)


def verify_password(password: str, hashed: str) -> bool:
    digest = hashlib.sha256(password.encode()).digest()
    return bcrypt.verify(digest, hashed)


# ===========================================================
#               MODELS
# ===========================================================


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class BookingRequest(BaseModel):
    scooterId: str
    model: str
    userId: int


class EndRideRequest(BaseModel):
    userId: int


class PaymentData(BaseModel):
    scooterId: str
    userId: int
    totalMinutes: int
    totalCost: float
    paymentMode: str
    transactionId: str
    startTime: str
    endTime: str


class ScooterLocation(BaseModel):
    scooter_id: str
    latitude: float
    longitude: float


class ChatRequest(BaseModel):
    question: str



# ===========================================================
#               ROOT
# ===========================================================


@app.get("/")
def root():
    return {"status": "E-Scooter Backend Running"}


# ===========================================================
#               AUTH (MANUAL)
# ===========================================================


@app.post("/signup")
def signup(data: SignupRequest):
    cur = get_cursor()
    cur.execute("SELECT 1 FROM users WHERE email=%s", (data.email,))
    if cur.fetchone():
        raise HTTPException(400, "Email already exists")

    cur.execute(
        "INSERT INTO users (username,email,password_hash,auth_provider) VALUES (%s,%s,%s,%s)",
        (data.username, data.email, hash_password(data.password), "manual"),
    )
    conn.commit()
    return {"message": "Signup successful"}


@app.post("/login")
def login(data: LoginRequest):
    cur = get_cursor()
    cur.execute(
        "SELECT id,username,password_hash FROM users WHERE email=%s",
        (data.email,),
    )
    user = cur.fetchone()
    if not user:
        raise HTTPException(404, "User not found")

    user_id, username, pwd = user
    if not verify_password(data.password, pwd):
        raise HTTPException(401, "Invalid password")

    return {
        "userId": user_id,
        "username": username,
        "email": data.email,
        "loginType": "manual",
    }


# ===========================================================
#               GOOGLE OAUTH
# ===========================================================

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(400, f"Google login failed: {e}")

    user_info = token.get("userinfo") or await oauth.google.parse_id_token(
        request, token
    )

    email = user_info.get("email")
    username = user_info.get("name") or email.split("@")[0]

    cur = get_cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    user = cur.fetchone()

    if not user:
        cur.execute(
            "INSERT INTO users (username,email,auth_provider) VALUES (%s,%s,%s)",
            (username, email, "google"),
        )
        conn.commit()
        cur.execute("SELECT id FROM users WHERE email=%s", (email,))
        user = cur.fetchone()

    return RedirectResponse(
        f"{FRONTEND_URL}/login?google=1&userId={user[0]}&username={username}&email={email}"
    )


# ===========================================================
#               SCOOTERS
# ===========================================================


@app.get("/api/scooters")
def get_scooters():
    cur = get_cursor()
    
    # Safety check: Free any scooters that are marked 'active' but have no active bookings
    # This handles cases where rides ended but scooter wasn't freed (old code or errors)
    cur.execute(
        """
        UPDATE scooters s
        SET status = 'free'
        WHERE s.status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.scooterId = s.scooterId AND b.active = true
        )
        """
    )
    conn.commit()
    
    cur.execute("SELECT * FROM scooters ORDER BY id")
    rows = cur.fetchall()
    return [
        {
            "id": r[0],
            "scooterId": r[1],
            "batteryHealth": r[2],
            "status": r[3],
            "baseFee": float(r[4]),
            "ratePerMin": float(r[5]),
        }
        for r in rows
    ]


# ===========================================================
#               LOCATION (DEMO)
# ===========================================================

scooter_data = {
    "scooter_id": "SCOOTER_1",
    "latitude": 12.752598,
    "longitude": 80.196944,
}


@app.get("/api/location")
def get_location():
    return scooter_data


@app.post("/api/location")
def update_location(data: ScooterLocation):
    scooter_data.update(
        {
            "scooter_id": data.scooter_id,
            "latitude": data.latitude,
            "longitude": data.longitude,
        }
    )
    return {"status": "updated"}

# ===========================================================
#               AI CHAT (GEMINI)
# ===========================================================

@app.post("/api/ai/chat")
def ai_chat(data: ChatRequest):
    """
    Gemini-powered chatbot for scooter assistance
    """

    # Context pulled from live backend data
    context = f"""
    You are an AI assistant for an electric scooter rental service.

    Scooter details:
    - Scooter ID: {scooter_data.get('scooter_id')}
    - Current location: latitude {scooter_data.get('latitude')}, longitude {scooter_data.get('longitude')}

    Pricing:
    - Base fee: ₹20
    - Rate per minute: ₹2

    Rules:
    - One active ride per user
    - Scooter must be free to book
    - Ride ends when the user clicks End Ride

    Answer clearly, briefly, and helpfully.
    """

    prompt = f"""
    Context:
    {context}

    User question:
    {data.question}
    """

    try:
        response = gemini_model.generate_content(prompt)
        return {"answer": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===========================================================
#               BOOKING
# ===========================================================


@app.post("/api/book")
def book(data: BookingRequest):
    cur = get_cursor()

    # Check if user has an active ride
    cur.execute(
        "SELECT 1 FROM bookings WHERE userId=%s AND active=true",
        (data.userId,),
    )
    if cur.fetchone():
        raise HTTPException(409, "Active ride exists")

    # Check if user has any unpaid completed rides
    # (bookings that are inactive but don't have a corresponding payment)
    # Match by user_id, scooter_id, and start_time within 1 minute tolerance
    cur.execute(
        """
        SELECT b.id FROM bookings b
        WHERE b.userId = %s 
            AND b.active = false
            AND NOT EXISTS (
                SELECT 1 FROM payments p
                WHERE p.user_id = b.userId
                    AND p.scooter_id = b.scooterId
                    AND ABS(EXTRACT(EPOCH FROM (p.start_time - b.startTime))) < 60
            )
        ORDER BY b.endTime DESC
        LIMIT 1
        """,
        (data.userId,),
    )
    if cur.fetchone():
        raise HTTPException(409, "Please complete payment for your previous ride before booking a new one")

    cur.execute(
        "SELECT status FROM scooters WHERE scooterId=%s",
        (data.scooterId,),
    )
    row = cur.fetchone()
    if not row or row[0] != "free":
        raise HTTPException(409, "Scooter not available")

    cur.execute(
        """
        INSERT INTO bookings (scooterId,model,userId,startTime,active)
        VALUES (%s,%s,%s,%s,true)
        """,
        (data.scooterId, data.model, data.userId, datetime.now()),
    )

    cur.execute(
        "UPDATE scooters SET status='active' WHERE scooterId=%s",
        (data.scooterId,),
    )

    conn.commit()
    return {"message": "Scooter booked"}


# ===========================================================
#               END RIDE
# ===========================================================


@app.post("/api/end")
def end_ride(data: EndRideRequest):
    cur = get_cursor()

    cur.execute(
        """
        SELECT id, scooterId, startTime FROM bookings
        WHERE userId=%s AND active=true
        ORDER BY id DESC LIMIT 1
        """,
        (data.userId,),
    )
    ride = cur.fetchone()

    if not ride:
        raise HTTPException(404, "No active ride")

    ride_id, scooter_id, start = ride
    end = datetime.now()
    mins = int((end - start).total_seconds() // 60)

    # Mark booking as inactive
    cur.execute(
        """
        UPDATE bookings
        SET active=false,endTime=%s,totalMinutes=%s
        WHERE id=%s
        """,
        (end, mins, ride_id),
    )

    # Free the scooter immediately so other users can use it
    cur.execute(
        "UPDATE scooters SET status='free' WHERE scooterId=%s",
        (scooter_id,),
    )

    conn.commit()
    return {"message": "Ride ended", "scooterId": scooter_id}


# ===========================================================
#               GET CURRENT RIDE
# ===========================================================


@app.get("/api/current/{user_id}")
def get_current_ride(user_id: int):
    cur = get_cursor()
    
    cur.execute(
        """
        SELECT id, scooterId, model, startTime, totalMinutes
        FROM bookings
        WHERE userId=%s AND active=true
        ORDER BY id DESC LIMIT 1
        """,
        (user_id,),
    )
    ride = cur.fetchone()
    
    if not ride:
        return {"active": False, "booking": None}
    
    return {
        "active": True,
        "booking": {
            "id": ride[0],
            "scooterId": ride[1],
            "model": ride[2],
            "startTime": ride[3].isoformat() if ride[3] else None,
            "totalMinutes": ride[4],
        }
    }


# ===========================================================
#               SAVE PAYMENT
# ===========================================================


@app.post("/api/save-payment")
def save_payment(data: PaymentData):
    cur = get_cursor()

    cur.execute(
        """
        INSERT INTO payments
        (scooter_id,user_id,total_minutes,total_cost,
         payment_mode,transaction_id,start_time,end_time)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            data.scooterId,
            data.userId,
            data.totalMinutes,
            data.totalCost,
            data.paymentMode,
            data.transactionId,
            datetime.fromisoformat(data.startTime),
            datetime.fromisoformat(data.endTime),
        ),
    )

    # Scooter is already freed when ride ended, so no need to update status here
    # This allows other users to use the scooter even if payment is pending

    conn.commit()
    return {"message": "Payment saved"}


# ===========================================================
#               CLEANUP STUCK SCOOTERS
# ===========================================================


@app.post("/api/cleanup-scooters")
def cleanup_scooters():
    """
    Safety endpoint to free scooters that are marked 'active' 
    but have no active bookings. Useful for fixing stuck scooters.
    """
    cur = get_cursor()
    
    cur.execute(
        """
        UPDATE scooters s
        SET status = 'free'
        WHERE s.status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.scooterId = s.scooterId AND b.active = true
        )
        RETURNING s.scooterId
        """
    )
    freed = cur.fetchall()
    conn.commit()
    
    return {
        "message": f"Freed {len(freed)} stuck scooter(s)",
        "freed_scooters": [s[0] for s in freed]
    }


# ===========================================================
#               RIDE HISTORY
# ===========================================================


@app.get("/api/history/{user_id}")
def ride_history(user_id: int):
    cur = get_cursor()

    cur.execute(
        """
        SELECT
            scooter_id,
            total_minutes,
            total_cost,
            payment_mode,
            transaction_id,
            start_time,
            end_time
        FROM payments
        WHERE user_id = %s
        ORDER BY end_time DESC
        """,
        (user_id,),
    )

    rows = cur.fetchall()

    return [
        {
            "scooterId": r[0],
            "totalMinutes": r[1],
            "totalCost": float(r[2]),
            "paymentMode": r[3],
            "transactionId": r[4],
            "startTime": r[5],
            "endTime": r[6],
        }
        for r in rows
    ]
