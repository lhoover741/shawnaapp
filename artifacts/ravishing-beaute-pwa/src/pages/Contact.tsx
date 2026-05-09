import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const DEFAULT_PHONE = "7085743658";

type PublicSettings = {
  contactPhone?: string;
};

export default function Contact() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [contactPhone, setContactPhone] = useState(DEFAULT_PHONE);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as PublicSettings;
        if (typeof data.contactPhone === "string" && data.contactPhone.trim()) {
          setContactPhone(data.contactPhone.replace(/\D/g, "") || DEFAULT_PHONE);
        }
      } catch {
        setContactPhone(DEFAULT_PHONE);
      }
    }

    void loadSettings();
  }, []);

  function sendMessage() {
    if (!name.trim() || !question.trim()) {
      setError("Please enter your name and question before sending.");
      return;
    }

    const message = `Hi Shawna, this is ${name.trim()}${phone.trim() ? ` (${phone.trim()})` : ""}. I have a question for Ravishing Beauté: ${question.trim()}`;
    window.location.href = `sms:${contactPhone}?body=${encodeURIComponent(message)}`;
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #FFFBFA 0%, #F9F5F0 54%, #F6EEF1 100%)", minHeight: "100vh", paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 22px) 16px 18px", background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #E4D3D8", backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, padding: 0, marginBottom: 12 }}>← Home</button>
        <p style={{ fontSize: 10, letterSpacing: 2.7, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>CONTACT RAVISHING BEAUTÉ</p>
        <p style={{ fontSize: 30, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C", lineHeight: 1 }}>Questions before booking?</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 8, lineHeight: 1.55 }}>Send a quick question and we will help you choose the right service or prepare for your appointment.</p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, boxShadow: "0 12px 28px rgba(82,42,57,0.05)" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#5E4B51", marginBottom: 6 }}>Name</label>
          <input value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="Your name" style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", marginBottom: 12 }} />

          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#5E4B51", marginBottom: 6 }}>Phone</label>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Best callback number" inputMode="tel" style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", marginBottom: 12 }} />

          <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#5E4B51", marginBottom: 6 }}>Question</label>
          <textarea value={question} onChange={(event) => { setQuestion(event.target.value); setError(""); }} placeholder="Ask about a style, prep, availability, or service details." rows={5} style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.45, marginBottom: 12 }} />

          {error && <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 10 }}>{error}</p>}

          <button onClick={sendMessage} style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px 0", background: "linear-gradient(135deg, #AC5D7A, #8F4864)", color: "#fff", fontSize: 14, fontWeight: 900, boxShadow: "0 12px 24px rgba(172,93,122,0.22)" }}>Send Question</button>
        </section>

        <section style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 16, padding: 14, marginTop: 14 }}>
          <p style={{ fontSize: 12.5, color: "#8A6509", lineHeight: 1.5 }}>For appointment requests, use the booking page so your service, date, and style details are organized clearly.</p>
        </section>
      </div>
    </div>
  );
}
