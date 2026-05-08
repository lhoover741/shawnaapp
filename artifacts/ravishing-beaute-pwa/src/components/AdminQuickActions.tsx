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
      <button
        onClick={() => navigate("/admin/pricing")}
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "15px 18px",
          border: "1px solid rgba(255,255,255,0.28)",
          borderRadius: 18,
          background: "linear-gradient(135deg, #AC5D7A, #7E3856)",
          color: "#fff",
          boxShadow: "0 18px 42px rgba(82,42,57,0.28)",
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 0.2,
          cursor: "pointer",
          pointerEvents: "auto",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        Pricing Manager
      </button>
    </div>
  );
}
