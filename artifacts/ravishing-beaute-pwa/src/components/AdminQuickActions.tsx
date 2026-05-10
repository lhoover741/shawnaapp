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

const actions = [
  { label: "Gallery", path: "/admin/gallery", bg: "linear-gradient(135deg, #AC5D7A, #7E3856)" },
  { label: "Notify", path: "/admin/notifications", bg: "linear-gradient(135deg, #97AFB0, #49595A)" },
  { label: "Deposits", path: "/admin/deposits", bg: "linear-gradient(135deg, #3A6B28, #1E3A17)" },
  { label: "Schedule", path: "/admin/schedule", bg: "linear-gradient(135deg, #B9874D, #7A5C1E)" },
  { label: "Reviews", path: "/admin/reviews", bg: "linear-gradient(135deg, #7A3D6E, #3E1E38)" },
  { label: "Avail.", path: "/admin/availability", bg: "linear-gradient(135deg, #8F4864, #522A39)" },
  { label: "Settings", path: "/admin/settings", bg: "linear-gradient(135deg, #49595A, #263133)" },
  { label: "Notes", path: "/admin/notes", bg: "linear-gradient(135deg, #49595A, #222D2F)" },
  { label: "Pricing", path: "/admin/pricing", bg: "linear-gradient(135deg, #2A1D22, #6B1F3E)" },
];

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
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            style={{
              ...buttonBase,
              background: action.bg,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
