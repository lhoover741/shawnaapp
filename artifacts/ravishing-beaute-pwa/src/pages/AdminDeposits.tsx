import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "archived";

type Booking = {
  id: number;
  clientName: string;
  phone: string;
  serviceLabel: string;
  preferredDate: string | null;
  flexibleDate: string;
  timePreference: string;
  status: BookingStatus;
  depositPaid?: boolean;
  depositPaidAt?: string | null;
  totalEstimate: number | null;
  createdAt: string;
};

type DepositFilter = "due" | "paid" | "all";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function dateLabel(booking: Booking) {
  if (!booking.preferredDate) return booking.flexibleDate === "true" ? "Flexible date" : "Date not selected";
  try {
    return new Date(`${booking.preferredDate}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return booking.preferredDate;
  }
}

function appleCashMessage(booking: Booking) {
  return `Hi ${booking.clientName}, this is Shawna with Ravishing Beauté. Your $25 deposit is needed to secure your ${booking.serviceLabel} appointment request for ${dateLabel(booking)}. You can tap the $25 amount in this iMessage and send it with Apple Cash. Please reply once sent.`;
}

export default function AdminDeposits() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<DepositFilter>("due");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("admin_token");
      const hasAccess = localStorage.getItem("admin_access") === "true";
      if (savedToken) setToken(savedToken);
      else if (hasAccess) setToken("admin-authenticated");
    } catch {
      // Stay on password screen.
    }
  }, []);

  useEffect(() => {
    if (token) {
      void loadBookings(token);
    }
  }, [token]);

  async function login() {
    setPasswordError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { token?: string; error?: string };
      if (!response.ok || !data.token) {
        setPasswordError(data.error ?? "Incorrect password");
        setPassword("");
        return;
      }
      localStorage.setItem("admin_access", "true");
      localStorage.setItem("admin_token", data.token);
      setToken(data.token);
    } catch {
      setPasswordError("Connection error. Try again.");
    }
  }

  async function loadBookings(authToken: string) {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/booking-requests", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not load bookings");
      const data = (await response.json()) as Booking[];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setNotice("Could not load deposit records.");
    } finally {
      setLoading(false);
    }
  }

  async function setDepositPaid(bookingId: number, depositPaid: boolean) {
    setUpdating(bookingId);
    try {
      const response = await fetch(`/api/admin/booking-requests/${bookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ depositPaid }),
      });
      if (!response.ok) throw new Error("Could not update deposit");
      const updated = (await response.json()) as Booking;
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, ...updated } : b)));
    } catch {
      setNotice("Could not update deposit status.");
    } finally {
      setUpdating(null);
    }
  }

  const activeBookings = bookings.filter((booking) => booking.status !== "archived" && booking.status !== "cancelled");
  const shownBookings = useMemo(() => {
    return activeBookings.filter((booking) => {
      if (filter === "paid") return Boolean(booking.depositPaid);
      if (filter === "due") return !booking.depositPaid;
      return true;
    });
  }, [activeBookings, filter]);

  const counts = {
    due: activeBookings.filter((booking) => !booking.depositPaid).length,
    paid: activeBookings.filter((booking) => booking.depositPaid).length,
    all: activeBookings.length,
  };

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Deposit Tracking</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to manage deposits.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && login()}
            placeholder="Admin password"
            style={{ width: "100%", boxSizing: "border-box", padding: "14px", border: `1.5px solid ${passwordError ? "#E04040" : "#E4D3D8"}`, borderRadius: 12, fontSize: 15, outline: "none", marginBottom: 10 }}
          />
          {passwordError && <p style={{ color: "#E04040", fontSize: 12, marginBottom: 10 }}>{passwordError}</p>}
          <button onClick={login} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 15, fontWeight: 800 }}>Sign In</button>
          <button onClick={() => navigate("/admin")} style={{ width: "100%", padding: "12px 0 0", border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>← Admin</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>APPLE CASH</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Deposit Tracking</p>
          </div>
          <button onClick={() => { void loadBookings(token); }} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700 }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>IMESSAGE APPLE CASH REQUEST</p>
          <p style={{ fontSize: 12.5, color: "#6E565C", lineHeight: 1.45 }}>
            Tap Apple Cash Text to open iMessage with a $25 deposit message. The client can tap the $25 amount in iMessage and send through Apple Cash. Apple does not allow websites to auto-send the Apple Cash payment bubble for security.
          </p>
          {notice && <p style={{ fontSize: 12, color: "#7D6268", marginTop: 8 }}>{notice}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            ["due", `Due ${counts.due}`],
            ["paid", `Paid ${counts.paid}`],
            ["all", `All ${counts.all}`],
          ].map(([value, label]) => {
            const selected = filter === value;
            return (
              <button key={value} onClick={() => setFilter(value as DepositFilter)} style={{ border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`, backgroundColor: selected ? "#AC5D7A" : "#fff", color: selected ? "#fff" : "#7D6268", borderRadius: 999, padding: "10px 8px", fontSize: 12, fontWeight: 800 }}>{label}</button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>Loading deposits…</p>
        ) : shownBookings.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>No deposit records found.</p>
        ) : (
          shownBookings.map((booking) => {
            const phoneDigits = digits(booking.phone);
            const smsHref = `sms:${phoneDigits || booking.phone}?body=${encodeURIComponent(appleCashMessage(booking))}`;
            return (
              <div key={booking.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#201B1C", marginBottom: 2 }}>{booking.clientName}</p>
                    <p style={{ fontSize: 12, color: "#7D6268" }}>{booking.phone}</p>
                  </div>
                  <span style={{ backgroundColor: booking.depositPaid ? "#EEF7E9" : "#FEF9EC", color: booking.depositPaid ? "#3A6B28" : "#B8860B", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900 }}>{booking.depositPaid ? "Paid" : "Due"}</span>
                </div>
                <p style={{ fontSize: 13, color: "#201B1C", fontWeight: 800, marginBottom: 4 }}>{booking.serviceLabel}</p>
                <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.45, marginBottom: 10 }}>{dateLabel(booking)} • {booking.timePreference || "flexible"} • $25 deposit</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <a href={smsHref} style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, backgroundColor: "#FEF9EC", color: "#8A6509", border: "1px solid #EDD9A3", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Apple Cash Text</a>
                  <button onClick={() => setDepositPaid(booking.id, !booking.depositPaid)} disabled={updating === booking.id} style={{ padding: "10px 0", borderRadius: 10, backgroundColor: booking.depositPaid ? "#FEECEC" : "#EEF7E9", color: booking.depositPaid ? "#B00020" : "#3A6B28", border: `1px solid ${booking.depositPaid ? "#F5BDBD" : "#C6E3BD"}`, fontSize: 13, fontWeight: 800, opacity: updating === booking.id ? 0.6 : 1 }}>{booking.depositPaid ? "Mark Unpaid" : "Mark Paid"}</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
