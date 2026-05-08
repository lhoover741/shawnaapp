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
  totalEstimate: number | null;
  notes: string | null;
  createdAt: string;
};

function noteKey(id: number) {
  return `rb_admin_note_${id}`;
}

function dateLabel(booking: Booking) {
  if (!booking.preferredDate) return booking.flexibleDate === "true" ? "Flexible date" : "No date selected";
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

export default function AdminNotes() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
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
    if (token) void loadBookings(token);
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
    setNotice("");
    try {
      const response = await fetch("/api/admin/booking-requests", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not load bookings");
      const data = (await response.json()) as Booking[];
      const bookingList = Array.isArray(data) ? data : [];
      setBookings(bookingList);
      const savedNotes: Record<number, string> = {};
      bookingList.forEach((booking) => {
        savedNotes[booking.id] = localStorage.getItem(noteKey(booking.id)) ?? "";
      });
      setNotes(savedNotes);
    } catch {
      setNotice("Could not load booking notes.");
    } finally {
      setLoading(false);
    }
  }

  function saveNote(id: number, value: string) {
    setNotes((prev) => ({ ...prev, [id]: value }));
    try {
      localStorage.setItem(noteKey(id), value);
      setNotice("Note saved on this admin device.");
    } catch {
      setNotice("Could not save note on this device.");
    }
  }

  const shownBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings
      .filter((booking) => booking.status !== "archived")
      .filter((booking) => {
        if (!query) return true;
        return [booking.clientName, booking.phone, booking.serviceLabel, booking.status, notes[booking.id], booking.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      });
  }, [bookings, notes, search]);

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Private Notes</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to view and save private notes.</p>
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
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>PRIVATE</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Admin Notes</p>
          </div>
          <button onClick={() => loadBookings(token)} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700 }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 12.5, color: "#8A6509", lineHeight: 1.45 }}>These notes are private and saved on this admin device. They are for internal follow-ups only.</p>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search client, phone, service, notes..."
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 13, backgroundColor: "#fff", fontSize: 14, outline: "none", marginBottom: 10 }}
        />

        {notice && <p style={{ fontSize: 12, color: "#7D6268", marginBottom: 10 }}>{notice}</p>}

        {loading ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>Loading notes…</p>
        ) : shownBookings.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>No bookings found.</p>
        ) : (
          shownBookings.map((booking) => (
            <div key={booking.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#201B1C", marginBottom: 2 }}>{booking.clientName}</p>
                  <p style={{ fontSize: 12, color: "#7D6268" }}>{booking.phone}</p>
                </div>
                <span style={{ backgroundColor: "#F3EAED", color: "#7D6268", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900 }}>{booking.status}</span>
              </div>
              <p style={{ fontSize: 13, color: "#201B1C", fontWeight: 800, marginBottom: 4 }}>{booking.serviceLabel}</p>
              <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.45, marginBottom: 10 }}>{dateLabel(booking)} • {booking.timePreference || "flexible"} • {booking.totalEstimate ? `$${booking.totalEstimate}+` : "No estimate"}</p>
              {booking.notes && <p style={{ fontSize: 12, color: "#6E565C", lineHeight: 1.45, marginBottom: 10, fontStyle: "italic" }}>Client note: {booking.notes}</p>}
              <textarea
                value={notes[booking.id] ?? ""}
                onChange={(event) => setNotes((prev) => ({ ...prev, [booking.id]: event.target.value }))}
                placeholder="Private admin note..."
                rows={4}
                style={{ width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #E4D3D8", borderRadius: 12, resize: "vertical", fontSize: 13, lineHeight: 1.45, outline: "none", marginBottom: 8 }}
              />
              <button onClick={() => saveNote(booking.id, notes[booking.id] ?? "")} style={{ width: "100%", padding: "10px 0", border: "none", borderRadius: 11, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 13, fontWeight: 800 }}>Save Private Note</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
