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

type BookingFilter = "all" | BookingStatus;

function formatDate(value: string | null, flexibleDate: string) {
  if (value) {
    try {
      return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return value;
    }
  }
  return flexibleDate === "true" ? "Flexible date" : "No date";
}

function formatSubmitted(value: string) {
  if (!value) return "Recently submitted";
  try {
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function csvSafe(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function makeCsv(bookings: Booking[]) {
  const headers = [
    "ID",
    "Status",
    "Client Name",
    "Phone",
    "Service",
    "Date",
    "Time Preference",
    "Estimate",
    "Deposit",
    "Add-ons",
    "Notes",
    "Submitted",
  ];

  const rows = bookings.map((booking) => [
    booking.id,
    booking.status,
    booking.clientName,
    booking.phone,
    booking.serviceLabel,
    formatDate(booking.preferredDate, booking.flexibleDate),
    booking.timePreference || "flexible",
    booking.totalEstimate ? `$${booking.totalEstimate}+` : "",
    "$25 required",
    booking.addons || "",
    booking.notes || "",
    formatSubmitted(booking.createdAt),
  ]);

  return [headers, ...rows].map((row) => row.map(csvSafe).join(",")).join("\n");
}

function downloadCsv(bookings: Booking[]) {
  const csv = makeCsv(bookings);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ravishing-beaute-bookings-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AdminTools() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BookingFilter>("all");
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
        setPasswordError("Please sign in again to view booking tools.");
        return;
      }

      const data = (await response.json()) as Booking[];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setNotice("Could not load bookings. Check the deployment and try again.");
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const statusMatch = filter === "all" || booking.status === filter;
      const text = [
        booking.clientName,
        booking.phone,
        booking.serviceLabel,
        booking.status,
        booking.preferredDate,
        booking.timePreference,
        booking.notes,
        booking.addons,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return statusMatch && (!q || text.includes(q));
    });
  }, [bookings, filter, search]);

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    archived: bookings.filter((b) => b.status === "archived").length,
  };

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20, boxShadow: "0 18px 40px rgba(82,42,57,0.08)" }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Booking Tools</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to search and export bookings.</p>
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
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>BOOKING RECORDS</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Admin Tools</p>
          </div>
          <button onClick={() => loadBookings(token)} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <button
            onClick={() => downloadCsv(filteredBookings)}
            disabled={filteredBookings.length === 0}
            style={{ padding: "13px 10px", border: "none", borderRadius: 13, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 13, fontWeight: 800, opacity: filteredBookings.length === 0 ? 0.55 : 1 }}
          >
            Export Results CSV
          </button>
          <button
            onClick={() => downloadCsv(bookings)}
            disabled={bookings.length === 0}
            style={{ padding: "13px 10px", border: "1px solid #E4D3D8", borderRadius: 13, backgroundColor: "#fff", color: "#201B1C", fontSize: 13, fontWeight: 800, opacity: bookings.length === 0 ? 0.55 : 1 }}
          >
            Export All CSV
          </button>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, phone, service, notes..."
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 13, backgroundColor: "#fff", fontSize: 14, outline: "none", marginBottom: 10 }}
        />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
          {[
            ["all", `All ${counts.all}`],
            ["pending", `Pending ${counts.pending}`],
            ["confirmed", `Confirmed ${counts.confirmed}`],
            ["cancelled", `Cancelled ${counts.cancelled}`],
            ["archived", `Archive ${counts.archived}`],
          ].map(([value, label]) => {
            const selected = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value as BookingFilter)}
                style={{ flex: "0 0 auto", border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`, backgroundColor: selected ? "#AC5D7A" : "#fff", color: selected ? "#fff" : "#7D6268", borderRadius: 999, padding: "9px 13px", fontSize: 12, fontWeight: 800 }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {notice && <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", color: "#8A6509", borderRadius: 12, padding: 10, fontSize: 12, marginBottom: 10 }}>{notice}</div>}

        <p style={{ fontSize: 12, color: "#7D6268", marginBottom: 10 }}>
          Showing {filteredBookings.length} of {bookings.length} booking records.
        </p>

        {loading ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>Loading bookings…</p>
        ) : filteredBookings.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>No matching records found.</p>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: "#201B1C", marginBottom: 2 }}>{booking.clientName}</p>
                  <p style={{ fontSize: 12, color: "#7D6268" }}>{booking.phone}</p>
                </div>
                <span style={{ backgroundColor: "#F3EAED", color: "#7D6268", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800 }}>{booking.status}</span>
              </div>
              <p style={{ fontSize: 13, color: "#201B1C", fontWeight: 700, marginBottom: 4 }}>{booking.serviceLabel}</p>
              <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.45 }}>
                {formatDate(booking.preferredDate, booking.flexibleDate)} • {booking.timePreference || "flexible"} • {booking.totalEstimate ? `$${booking.totalEstimate}+` : "No estimate"}
              </p>
              {booking.notes && <p style={{ fontSize: 12, color: "#5E4B51", lineHeight: 1.45, marginTop: 8, fontStyle: "italic" }}>{booking.notes}</p>}
              <p style={{ fontSize: 11, color: "#9A7D85", marginTop: 8 }}>Submitted {formatSubmitted(booking.createdAt)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
