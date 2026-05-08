import { useRef } from "react";
import { useLocation } from "wouter";

const ADMIN_TAP_TARGET = 7;
const ADMIN_TAP_WINDOW_MS = 4000;

const tabs = [
  { path: "/", icon: HomeIcon, label: "Home" },
  { path: "/gallery", icon: GalleryIcon, label: "Gallery" },
  { path: "/services", icon: ScissorsIcon, label: "Services" },
  { path: "/book", icon: CalendarIcon, label: "Book" },
  { path: "/about", icon: UserIcon, label: "About" },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#AC5D7A" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function GalleryIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#AC5D7A" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
function ScissorsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#AC5D7A" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
    </svg>
  );
}
function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#AC5D7A" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#AC5D7A" : "#9CA3AF"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const bookTapCount = useRef(0);
  const bookTapStartedAt = useRef(0);
  const bookTapResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function resetBookTapTrigger() {
    bookTapCount.current = 0;
    bookTapStartedAt.current = 0;
    if (bookTapResetTimer.current) {
      clearTimeout(bookTapResetTimer.current);
      bookTapResetTimer.current = null;
    }
  }

  function handleBookTap() {
    const now = Date.now();

    if (
      !bookTapStartedAt.current ||
      now - bookTapStartedAt.current > ADMIN_TAP_WINDOW_MS
    ) {
      bookTapStartedAt.current = now;
      bookTapCount.current = 0;
    }

    bookTapCount.current += 1;

    if (bookTapResetTimer.current) clearTimeout(bookTapResetTimer.current);
    bookTapResetTimer.current = setTimeout(
      resetBookTapTrigger,
      ADMIN_TAP_WINDOW_MS,
    );

    if (bookTapCount.current >= ADMIN_TAP_TARGET) {
      resetBookTapTrigger();
      try {
        localStorage.setItem("admin_access", "true");
        if ("vibrate" in navigator) navigator.vibrate(12);
      } catch {
        // Ignore storage or haptic failures so mobile PWA navigation still works.
      }
      navigate("/admin");
      return;
    }

    navigate("/book");
  }

  if (location === "/admin") return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        borderTop: "1px solid #E4D3D8",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        const active = location === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => {
              if (tab.path === "/book") {
                handleBookTap();
                return;
              }
              resetBookTapTrigger();
              navigate(tab.path);
            }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              paddingTop: 10,
              paddingBottom: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Icon active={active} />
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                color: active ? "#AC5D7A" : "#9CA3AF",
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
