import os
from datetime import datetime
import psycopg2
from fastapi.responses import RedirectResponse
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext

from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware

# ===========================================================
#               APP + SESSION + CORS
# ===========================================================

app = FastAPI()
app.add_middleware(
    SessionMiddleware, secret_key="dev-secret-key-change-me"
)  # needed for Google login

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change at deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================
#               DATABASE CONNECTION
# ===========================================================

conn = psycopg2.connect(
    dbname="escooter",
    user="postgres",
    password="sree123",
    host="localhost",
    port="5432",
)
cursor = conn.cursor()


# ===========================================================
#               PASSWORD HASHING (manual login)
# ===========================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# ===========================================================
#               MODELS (Request Bodies)
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
    userId: str


class EndRideRequest(BaseModel):
    userId: str


class PaymentData(BaseModel):
    scooterId: str
    userId: str
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


# ===========================================================
#               ROOT CHECK
# ===========================================================


@app.get("/")
def root():
    return {"message": "E-Scooter Backend Running with Auth + Google Login"}


# ===========================================================
#                   MANUAL SIGNUP & LOGIN
# ===========================================================


@app.post("/signup")
def signup(data: SignupRequest):
    cursor.execute("SELECT * FROM users WHERE email=%s", (data.email,))
    existing = cursor.fetchone()
    if existing:
        raise HTTPException(400, "Email already registered")

    hashed_pwd = hash_password(data.password)

    cursor.execute(
        "INSERT INTO users (username, email, password_hash, auth_provider) VALUES (%s,%s,%s,%s)",
        (data.username, data.email, hashed_pwd, "manual"),
    )
    conn.commit()

    return {"message": "Signup successful", "username": data.username}


@app.post("/login")
def login(data: LoginRequest):
    cursor.execute(
        "SELECT id, password_hash, username FROM users WHERE email=%s", (data.email,)
    )
    user = cursor.fetchone()

    if not user:
        raise HTTPException(404, "User doesn't exist")

    user_id, hashed_pwd, username = user

    if not verify_password(data.password, hashed_pwd):
        raise HTTPException(401, "Invalid password")

    return {
        "message": "Login successful",
        "userId": user_id,
        "username": username,
        "email": data.email,
        "loginType": "manual",
    }


# ===========================================================
#                   GOOGLE LOGIN
# ===========================================================

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.environ.get(
        "GOOGLE_CLIENT_ID",
        "96231549409-s097vj2hf20cet6mvamph8utbppbfp60.apps.googleusercontent.com",
    ),
    client_secret=os.environ.get(
        "GOOGLE_CLIENT_SECRET",
        "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",
    ),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@app.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


from fastapi.responses import RedirectResponse

FRONTEND_URL = "http://localhost:5173"  # UPDATE to your frontend port


from fastapi.responses import RedirectResponse

FRONTEND_URL = "http://localhost:5173"  # your frontend


@app.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        raise HTTPException(400, f"Google OAuth failed: {exc}")

    # ---- Try all userinfo paths safely ----
    user_info = token.get("userinfo")

    if not user_info:
        try:
            # Parse id_token claims
            user_info = await oauth.google.parse_id_token(request, token)
        except Exception:
            user_info = None

    if not user_info:
        try:
            # Request userinfo endpoint
            resp = await oauth.google.get("userinfo", token=token)
            user_info = resp.json()
        except Exception:
            user_info = None

    if not user_info:
        raise HTTPException(400, "Could not extract user profile from Google")

    # ---- Extract profile fields ----
    email = user_info.get("email")
    username = user_info.get("name") or email.split("@")[0]

    if not email:
        raise HTTPException(400, "Google did not return email")

    # ---- DB integration ----
    cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
    user = cursor.fetchone()

    if not user:
        cursor.execute(
            "INSERT INTO users (username,email,auth_provider) VALUES (%s,%s,%s)",
            (username, email, "google"),
        )
        conn.commit()
        cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

    user_id = user[0]

    # ---- REDIRECT BACK TO FRONTEND ----
    return RedirectResponse(
        f"{FRONTEND_URL}/login?google=1&userId={user_id}&username={username}&email={email}"
    )


