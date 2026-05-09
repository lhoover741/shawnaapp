import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Review = {
  id: number;
  clientName: string;
  rating: number;
  body: string;
  service: string;
  createdAt: string;
};

export default function Reviews() {
  const [, navigate] = useLocation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    try {
      const response = await fetch("/api/reviews", { cache: "no-store" });
      const data = (await response.json()) as Review[];
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function submitReview() {
    setNotice("");
    setError("");
    if (!clientName.trim() || !service.trim() || body.trim().length < 10) {
      setError("Please enter your name, service, and a review of at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          service: service.trim(),
          rating,
          body: body.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not submit review");
      setClientName("");
      setService("");
      setRating(5);
      setBody("");
      setNotice("Thank you. Your review was submitted and will appear after approval.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #FFFBFA 0%, #F9F5F0 54%, #F6EEF1 100%)", minHeight: "100vh", paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 22px) 16px 18px", background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #E4D3D8", backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, padding: 0, marginBottom: 12 }}>← Home</button>
        <p style={{ fontSize: 10, letterSpacing: 2.7, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>CLIENT REVIEWS</p>
        <p style={{ fontSize: 30, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C", lineHeight: 1 }}>Real client experiences</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 8, lineHeight: 1.55 }}>Approved reviews from Ravishing Beauté clients, curated to keep the page clean and trustworthy.</p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#7D6268", padding: "28px 0" }}>Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 18, textAlign: "center", boxShadow: "0 12px 28px rgba(82,42,57,0.05)", marginBottom: 14 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#201B1C", marginBottom: 6 }}>Reviews are being curated.</p>
            <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5 }}>Approved reviews will appear here once Shawna reviews them.</p>
          </section>
        ) : (
          <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            {reviews.map((review) => (
              <section key={review.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, boxShadow: "0 12px 28px rgba(82,42,57,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 900, color: "#201B1C" }}>{review.clientName}</p>
                    <p style={{ fontSize: 11, color: "#7D6268", fontWeight: 700, letterSpacing: 0.5 }}>{review.service}</p>
                  </div>
                  <span style={{ color: "#AC5D7A", fontSize: 13, fontWeight: 900 }}>{"★".repeat(Math.max(1, Math.min(5, review.rating)))}</span>
                </div>
                <p style={{ fontSize: 13, color: "#5E4B51", lineHeight: 1.55 }}>{review.body}</p>
              </section>
            ))}
          </div>
        )}

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, boxShadow: "0 12px 28px rgba(82,42,57,0.05)" }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginBottom: 6 }}>SUBMIT A REVIEW</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#201B1C", marginBottom: 10 }}>Share your experience</p>
          <input value={clientName} onChange={(event) => { setClientName(event.target.value); setError(""); }} placeholder="Your name" style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", marginBottom: 10 }} />
          <input value={service} onChange={(event) => { setService(event.target.value); setError(""); }} placeholder="Service received" style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", marginBottom: 10 }} />
          <select value={rating} onChange={(event) => setRating(Number(event.target.value))} style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", marginBottom: 10, backgroundColor: "#fff" }}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}
          </select>
          <textarea value={body} onChange={(event) => { setBody(event.target.value); setError(""); }} placeholder="Tell us about your appointment." rows={5} style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.45, marginBottom: 10 }} />
          <p style={{ fontSize: 11.5, color: "#7D6268", lineHeight: 1.45, marginBottom: 10 }}>Reviews are reviewed before appearing publicly.</p>
          {notice && <p style={{ fontSize: 12, color: "#2E7D32", marginBottom: 10 }}>{notice}</p>}
          {error && <p style={{ fontSize: 12, color: "#C0392B", marginBottom: 10 }}>{error}</p>}
          <button onClick={submitReview} disabled={submitting} style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px 0", backgroundColor: "#AC5D7A", color: "#fff", fontSize: 14, fontWeight: 900, opacity: submitting ? 0.7 : 1 }}>{submitting ? "Submitting…" : "Submit Review"}</button>
        </section>
      </div>
    </div>
  );
}
