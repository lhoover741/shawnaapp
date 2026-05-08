import { useLocation } from "wouter";

export default function AdminQuickActions() {
  const [location, navigate] = useLocation();

  if (location !== "/admin") return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 7,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => navigate("/admin/deposits")}
          style={{
            padding: "13px 6px",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: 15,
            background: "linear-gradient(135deg, #3A6B28, #1E3A17)",
            color: "#fff",
            boxShadow: "0 18px 42px rgba(82,42,57,0.18)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Deposits
        </button>
        <button
          onClick={() => navigate("/admin/schedule")}
          style={{
            padding: "13px 6px",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: 15,
            background: "linear-gradient(135deg, #B9874D, #7A5C1E)",
            color: "#fff",
            boxShadow: "0 18px 42px rgba(82,42,57,0.18)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Schedule
        </button>
        <button
          onClick={() => navigate("/admin/tools")}
          style={{
            padding: "13px 6px",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: 15,
            background: "linear-gradient(135deg, #2A1D22, #6B1F3E)",
            color: "#fff",
            boxShadow: "0 18px 42px rgba(82,42,57,0.22)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Tools
        </button>
        <button
          onClick={() => navigate("/admin/pricing")}
          style={{
            padding: "13px 6px",
            border: "1px solid rgba(255,255,255,0.28)",
            borderRadius: 15,
            background: "linear-gradient(135deg, #AC5D7A, #7E3856)",
            color: "#fff",
            boxShadow: "0 18px 42px rgba(82,42,57,0.28)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Pricing
        </button>
      </div>
    </div>
  );
}
