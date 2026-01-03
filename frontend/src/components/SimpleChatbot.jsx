import { useState } from "react";

const GEMINI_API_KEY = "PASTE_YOUR_EXISTING_MAPS_API_KEY_HERE";

export default function SimpleChatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function askAI() {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `
You are an AI assistant for an electric scooter rental app.

Scooter details:
- Scooter ID: SCOOTER_1
- Location: SSN College of Engineering
- Base fee: ₹20
- Rate per minute: ₹2

User question:
${question}
                    `,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();

      setAnswer(
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response from AI"
      );
    } catch (err) {
      setAnswer("AI service unavailable. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 320,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        padding: 14,
        zIndex: 1000,
        fontFamily: "sans-serif",
      }}
    >
      <h4 style={{ margin: "0 0 10px 0" }}>AI Assistant</h4>

      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask about the scooter..."
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 6,
          border: "1px solid #d1d5db",
          marginBottom: 8,
        }}
      />

      <button
        onClick={askAI}
        disabled={loading}
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 6,
          border: "none",
          background: "#2563eb",
          color: "#ffffff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Thinking..." : "Ask AI"}
      </button>

      {answer && (
        <div
          style={{
            marginTop: 10,
            background: "#f3f4f6",
            padding: 8,
            borderRadius: 6,
            fontSize: 14,
            maxHeight: 150,
            overflowY: "auto",
          }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}
