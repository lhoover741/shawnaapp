import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Review = { id: number; clientName: string; rating: number; body: string; service: string; createdAt: string; approved: boolean; featured?: boolean };

export default function AdminReviews() {
  const [, navigate] = useLocation();
  const [key, setKey] = useState("");
  const [items, setItems] = useState<Review[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("admin_token") || "";
    setKey(saved);
    if (saved) void load(saved);
  }, []);

  async function load(auth = key) {
    setNotice("");
    const res = await fetch("/api/admin/reviews", { headers: { Authorization: `Bearer ${auth}` }, cache: "no-store" });
    if (!res.ok) { setNotice("Open the admin dashboard and sign in first."); return; }
    const data = await res.json() as Review[];
    setItems(Array.isArray(data) ? data : []);
  }

  async function save(id: number, body: Partial<Review>) {
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(body) });
    if (!res.ok) { setNotice("Could not update review."); return; }
    const updated = await res.json() as Review;
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updated } : item));
  }

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8" }}>
        <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>← Admin</button>
        <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginTop: 12 }}>REVIEWS</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C" }}>Approval Queue</p>
      </div>
      <div style={{ padding: 16 }}>
        {notice && <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 12, padding: 12, color: "#8A6509", fontSize: 12, marginBottom: 12 }}>{notice}</div>}
        <button onClick={() => load()} style={{ width: "100%", padding: "12px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontWeight: 900, marginBottom: 12 }}>Refresh Reviews</button>
        {items.length === 0 ? <p style={{ textAlign: "center", color: "#7D6268", padding: 24 }}>No reviews to show.</p> : items.map((review) => (
          <section key={review.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div><p style={{ fontSize: 15, fontWeight: 900, color: "#201B1C" }}>{review.clientName}</p><p style={{ fontSize: 11, color: "#7D6268" }}>{review.service}</p></div>
              <span style={{ fontSize: 11, fontWeight: 900, color: review.approved ? "#3A6B28" : "#B8860B" }}>{review.approved ? "Approved" : "Pending"}</span>
            </div>
            <p style={{ color: "#AC5D7A", fontWeight: 900, margin: "8px 0" }}>{"★".repeat(review.rating)}</p>
            <p style={{ fontSize: 12.5, color: "#5E4B51", lineHeight: 1.5, marginBottom: 12 }}>{review.body}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => save(review.id, { approved: !review.approved })} style={{ padding: "10px 0", border: "none", borderRadius: 10, backgroundColor: review.approved ? "#F3EAED" : "#AC5D7A", color: review.approved ? "#7D6268" : "#fff", fontWeight: 900 }}>{review.approved ? "Unapprove" : "Approve"}</button>
              <button onClick={() => save(review.id, { featured: !review.featured })} style={{ padding: "10px 0", border: "1px solid #E4D3D8", borderRadius: 10, backgroundColor: review.featured ? "#201B1C" : "#fff", color: review.featured ? "#fff" : "#201B1C", fontWeight: 900 }}>{review.featured ? "Featured" : "Feature"}</button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
