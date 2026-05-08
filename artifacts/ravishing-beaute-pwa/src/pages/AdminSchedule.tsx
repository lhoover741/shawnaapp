import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "archived";

type Booking = {
  id: number;
  clientName: string;
  phone: string;
  service: string;
  serviceLabel: string;
  preferredDate: string | null;
  flexibleDate: string;
  timePreference: string;
  status: BookingStatus;
  totalEstimate: number | null;
  notes: string | null;
  addons: string | null;
  createdAt: string;
};

type ScheduleFilter = "confirmed" | "pending" | "all";

function getDateKey(value: string | null) {
  return value || "unscheduled";
}

function getDateLabel(value: string | null, flexibleDate: string) {
  if (!value) return flexibleDate === "true" ? "Flexible date" : "No date selected";

  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function getShortDateLabel(value: string | null, flexibleDate: string) {
  if (!value) return flexibleDate === "true" ? "Flexible" : "No date";

  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function getTimeLabel(value: string) {
  if (value === "morning") return "Morning · 8:30 AM–12 PM";
  if (value === "afternoon") return "Afternoon · 12 PM–6 PM";
  return "Flexible time";
}

function getDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isToday(date: string | null) {
  if (!date) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(`${date}T12:00:00`);
  return target.toDateString() === today.toDateString();
}

function isTomorrow(date: string | null) {
  if (!date) return false;
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const target = new Date(`${date}T12:00:00`);
  return target.toDateString() === tomorrow.toDateString();
}

function sectionTitle(date: string | null, flexibleDate: string) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return getDateLabel(date, flexibleDate);
}

function sortBookings(a: Booking, b: Booking) {
  const aDate = a.preferredDate || "9999-12-31";
  const bDate = b.preferredDate || "9999-12-31";
  if (aDate !== bDate) return aDate.localeCompare(bDate);
  return a.timePreference.localeCompare(b.timePreference);
}

export default function AdminSchedule() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<ScheduleFilter>("confirmed");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("admin_token");
      const hasAccess = localStorage.getItem("admin_access") === "true";
      if (savedToken) setToken(savedToken);
      else if (hasAccess) setToken("admin-authenticated");
    } catch {
      // Continue to password prompt.
    }
  }, []);

  useEffect(() => {
    if (token) void loadBookings(token);
  }, [token]);

  async function handleLogin() {
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

      try {
        localStorage.setItem("admin_access", "true");
        localStorage.setItem("admin_token", data.token);
      } catch {
        // Ignore storage failures.
      }
      setToken(data.token);
    } catch {
      setPasswordError("Connection error. Try again.");
    }
  }

  async function loadBookings(authToken: string) {
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/booking-requests", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });

      if (!response.ok) {
        setToken("");
        setPasswordError("Please sign in again to view the schedule.");
        return;
      }

      const data = (await response.json()) as Booking[];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setNotice("Could not load schedule. Check the deployment and try again.");
    } finally {
      setLoading(false);
    }
  }

  const scheduleBookings = useMemo(() => {
    return bookings
      .filter((booking) => {
        if (booking.status === "archived" || booking.status === "cancelled") return false;
        if (filter === "confirmed") return booking.status === "confirmed";
        if (filter === "pending") return booking.status === "pending";
        return booking.status === "confirmed" || booking.status === "pending";
      })
      .sort(sortBookings);
  }, [bookings, filter]);

  const grouped = useMemo(() => {
    return scheduleBookings.reduce<Record<string, Booking[]>>((groups, booking) => {
      const key = getDateKey(booking.preferredDate);
      groups[key] = [...(groups[key] ?? []), booking];
      return groups;
    }, {});
  }, [scheduleBookings]);

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return a.localeCompare(b);
  });

  const counts = {
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    all: bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length,
  };

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20, boxShadow: "0 18px 40px rgba(82,42,57,0.08)" }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Schedule View</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to view upcoming appointments.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleLogin()}
            placeholder="Admin password"
            style={{ width: "100%", boxSizing: "border-box", padding: "14px", border: `1.5px solid ${passwordError ? "#E04040" : "#E4D3D8"}`, borderRadius: 12, fontSize: 15, outline: "none", marginBottom: 10 }}
          />
          {passwordError && <p style={{ color: "#E04040", fontSize: 12, marginBottom: 10 }}>{passwordError}</p>}
          <button onClick={handleLogin} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 15, fontWeight: 800 }}>Sign In</button>
          <button onClick={() => navigate("/admin")} style={{ width: "100%", padding: "12px 0 0", border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, cursor: "pointer" }}>← Admin</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>UPCOMING</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Schedule View</p>
          </div>
          <button onClick={() => loadBookings(token)} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            ["confirmed", `Confirmed ${counts.confirmed}`],
            ["pending", `Pending ${counts.pending}`],
            ["all", `All ${counts.all}`],
          ].map(([value, label]) => {
            const selected = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value as ScheduleFilter)}
                style={{ border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`, backgroundColor: selected ? "#AC5D7A" : "#fff", color: selected ? "#fff" : "#7D6268", borderRadius: 999, padding: "10px 8px", fontSize: 12, fontWeight: 800 }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {notice && <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", color: "#8A6509", borderRadius: 12, padding: 10, fontSize: 12, marginBottom: 10 }}>{notice}</div>}

        {loading ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>Loading schedule…</p>
        ) : groupKeys.length === 0 ? (
          <div style={{ backgroundColor: "#fff", border: "1px dashed #D8C3C9", borderRadius: 16, padding: 20, textAlign: "center", marginTop: 16 }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, color: "#201B1C", marginBottom: 6 }}>No appointments shown</p>
            <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5 }}>Confirmed bookings with dates will appear here. Pending requests can also be viewed by switching filters.</p>
          </div>
        ) : (
          groupKeys.map((key) => {
            const first = grouped[key][0];
            return (
              <section key={key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 2px 9px" }}>
                  <p style={{ fontSize: 12, letterSpacing: 1.4, color: "#7D6268", fontWeight: 900, textTransform: "uppercase" }}>
                    {sectionTitle(key === "unscheduled" ? null : key, first.flexibleDate)}
                  </p>
                  <span style={{ fontSize: 11, color: "#AC5D7A", fontWeight: 800 }}>{grouped[key].length} item{grouped[key].length === 1 ? "" : "s"}</span>
                </div>

                {grouped[key].map((booking) => {
                  const phoneDigits = getDigits(booking.phone);
                  return (
                    <div key={booking.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 16, fontWeight: 800, color: "#201B1C", marginBottom: 3 }}>{booking.clientName}</p>
                          <p style={{ fontSize: 12, color: "#7D6268" }}>{booking.phone}</p>
                        </div>
                        <span style={{ backgroundColor: booking.status === "confirmed" ? "#EEF7E9" : "#FEF9EC", color: booking.status === "confirmed" ? "#3A6B28" : "#B8860B", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800 }}>{booking.status}</span>
                      </div>

                      <div style={{ backgroundColor: "#FFFBFA", border: "1px solid #F3EAED", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                        <p style={{ fontSize: 13, color: "#201B1C", fontWeight: 800, marginBottom: 5 }}>{booking.serviceLabel}</p>
                        <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.45 }}>{getShortDateLabel(booking.preferredDate, booking.flexibleDate)} • {getTimeLabel(booking.timePreference)}</p>
                        <p style={{ fontSize: 12, color: "#B9874D", fontWeight: 800, marginTop: 5 }}>{booking.totalEstimate ? `$${booking.totalEstimate}+` : "Estimate not listed"} • $25 deposit</p>
                      </div>

                      {booking.notes && <p style={{ fontSize: 12, color: "#5E4B51", lineHeight: 1.45, marginBottom: 10, fontStyle: "italic" }}>{booking.notes}</p>}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        <a href={`sms:${phoneDigits || booking.phone}`} style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, backgroundColor: "#F3EAED", color: "#AC5D7A", border: "1px solid #E4D3D8", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Text</a>
                        <a href={`tel:${phoneDigits || booking.phone}`} style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, backgroundColor: "#F9F5F0", color: "#201B1C", border: "1px solid #E4D3D8", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Call</a>
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
