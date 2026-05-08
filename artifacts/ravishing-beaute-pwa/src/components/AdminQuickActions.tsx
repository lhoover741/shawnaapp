import { useLocation } from "wouter";

const buttonBase = {
  padding: "12px 6px",
  border: "1px solid rgba(255,255,255,0.28)",
  borderRadius: 15,
  color: "#fff",
  boxShadow: "0 18px 42px rgba(82,42,57,0.18)",
  fontSize: 11.5,
  fontWeight: 800,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
} as const;

export default function AdminQuickActions() {
  const [location, navigate] = useLocation();

  if (location !== "/admin") return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(14px + env(safe-area-inset-bottom, 0px))",
        zIndex: 80,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => navigate("/admin/deposits")}
          style={{
            ...buttonBase,
            background: "linear-gradient(135deg, #3A6B28, #1E3A17)",
          }}
        >
          Deposits
        </button>
        <button
          onClick={() => navigate("/admin/notes")}
          style={{
            ...buttonBase,
            background: "linear-gradient(135deg, #49595A, #222D2F)",
          }}
        >
          Notes
        </button>
        <button
          onClick={() => navigate("/admin/schedule")}
          style={{
            ...buttonBase,
            background: "linear-gradient(135deg, #B9874D, #7A5C1E)",
          }}
        >
          Schedule
        </button>
        <button
          onClick={() => navigate("/admin/tools")}
          style={{
            ...buttonBase,
            background: "linear-gradient(135deg, #2A1D22, #6B1F3E)",
          }}
        >
          Tools
        </button>
        <button
          onClick={() => navigate("/admin/pricing")}
          style={{
            ...buttonBase,
            background: "linear-gradient(135deg, #AC5D7A, #7E3856)",
          }}
        >
          Pricing
        </button>
      </div>
    </div>
  );
}
