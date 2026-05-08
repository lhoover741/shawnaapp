import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api";
import { requestAndSubscribe } from "@/lib/push";
import { DEPOSIT_NOTE, HAIR_INCLUDED_NOTE, SERVICES } from "@/lib/services";

const BASE = import.meta.env.BASE_URL;

type Review = {
  id: number;
  clientName: string;
  rating: number;
  body: string;
  service: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill={i <= rating ? "#D9A96A" : "#E4D3D8"}
          stroke={i <= rating ? "#D9A96A" : "#E4D3D8"}
          strokeWidth="1"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authStage, setAuthStage] = useState<"pin" | "password">("pin");
  const [pushStatus, setPushStatus] = useState<
    "idle" | "saved" | "denied" | "error"
  >("idle");
  const [pushMessage, setPushMessage] = useState("");
  const [pushBusy, setPushBusy] = useState(false);

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["featured-reviews"],
    queryFn: () => fetchJson<Review[]>("/reviews/featured"),
  });

  function handleLogoTap() {
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    logoTapCount.current += 1;
    if (logoTapCount.current >= 7) {
      logoTapCount.current = 0;
      setPin("");
      setPinError("");
      setShowPinModal(true);
    } else {
      logoTapTimer.current = setTimeout(() => {
        logoTapCount.current = 0;
      }, 2500);
    }
  }

  function handlePinSubmit() {
    if (pin === "3658") {
      setPinError("");
      setAuthStage("password");
    } else {
      setPinError("Incorrect PIN");
      setPin("");
    }
  }

  async function handlePasswordSubmit() {
    setPasswordError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (res.ok && data.token) {
        setShowPinModal(false);
        setAuthStage("pin");
        navigate("/admin");
      } else {
        setPasswordError(data.error ?? "Incorrect password");
        setPassword("");
      }
    } catch {
      setPasswordError("Connection error. Try again.");
    }
  }

  async function handleEnableNotifications() {
    setPushBusy(true);
    setPushStatus("idle");
    setPushMessage("");
    try {
      const result = await requestAndSubscribe();
      setPushMessage(result.message);
      if (result.status === "success") {
        setPushStatus("saved");
      } else if (
        result.status === "denied" ||
        result.status === "unsupported"
      ) {
        setPushStatus("denied");
      } else {
        setPushStatus("error");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn’t enable notifications right now.";
      setPushMessage(message);
      setPushStatus("error");
    } finally {
      setPushBusy(false);
    }
  }

  useEffect(() => {
    if (pushStatus !== "saved") return;
    const timer = setTimeout(() => {
      setPushStatus("idle");
      setPushMessage("");
    }, 5000);
    return () => clearTimeout(timer);
  }, [pushStatus]);

  const GALLERY_IMGS = [
    "braids-1.jpg",
    "braids-2.jpg",
    "client-1.jpg",
    "hero-1.jpg",
    "hero-2.jpg",
    "style-1.jpg",
  ];

  return (
    <div
      style={{
        backgroundColor: "#F9F5F0",
        minHeight: "100vh",
        paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Hero */}
      <div style={{ position: "relative", height: 460 }}>
        <img
          src={`${BASE}shawna.jpg`}
          alt="Shawna"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(10,4,7,0.55) 0%, rgba(10,4,7,0.1) 40%, rgba(10,4,7,0.8) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "env(safe-area-inset-top, 0px) 20px 36px",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
          }}
        >
          {/* Logo */}
          <div
            style={{ display: "flex", justifyContent: "center" }}
            onClick={handleLogoTap}
          >
            <img
              src={`${BASE}logo-cropped.png`}
              alt="Ravishing Beauté"
              style={{ height: 160, objectFit: "contain", cursor: "default" }}
            />
          </div>
          {/* Bottom text */}
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                fontSize: 10,
                letterSpacing: 3,
                marginBottom: 10,
                fontWeight: 500,
              }}
            >
              CALUMET CITY / NWI
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              Premium braiding, weaves & natural styling by appointment
            </p>
            <button
              onClick={() => navigate("/book")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#fff",
                color: "#AC5D7A",
                padding: "13px 28px",
                borderRadius: 50,
                border: "none",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Request Appointment
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#AC5D7A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 24px" }}>
        <div
          style={{
            backgroundColor: "#FFF",
            border: "1px solid #E4D3D8",
            borderRadius: 16,
            padding: 16,
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: "#7D6268",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            NOTIFICATIONS
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#201B1C",
              marginBottom: 6,
            }}
          >
            Get booking updates on your phone
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#7D6268",
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            Turn on browser notifications so you’ll know when your appointment
            is confirmed, updated, or canceled.
          </p>
          <button
            onClick={handleEnableNotifications}
            disabled={pushBusy}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 12,
              padding: "12px 14px",
              backgroundColor: "#AC5D7A",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: pushBusy ? "default" : "pointer",
              opacity: pushBusy ? 0.8 : 1,
            }}
          >
            {pushBusy ? "Enabling..." : "Enable Notifications"}
          </button>
          {pushStatus === "saved" && (
            <p style={{ marginTop: 10, fontSize: 12, color: "#2E7D32" }}>
              {pushMessage || "Notifications enabled."}
            </p>
          )}
          {pushStatus === "denied" && (
            <p style={{ marginTop: 10, fontSize: 12, color: "#9C5070" }}>
              {pushMessage || "Notifications were not enabled."}
            </p>
          )}
          {pushStatus === "error" && (
            <p style={{ marginTop: 10, fontSize: 12, color: "#C0392B" }}>
              {pushMessage || "Couldn’t enable notifications right now."}
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate("/debug")}
            style={{
              marginTop: 10,
              width: "100%",
              border: "1px solid #E4D3D8",
              borderRadius: 12,
              padding: "10px 14px",
              backgroundColor: "#FFF7FA",
              color: "#7D6268",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Push Debug
          </button>
        </div>
      </div>

      {/* Services preview */}
      <div style={{ padding: "24px 16px 24px" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2.5,
            color: "#7D6268",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          POPULAR SERVICES
        </p>
        <p
          style={{
            fontSize: 22,
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: "#201B1C",
            marginBottom: 8,
          }}
        >
          Book a Service
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#7D6268",
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {DEPOSIT_NOTE} {HAIR_INCLUDED_NOTE}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {SERVICES.filter((service) =>
            [
              "medium-knotless",
              "fulani-braids",
              "middle-part-quick-weave",
            ].includes(service.id),
          ).map((s) => (
            <button
              key={s.id}
              onClick={() =>
                navigate(`/book?service=${encodeURIComponent(s.id)}`)
              }
              style={{
                backgroundColor: "#fff",
                border: "1px solid #E4D3D8",
                borderRadius: 16,
                padding: 14,
                textAlign: "left",
                cursor: "pointer",
                display: "grid",
                gridTemplateColumns: "40px 1fr auto",
                gap: 12,
                alignItems: "center",
                boxShadow: "0 10px 24px rgba(82,42,57,0.05)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#F3EAED",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#AC5D7A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                </svg>
              </div>
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#201B1C",
                    lineHeight: 1.25,
                  }}
                >
                  {s.name}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "#7D6268",
                    marginTop: 3,
                  }}
                >
                  {s.duration} · {s.group}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#B9874D" }}>
                {s.priceLabel}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate("/services")}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "12px 0",
            border: "1px solid #E4D3D8",
            borderRadius: 10,
            background: "none",
            color: "#AC5D7A",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          View All Services
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#AC5D7A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Gallery strip */}
      <div style={{ paddingTop: 24 }}>
        <div style={{ padding: "0 16px 12px" }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: 2.5,
              color: "#7D6268",
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            RECENT WORK
          </p>
          <p
            style={{
              fontSize: 22,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              color: "#201B1C",
            }}
          >
            Gallery
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingLeft: 16,
            paddingRight: 16,
            scrollbarWidth: "none",
          }}
        >
          {GALLERY_IMGS.map((img) => (
            <img
              key={img}
              src={`${BASE}${img}`}
              alt=""
              onClick={() => navigate("/gallery")}
              style={{
                width: 150,
                height: 185,
                objectFit: "cover",
                borderRadius: 12,
                flexShrink: 0,
                cursor: "pointer",
              }}
            />
          ))}
        </div>
        <div style={{ padding: "0 16px 24px" }}>
          <button
            onClick={() => navigate("/gallery")}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 0",
              border: "1px solid #E4D3D8",
              borderRadius: 10,
              background: "none",
              color: "#AC5D7A",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            View Full Gallery
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AC5D7A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* About teaser */}
      <button
        onClick={() => navigate("/about")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "20px 16px 0",
          backgroundColor: "#FDF0F5",
          border: "1px solid #E4C9D5",
          borderRadius: 16,
          padding: 18,
          cursor: "pointer",
          textAlign: "left",
          width: "calc(100% - 32px)",
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: 2,
              color: "#9C5070",
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            YOUR STYLIST
          </p>
          <p
            style={{
              fontSize: 18,
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              color: "#6B1F3E",
              marginBottom: 4,
            }}
          >
            Meet Shawna
          </p>
          <p style={{ fontSize: 12, color: "#9C5070", lineHeight: 1.5 }}>
            Owner & master braider serving Calumet City / NWI — protective
            styles done right.
          </p>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#AC5D7A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Reviews */}
      <div style={{ padding: "24px 16px 0" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2.5,
            color: "#7D6268",
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          WHAT CLIENTS SAY
        </p>
        <p
          style={{
            fontSize: 22,
            fontFamily: "'Playfair Display', serif",
            fontWeight: 600,
            color: "#201B1C",
            marginBottom: 16,
          }}
        >
          Reviews
        </p>
        {reviews && reviews.length > 0 ? (
          reviews.slice(0, 2).map((r) => (
            <div
              key={r.id}
              style={{
                backgroundColor: "#fff",
                border: "1px solid #E4D3D8",
                borderRadius: 12,
                padding: 16,
                marginBottom: 10,
              }}
            >
              <Stars rating={r.rating} />
              <p
                style={{
                  fontSize: 13,
                  color: "#201B1C",
                  lineHeight: 1.6,
                  fontStyle: "italic",
                  margin: "8px 0",
                }}
              >
                "{r.body}"
              </p>
              <p style={{ fontSize: 11, color: "#7D6268", fontWeight: 500 }}>
                {r.clientName} · {r.service}
              </p>
            </div>
          ))
        ) : (
          <div
            style={{ textAlign: "center", padding: "24px 0", color: "#7D6268" }}
          >
            <p style={{ fontSize: 14 }}>Reviews coming soon</p>
          </div>
        )}
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div
          onClick={() => setShowPinModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "20px 20px 0 0",
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            {authStage === "pin" ? (
              <>
                <p
                  style={{
                    textAlign: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Admin Access
                </p>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "#7D6268",
                    marginBottom: 20,
                  }}
                >
                  Enter your PIN to continue
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setPinError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                  placeholder="• • • •"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: `1px solid ${pinError ? "#E04040" : "#E4D3D8"}`,
                    borderRadius: 12,
                    fontSize: 20,
                    textAlign: "center",
                    outline: "none",
                    backgroundColor: "#F9F5F0",
                    boxSizing: "border-box",
                    letterSpacing: 8,
                  }}
                  autoFocus
                />
                {pinError && (
                  <p
                    style={{
                      color: "#E04040",
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {pinError}
                  </p>
                )}
                <button
                  onClick={handlePinSubmit}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: "14px 0",
                    backgroundColor: "#AC5D7A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Enter
                </button>
              </>
            ) : (
              <>
                <p
                  style={{
                    textAlign: "center",
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Admin Password
                </p>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "#7D6268",
                    marginBottom: 20,
                  }}
                >
                  Enter the admin password to continue
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                  placeholder="Password"
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    border: `1px solid ${passwordError ? "#E04040" : "#E4D3D8"}`,
                    borderRadius: 12,
                    fontSize: 15,
                    outline: "none",
                    backgroundColor: "#F9F5F0",
                    boxSizing: "border-box",
                  }}
                />
                {passwordError && (
                  <p
                    style={{
                      color: "#E04040",
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {passwordError}
                  </p>
                )}
                <button
                  onClick={handlePasswordSubmit}
                  style={{
                    width: "100%",
                    marginTop: 16,
                    padding: "14px 0",
                    backgroundColor: "#AC5D7A",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
