import { useState, useEffect } from "react";
import { useLocation } from "wouter";

type Booking = {
  id: number;
  clientName: string;
  phone: string;
  service: string;
  serviceLabel: string;
  preferredDate: string | null;
  flexibleDate: string;
  timePreference: string;
  status: "pending" | "confirmed" | "cancelled";
  totalEstimate: number | null;
  notes: string | null;
  addons: string | null;
  createdAt: string;
};

type AdminState =
  | { stage: "pin" }
  | { stage: "password" }
  | { stage: "dashboard"; token: string };

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#FEF9EC", color: "#B8860B" },
  confirmed: { bg: "#EEF7E9", color: "#3A6B28" },
  cancelled: { bg: "#FEECEC", color: "#B00020" },
};

function FilterTab({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 4px",
        border: "none",
        background: "none",
        cursor: "pointer",
        borderBottom: `2px solid ${active ? "#AC5D7A" : "transparent"}`,
        color: active ? "#AC5D7A" : "#7D6268",
        fontSize: 13,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}{" "}
      {count > 0 && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            backgroundColor: active ? "#AC5D7A" : "#E4D3D8",
            color: active ? "#fff" : "#7D6268",
            borderRadius: 10,
            padding: "1px 5px",
            marginLeft: 2,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<AdminState>({ stage: "pin" });
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("pending");
  const [updating, setUpdating] = useState<number | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("admin_access") !== "true") {
        navigate("/");
        return;
      }
    } catch {
      navigate("/");
      return;
    }

    setAccessChecked(true);
  }, [navigate]);

  useEffect(() => {
    if (state.stage === "dashboard") loadBookings(state.token);
  }, [state]);

  function handleLogout() {
    try {
      localStorage.removeItem("admin_access");
    } catch {
      // Ignore storage failures and still leave the admin route.
    }
    setState({ stage: "pin" });
    setPassword("");
    setPin("");
    navigate("/");
  }

  async function loadBookings(token: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/booking-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        handleLogout();
        return;
      }
      const data = (await res.json()) as Booking[];
      setBookings(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string, token: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/booking-requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = (await res.json()) as Booking;
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...updated } : b)),
        );
      }
    } catch {
      /* silent */
    } finally {
      setUpdating(null);
    }
  }

  function handlePinSubmit() {
    if (pin === "3658") {
      setPinError("");
      setState({ stage: "password" });
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
        localStorage.setItem("admin_access", "true");
        setState({ stage: "dashboard", token: data.token });
      } else {
        setPasswordError(data.error ?? "Incorrect password");
        setPassword("");
      }
    } catch {
      setPasswordError("Connection error. Try again.");
    }
  }

  if (!accessChecked) {
    return (
      <div
        style={{
          backgroundColor: "#F9F5F0",
          minHeight: "100vh",
        }}
      />
    );
  }

  const filtered = bookings.filter(
    (b) => filter === "all" || b.status === filter,
  );
  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };
  const token = state.stage === "dashboard" ? state.token : "";

  // PIN screen
  if (state.stage === "pin") {
    return (
      <div
        style={{
          backgroundColor: "#F9F5F0",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          animation: "adminFadeScale 220ms ease-out",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              backgroundColor: "#F3EAED",
              borderRadius: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#AC5D7A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#201B1C",
              marginBottom: 8,
            }}
          >
            Admin Access
          </p>
          <p style={{ fontSize: 13, color: "#7D6268", marginBottom: 28 }}>
            Enter your 4-digit PIN to continue
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
            autoFocus
            style={{
              width: "100%",
              padding: "16px",
              border: `1.5px solid ${pinError ? "#E04040" : "#E4D3D8"}`,
              borderRadius: 12,
              fontSize: 24,
              textAlign: "center",
              outline: "none",
              backgroundColor: "#fff",
              boxSizing: "border-box",
              letterSpacing: 8,
              color: "#201B1C",
            }}
          />
          {pinError && (
            <p style={{ color: "#E04040", fontSize: 12, marginTop: 8 }}>
              {pinError}
            </p>
          )}
          <button
            onClick={handlePinSubmit}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "15px 0",
              backgroundColor: "#AC5D7A",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Continue
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "#7D6268",
              fontSize: 13,
              cursor: "pointer",
              marginTop: 16,
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // Password screen
  if (state.stage === "password") {
    return (
      <div
        style={{
          backgroundColor: "#F9F5F0",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          animation: "adminFadeScale 220ms ease-out",
        }}
      >
        <div style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#201B1C",
              marginBottom: 8,
            }}
          >
            Admin Password
          </p>
          <p style={{ fontSize: 13, color: "#7D6268", marginBottom: 28 }}>
            Enter the admin password to view bookings
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
              padding: "16px 14px",
              border: `1.5px solid ${passwordError ? "#E04040" : "#E4D3D8"}`,
              borderRadius: 12,
              fontSize: 15,
              outline: "none",
              backgroundColor: "#fff",
              boxSizing: "border-box",
              color: "#201B1C",
            }}
          />
          {passwordError && (
            <p style={{ color: "#E04040", fontSize: 12, marginTop: 8 }}>
              {passwordError}
            </p>
          )}
          <button
            onClick={handlePasswordSubmit}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "15px 0",
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
          <button
            onClick={() => setState({ stage: "pin" })}
            style={{
              background: "none",
              border: "none",
              color: "#7D6268",
              fontSize: 13,
              cursor: "pointer",
              marginTop: 16,
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div
      style={{
        backgroundColor: "#F9F5F0",
        minHeight: "100vh",
        paddingBottom: 40,
        animation: "adminFadeScale 220ms ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 16px) 16px 0",
          backgroundColor: "#fff",
          borderBottom: "1px solid #E4D3D8",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7D6268",
              fontSize: 13,
            }}
          >
            Logout
          </button>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18,
              fontWeight: 700,
              color: "#201B1C",
            }}
          >
            Admin Dashboard
          </p>
          <button
            onClick={() => loadBookings(token)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7D6268"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 8,
            paddingBottom: 12,
          }}
        >
          {[
            {
              label: "Pending",
              value: counts.pending,
              color: "#B8860B",
              bg: "#FEF9EC",
            },
            {
              label: "Confirmed",
              value: counts.confirmed,
              color: "#3A6B28",
              bg: "#EEF7E9",
            },
            {
              label: "Cancelled",
              value: counts.cancelled,
              color: "#B00020",
              bg: "#FEECEC",
            },
            {
              label: "Total",
              value: counts.all,
              color: "#201B1C",
              bg: "#F3EAED",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                backgroundColor: s.bg,
                borderRadius: 10,
                padding: "8px 6px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: s.color,
                  margin: 0,
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: s.color,
                  fontWeight: 600,
                  margin: 0,
                  letterSpacing: 0.5,
                }}
              >
                {s.label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #F3EAED" }}>
          <FilterTab
            label="Pending"
            active={filter === "pending"}
            count={counts.pending}
            onClick={() => setFilter("pending")}
          />
          <FilterTab
            label="Confirmed"
            active={filter === "confirmed"}
            count={counts.confirmed}
            onClick={() => setFilter("confirmed")}
          />
          <FilterTab
            label="Cancelled"
            active={filter === "cancelled"}
            count={counts.cancelled}
            onClick={() => setFilter("cancelled")}
          />
          <FilterTab
            label="All"
            active={filter === "all"}
            count={counts.all}
            onClick={() => setFilter("all")}
          />
        </div>
      </div>

      {/* Bookings list */}
      <div style={{ padding: "12px 16px 0" }}>
        {loading ? (
          <div
            style={{ textAlign: "center", paddingTop: 48, color: "#7D6268" }}
          >
            Loading bookings…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ textAlign: "center", paddingTop: 48, color: "#7D6268" }}
          >
            <p style={{ fontSize: 14 }}>
              No {filter !== "all" ? filter : ""} bookings yet.
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const { bg, color } = STATUS_COLORS[b.status] ?? {
              bg: "#F3EAED",
              color: "#7D6268",
            };
            const dateLabel = b.preferredDate
              ? new Date(b.preferredDate + "T12:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "short", month: "short", day: "numeric" },
                )
              : b.flexibleDate === "true"
                ? "Flexible"
                : "No date";
            return (
              <div
                key={b.id}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #E4D3D8",
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#201B1C",
                        margin: 0,
                      }}
                    >
                      {b.clientName}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#7D6268",
                        margin: "2px 0 0",
                      }}
                    >
                      {b.phone}
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor: bg,
                      color,
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 50,
                    }}
                  >
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: "#201B1C", fontWeight: 500 }}
                  >
                    {b.serviceLabel}
                  </span>
                  <span style={{ fontSize: 12, color: "#7D6268" }}>·</span>
                  <span style={{ fontSize: 12, color: "#7D6268" }}>
                    {dateLabel}
                  </span>
                  {b.totalEstimate && (
                    <>
                      <span style={{ fontSize: 12, color: "#7D6268" }}>·</span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#D9A96A",
                          fontWeight: 600,
                        }}
                      >
                        ${b.totalEstimate}+
                      </span>
                    </>
                  )}
                </div>
                {b.notes && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#7D6268",
                      marginBottom: 10,
                      fontStyle: "italic",
                    }}
                  >
                    "{b.notes}"
                  </p>
                )}
                {b.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => updateStatus(b.id, "confirmed", token)}
                      disabled={updating === b.id}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        backgroundColor: "#EEF7E9",
                        color: "#3A6B28",
                        border: "1px solid #C6E3BD",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: updating === b.id ? 0.6 : 1,
                      }}
                    >
                      {updating === b.id ? "…" : "✓ Confirm"}
                    </button>
                    <button
                      onClick={() => updateStatus(b.id, "cancelled", token)}
                      disabled={updating === b.id}
                      style={{
                        flex: 1,
                        padding: "9px 0",
                        backgroundColor: "#FEECEC",
                        color: "#B00020",
                        border: "1px solid #F5BDBD",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: updating === b.id ? 0.6 : 1,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {b.status !== "pending" && (
                  <button
                    onClick={() => updateStatus(b.id, "pending", token)}
                    disabled={updating === b.id}
                    style={{
                      width: "100%",
                      padding: "9px 0",
                      backgroundColor: "#F3EAED",
                      color: "#7D6268",
                      border: "1px solid #E4D3D8",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: "pointer",
                      opacity: updating === b.id ? 0.6 : 1,
                    }}
                  >
                    Revert to pending
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