# ===========================================================
#               SCOOTERS
# ===========================================================


@app.get("/api/scooters")
def get_scooters():
    cursor.execute("SELECT * FROM scooters ORDER BY id")
    rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "scooterId": row[1],
            "batteryHealth": row[2],
            "status": row[3],
            "baseFee": float(row[4]),
            "ratePerMin": float(row[5]),
        }
        for row in rows
    ]


# ===========================================================
#               LIVE LOCATION
# ===========================================================

scooter_data = {
    "scooter_id": "SCOOTER_1",
    "latitude": 12.752598,
    "longitude": 80.196944,
    "last_updated": None,
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
            "last_updated": datetime.now().isoformat(),
        }
    )
    return {"status": "updated"}


# ===========================================================
#               BOOKING / ENDING / HISTORY / PAYMENT
# ===========================================================


@app.post("/api/book")
def book_scooter(data: BookingRequest):
    cursor.execute(
        "SELECT 1 FROM bookings WHERE userId=%s AND active=true", (data.userId,)
    )
    if cursor.fetchone():
        raise HTTPException(409, "User already has active ride")

    cursor.execute(
        "INSERT INTO bookings (scooterId,model,userId,startTime,active) VALUES (%s,%s,%s,%s,true)",
        (data.scooterId, data.model, data.userId, datetime.now()),
    )
    conn.commit()

    cursor.execute(
        "UPDATE scooters SET status='active' WHERE scooterId=%s", (data.scooterId,)
    )
    conn.commit()

    return {"message": "Scooter booked successfully"}


@app.get("/api/current/{userId}")
def current_ride(userId: str):
    cursor.execute("SELECT * FROM bookings WHERE userId=%s AND active=true", (userId,))
    ride = cursor.fetchone()

    if not ride:
        return {"active": False}

    return {
        "active": True,
        "booking": {
            "id": ride[0],
            "scooterId": ride[1],
            "model": ride[2],
            "userId": ride[3],
            "startTime": ride[4],
        },
    }


@app.post("/api/end")
def end_ride(data: EndRideRequest):
    cursor.execute(
        "SELECT id,startTime FROM bookings WHERE userId=%s AND active=true ORDER BY id DESC LIMIT 1",
        (data.userId,),
    )
    ride = cursor.fetchone()
    if not ride:
        raise HTTPException(404, "No active ride found")

    ride_id, startTime = ride
    endTime = datetime.now()
    totalMinutes = int((endTime - startTime).total_seconds() // 60)

    cursor.execute(
        "UPDATE bookings SET active=false,endTime=%s,totalMinutes=%s WHERE id=%s",
        (endTime, totalMinutes, ride_id),
    )
    conn.commit()

    return {"message": "Ride ended successfully"}


@app.post("/api/save-payment")
def save_payment(data: PaymentData):
    cursor.execute(
        "INSERT INTO payments (scooter_id,user_id,total_minutes,total_cost,payment_mode,transaction_id,start_time,end_time) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
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
    conn.commit()

    cursor.execute(
        "UPDATE scooters SET status='free' WHERE scooterId=%s", (data.scooterId,)
    )
    conn.commit()

    return {"message": "Payment stored & scooter freed successfully"}


@app.get("/api/history/{userId}")
def ride_history(userId: str):
    cursor.execute(
        "SELECT scooter_id,total_minutes,total_cost,payment_mode,transaction_id,start_time,end_time FROM payments WHERE user_id=%s ORDER BY end_time DESC",
        (userId,),
    )
    rows = cursor.fetchall()

    return [
        {
            "scooterId": row[0],
            "totalMinutes": row[1],
            "totalCost": float(row[2]),
            "paymentMode": row[3],
            "transactionId": row[4],
            "startTime": row[5],
            "endTime": row[6],
        }
        for row in rows
    ]
