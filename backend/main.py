import os
from datetime import datetime
import hashlib
import psycopg2

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from passlib.hash import bcrypt
from passlib.context import CryptContext
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth

# ===========================================================
# ENV CONFIG
# ===========================================================

DATABASE_URL = os.environ.get("DATABASE_URL")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
SESSION_SECRET = os.environ.get("SESSION_SECRET", "dev-secret")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

# ===========================================================
# APP
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
# DATABASE
# ===========================================================

conn = psycopg2.connect(DATABASE_URL)


def get_cursor():
    return conn.cursor()


def init_db():
    with conn.cursor() as cur:
        cur.execute(
            """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100),
            email VARCHAR(255) UNIQUE,
            password_hash TEXT,
            auth_provider VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS wallets (
            user_id INT PRIMARY KEY REFERENCES users(id),
            balance NUMERIC(10,2) DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id),
            type TEXT CHECK (type IN ('CREDIT','DEBIT')),
            amount NUMERIC(10,2),
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS scooters (
            id SERIAL PRIMARY KEY,
            scooterId VARCHAR(10) UNIQUE,
            batteryHealth INT,
            status VARCHAR(20),
            baseFee INT,
            ratePerMin INT
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            scooterId VARCHAR(10),
            userId INT,
            startTime TIMESTAMP,
            endTime TIMESTAMP,
            totalMinutes INT,
            active BOOLEAN DEFAULT TRUE
        );

        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            scooter_id VARCHAR(10),
            user_id INT,
            total_minutes INT,
            total_cost NUMERIC(10,2),
            payment_mode TEXT,
            transaction_id TEXT,
            start_time TIMESTAMP,
            end_time TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        )
        conn.commit()


init_db()

# ===========================================================
# PASSWORD
# ===========================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return bcrypt.hash(hashlib.sha256(password.encode()).digest())


def verify_password(password: str, hashed: str):
    return bcrypt.verify(hashlib.sha256(password.encode()).digest(), hashed)


# ===========================================================
# MODELS
# ===========================================================


class SignupRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class WalletTopup(BaseModel):
    userId: int
    amount: float


class PaymentData(BaseModel):
    scooterId: str
    userId: int
    totalMinutes: int
    totalCost: float
    paymentMode: str
    transactionId: str
    startTime: str
    endTime: str


# ===========================================================
# AUTH
# ===========================================================


@app.post("/signup")
def signup(data: SignupRequest):
    cur = get_cursor()
    cur.execute(
        "INSERT INTO users (username,email,password_hash,auth_provider) VALUES (%s,%s,%s,'manual') RETURNING id",
        (data.username, data.email, hash_password(data.password)),
    )
    user_id = cur.fetchone()[0]

    cur.execute("INSERT INTO wallets (user_id,balance) VALUES (%s,0)", (user_id,))
    conn.commit()
    return {"message": "Signup successful"}


@app.post("/login")
def login(data: LoginRequest):
    cur = get_cursor()
    cur.execute(
        "SELECT id,username,password_hash FROM users WHERE email=%s", (data.email,)
    )
    user = cur.fetchone()
    if not user or not verify_password(data.password, user[2]):
        raise HTTPException(401, "Invalid credentials")

    return {"userId": user[0], "username": user[1]}


# ===========================================================
# WALLET
# ===========================================================


@app.get("/api/wallet/{user_id}")
def get_wallet(user_id: int):
    cur = get_cursor()
    cur.execute("SELECT balance FROM wallets WHERE user_id=%s", (user_id,))
    balance = cur.fetchone()[0]

    cur.execute(
        """
        SELECT type,amount,description,created_at
        FROM wallet_transactions
        WHERE user_id=%s
        ORDER BY created_at DESC
        LIMIT 5
    """,
        (user_id,),
    )
    txns = cur.fetchall()

    return {
        "balance": float(balance),
        "transactions": [
            {
                "type": t[0],
                "amount": float(t[1]),
                "description": t[2],
                "time": t[3].strftime("%d %b %Y %H:%M"),
            }
            for t in txns
        ],
    }


@app.post("/api/wallet/topup")
def wallet_topup(data: WalletTopup):
    cur = get_cursor()
    cur.execute(
        "UPDATE wallets SET balance = balance + %s WHERE user_id=%s RETURNING balance",
        (data.amount, data.userId),
    )
    new_balance = cur.fetchone()[0]

    cur.execute(
        """
        INSERT INTO wallet_transactions (user_id,type,amount,description)
        VALUES (%s,'CREDIT',%s,'Wallet Top-up')
    """,
        (data.userId, data.amount),
    )

    conn.commit()
    return {"balance": float(new_balance)}


# ===========================================================
# PAYMENT (WITH WALLET DEDUCTION)
# ===========================================================


@app.post("/api/save-payment")
def save_payment(data: PaymentData):
    cur = get_cursor()

    if data.paymentMode == "wallet":
        cur.execute("SELECT balance FROM wallets WHERE user_id=%s", (data.userId,))
        bal = cur.fetchone()[0]

        if bal < data.totalCost:
            raise HTTPException(400, "Insufficient wallet balance")

        cur.execute(
            "UPDATE wallets SET balance = balance - %s WHERE user_id=%s",
            (data.totalCost, data.userId),
        )

        cur.execute(
            """
            INSERT INTO wallet_transactions (user_id,type,amount,description)
            VALUES (%s,'DEBIT',%s,'Scooter Ride Payment')
        """,
            (data.userId, data.totalCost),
        )

    cur.execute(
        """
        INSERT INTO payments
        (scooter_id,user_id,total_minutes,total_cost,payment_mode,
         transaction_id,start_time,end_time)
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

    conn.commit()
    return {"message": "Payment successful"}
