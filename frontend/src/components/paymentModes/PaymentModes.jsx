import "./PaymentModes.css";

export default function PaymentModes({ paymentMode, setPaymentMode }) {
    return (
        <div className="pm-container">
            <h5 className="pm-title">Choose Payment Method</h5>

            <label className="pm-option">
                <input
                    type="radio"
                    className="pm-radio"
                    name="paymentMode"
                    value="UPI"
                    checked={paymentMode === "UPI"}
                    onChange={() => setPaymentMode("UPI")}
                />
                <span className="pm-label">UPI</span>
            </label>

            <label className="pm-option">
                <input
                    type="radio"
                    className="pm-radio"
                    name="paymentMode"
                    value="Wallet"
                    checked={paymentMode === "Wallet"}
                    onChange={() => setPaymentMode("Wallet")}
                />
                <span className="pm-label">Wallet</span>
            </label>

            <label className="pm-option">
                <input
                    type="radio"
                    className="pm-radio"
                    name="paymentMode"
                    value="NET_BANKING"
                    checked={paymentMode === "NET_BANKING"}
                    onChange={() => setPaymentMode("NET_BANKING")}
                />
                <span className="pm-label">Net Banking</span>
            </label>
        </div>
    );
}
