import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WalletPage.css";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toppingUp, setToppingUp] = useState(false);

  const userId = Number(localStorage.getItem("userId"));

  // ---- fetch wallet from backend ----
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch(
          `https://e-scooter-33r2.onrender.com/api/wallet/${userId}`
        );

        if (!res.ok) throw new Error("Failed to fetch wallet");

        const data = await res.json();
        setBalance(data.balance);
        setTransactions(data.transactions);
      } catch (err) {
        console.error("Wallet fetch error:", err);
        alert("Failed to load wallet");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [userId]);

  // ---- top up wallet ----
  const addMoney = async (amount) => {
    if (toppingUp) return;
    setToppingUp(true);

    try {
      const res = await fetch(
        "https://e-scooter-33r2.onrender.com/api/wallet/topup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, amount })
        }
      );

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "Top-up failed");
        return;
      }

      const data = await res.json();
      setBalance(data.balance);

      // refresh transactions
      const txRes = await fetch(
        `https://e-scooter-33r2.onrender.com/api/wallet/${userId}`
      );
      const txData = await txRes.json();
      setTransactions(txData.transactions);
    } catch (err) {
      console.error("Top-up error:", err);
      alert("Something went wrong");
    } finally {
      setToppingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="wallet-page">
        <p className="text-center mt-5">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header mx-2">
        <h2>My Wallet</h2>
      </div>

      <div className="wallet-balance-card shadow-card">
        <p className="wallet-label">Available Balance</p>
        <h1 className="wallet-amount">₹{balance.toFixed(2)}</h1>
      </div>

      <div className="wallet-addmoney shadow-card">
        <p className="wallet-label">Add Money</p>
        <div className="wallet-buttons">
          {[50, 100, 200, 500].map(amount => (
            <button
              key={amount}
              className="add-btn"
              disabled={toppingUp}
              onClick={() => addMoney(amount)}
            >
              + ₹{amount}
            </button>
          ))}
        </div>
      </div>

      <div className="wallet-transactions shadow-card">
        <p className="wallet-label">Recent Transactions</p>

        {transactions.length === 0 ? (
          <p className="empty-text">No transactions yet</p>
        ) : (
          transactions.map((txn, index) => (
            <div
              key={index}
              className={`txn-row ${
                txn.type === "CREDIT" ? "credit" : "debit"
              }`}
            >
              <div>
                <strong>{txn.description}</strong>
                <div className="txn-time">{txn.time}</div>
              </div>
              <span className="txn-amount">
                {txn.type === "CREDIT" ? "+" : "-"}₹{txn.amount}
              </span>
            </div>
          ))
        )}
      </div>

      <Link className="mx-2 btn btn-ternary" to="/dashboard">
        <i className="bi bi-arrow-return-left me-2"></i>
        Back to Dashboard
      </Link>
    </div>
  );
}
