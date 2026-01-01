import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WalletPage.css";

export default function WalletPage() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const storedBalance = localStorage.getItem("walletBalance");
        const storedTxns = localStorage.getItem("walletTransactions");

        if (storedBalance) setBalance(Number(storedBalance));
        if (storedTxns) setTransactions(JSON.parse(storedTxns));
    }, []);

    const addMoney = (amount) => {
        const newBalance = balance + amount;

        const txn = {
            id: Date.now(),
            type: "CREDIT",
            amount,
            description: "Wallet Top-up",
            time: new Date().toLocaleString()
        };

        const updatedTxns = [txn, ...transactions];

        setBalance(newBalance);
        setTransactions(updatedTxns);

        localStorage.setItem("walletBalance", newBalance);
        localStorage.setItem("walletTransactions", JSON.stringify(updatedTxns));
    };

    return (
        <div className="wallet-page">
            <div className="wallet-header mx-2">
                <h2>My Wallet</h2>
            </div>

            <div className="wallet-balance-card shadow-card">
                <p className="wallet-label">Available Balance</p>
                <h1 className="wallet-amount">₹{balance}</h1>
            </div>

            <div className="wallet-addmoney shadow-card">
                <p className="wallet-label">Add Money</p>
                <div className="wallet-buttons">
                    {[50, 100, 200, 500].map(amount => (
                        <button
                            key={amount}
                            className="add-btn"
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
                    transactions.slice(0, 5).map(txn => (
                        <div
                            key={txn.id}
                            className={`txn-row ${txn.type === "CREDIT" ? "credit" : "debit"}`}
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

            <Link className=" mx-2 btn btn-ternary" to="/dashboard">
            <i className="bi bi-arrow-return-left me-2"></i>
            Back to Dashboard
            </Link>
        </div>
    );
}
