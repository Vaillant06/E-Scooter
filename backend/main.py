import os
from datetime import datetime

import psycopg2
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

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("Google OAuth env vars not set")

# ===========================================================
#               APP + MIDDLEWARE
# ===========================================================

app = FastAPI()

app.add_middleware(
    SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET", "dev-secret")
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===========================================================
#               DATABASE CONNECTION
# ===========================================================

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# ===========================================================
#               PASSWORD HASHING
# ===========================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


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
    cursor.execute("SELECT 1 FROM users WHERE email=%s", (data.email,))
    if cursor.fetchone():
        raise HTTPException(400, "Email already exists")

    cursor.execute(
        "INSERT INTO users (username,email,password_hash,auth_provider) VALUES (%s,%s,%s,%s)",
        (data.username, data.email, hash_password(data.password), "manual"),
    )
    conn.commit()
    return {"message": "Signup successful"}


@app.post("/login")
def login(data: LoginRequest):
    cursor.execute(
        "SELECT id,username,password_hash FROM users WHERE email=%s", (data.email,)
    )
    user = cursor.fetchone()
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
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    if not user_info:
        user_info = await oauth.google.parse_id_token(request, token)

    email = user_info.get("email")
    username = user_info.get("name") or email.split("@")[0]

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

    return RedirectResponse(
        f"{FRONTEND_URL}/login?google=1&userId={user[0]}&username={username}&email={email}"
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
    "latitude": 12.75,
    "longitude": 80.19,
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
#               BOOKING / PAYMENT
# ===========================================================


@app.post("/api/book")
def book(data: BookingRequest):
    cursor.execute(
        "SELECT 1 FROM bookings WHERE userId=%s AND active=true", (data.userId,)
    )
    if cursor.fetchone():
        raise HTTPException(409, "Active ride exists")

    cursor.execute(
        "INSERT INTO bookings (scooterId,model,userId,startTime,active) VALUES (%s,%s,%s,%s,true)",
        (data.scooterId, data.model, data.userId, datetime.now()),
    )
    cursor.execute(
        "UPDATE scooters SET status='active' WHERE scooterId=%s", (data.scooterId,)
    )
    conn.commit()
    return {"message": "Scooter booked"}


@app.post("/api/end")
def end_ride(data: EndRideRequest):
    cursor.execute(
        "SELECT id,startTime FROM bookings WHERE userId=%s AND active=true ORDER BY id DESC LIMIT 1",
        (data.userId,),
    )
    ride = cursor.fetchone()
    if not ride:
        raise HTTPException(404, "No active ride")

    ride_id, start = ride
    end = datetime.now()
    mins = int((end - start).total_seconds() // 60)

    cursor.execute(
        "UPDATE bookings SET active=false,endTime=%s,totalMinutes=%s WHERE id=%s",
        (end, mins, ride_id),
    )
    conn.commit()
    return {"message": "Ride ended"}
