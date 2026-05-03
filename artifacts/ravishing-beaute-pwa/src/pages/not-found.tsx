import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <p style={{ fontSize: 48, marginBottom: 12 }}>✂️</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Page Not Found</p>
      <p style={{ fontSize: 14, color: "#7D6268", marginBottom: 28 }}>The page you're looking for doesn't exist.</p>
      <button
        onClick={() => navigate("/")}
        style={{ padding: "13px 28px", backgroundColor: "#AC5D7A", color: "#fff", border: "none", borderRadius: 50, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
      >
        Go Home
      </button>
    </div>
  );
}
