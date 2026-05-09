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
  totalEstimate: number | null;
  notes: string | null;
  createdAt: string;
};

type Settings = {
  depositAmount: string;
  naturalHairColorsNote: string;
};

const DEFAULT_SETTINGS: Settings = {
  depositAmount: "25",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
};

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function depositLabel(settings: Settings) {
  return `$${settings.depositAmount.replace(/[^0-9.]/g, "") || DEFAULT_SETTINGS.depositAmount}`;
}

function dateLabel(value: string | null, flexibleDate: string) {
  if (!value) return flexibleDate === "true" ? "Flexible date" : "No date selected";
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return value;
  }
}

function timeLabel(value: string) {
  if (value === "morning") return "Morning";
  if (value === "afternoon") return "Afternoon";
  return "Flexible";
}

function appleCashMessage(booking: Booking, settings: Settings) {
  const amount = depositLabel(settings);
  return `Hi ${booking.clientName}, this is Shawna with Ravishing Beauté. Your ${amount} deposit is needed to secure your ${booking.serviceLabel} appointment request for ${dateLabel(booking.preferredDate, booking.flexibleDate)}. You can tap the ${amount} amount in this iMessage and send it with Apple Cash. Please reply once sent.`;
}

function prepReminderMessage(booking: Booking, settings: Settings) {
  const amount = depositLabel(settings);
  const depositLine = booking.depositPaid ? "Your deposit is marked received." : `Your ${amount} deposit still needs to be sent to secure the appointment.`;
  return `Hi ${booking.clientName}, this is Shawna with Ravishing Beauté confirming your ${booking.serviceLabel} appointment request for ${dateLabel(booking.preferredDate, booking.flexibleDate)}. Please come detangled to stay on schedule. ${depositLine} ${settings.naturalHairColorsNote} Reply here with any questions before your appointment.`;
}

export default function AdminScheduleSettings() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [filter, setFilter] = useState<"confirmed" | "pending" | "all">("confirmed");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_token") || "";
      setToken(saved);
      if (saved) {
        void loadBookings(saved);
        void loadSettings(saved);
      }
    } catch {
      setToken("");
    }
  }, []);

  async function loadSettings(authToken = token) {
    if (!authToken) return;
    try {
      const response = await fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as Partial<Settings>;
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }

  async function loadBookings(authToken = token) {
    if (!authToken) {
      setNotice("Open the admin dashboard and sign in first.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/booking-requests", { headers: { Authorization: `Bearer ${authToken}` }, cache: "no-store" });
      if (!response.ok) throw new Error("Could not load schedule");
      const data = (await response.json()) as Booking[];
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setNotice("Could not load schedule. Check deployment and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function setDepositPaid(bookingId: number, depositPaid: boolean) {
    if (!token) return;
    setUpdating(bookingId);
    try {
      const response = await fetch(`/api/admin/booking-requests/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ depositPaid }),
      });
      if (!response.ok) throw new Error("Could not update deposit");
      const updated = (await response.json()) as Booking;
      setBookings((current) => current.map((item) => item.id === bookingId ? { ...item, ...updated } : item));
    } catch {
      setNotice("Could not update deposit status.");
    } finally {
      setUpdating(null);
    }
  }

  const visible = useMemo(() => {
    return bookings
      .filter((booking) => booking.status !== "archived" && booking.status !== "cancelled")
      .filter((booking) => filter === "all" ? true : booking.status === filter)
      .sort((a, b) => (a.preferredDate || "9999-12-31").localeCompare(b.preferredDate || "9999-12-31"));
  }, [bookings, filter]);

  const counts = {
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    all: bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length,
  };

  const amount = depositLabel(settings);

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>← Admin</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900 }}>UPCOMING</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Schedule View</p>
          </div>
          <button onClick={() => { void loadBookings(); void loadSettings(); }} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 800 }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        {notice && <section style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 14, padding: 12, marginBottom: 12, color: "#8A6509", fontSize: 12 }}>{notice}</section>}

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 12.5, color: "#7D6268", lineHeight: 1.5 }}>Deposit text templates now use the saved admin setting: <strong>{amount}</strong>.</p>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[["confirmed", `Confirmed ${counts.confirmed}`], ["pending", `Pending ${counts.pending}`], ["all", `All ${counts.all}`]].map(([value, label]) => {
            const selected = filter === value;
            return <button key={value} onClick={() => setFilter(value as "confirmed" | "pending" | "all")} style={{ border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`, backgroundColor: selected ? "#AC5D7A" : "#fff", color: selected ? "#fff" : "#7D6268", borderRadius: 999, padding: "10px 8px", fontSize: 12, fontWeight: 800 }}>{label}</button>;
          })}
        </div>

        {loading ? <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>Loading schedule…</p> : visible.length === 0 ? <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>No appointments shown.</p> : visible.map((booking) => {
          const phoneDigits = digits(booking.phone);
          const appleCashHref = `sms:${phoneDigits || booking.phone}?body=${encodeURIComponent(appleCashMessage(booking, settings))}`;
          const prepHref = `sms:${phoneDigits || booking.phone}?body=${encodeURIComponent(prepReminderMessage(booking, settings))}`;
          return (
            <div key={booking.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#201B1C", marginBottom: 2 }}>{booking.clientName}</p>
                  <p style={{ fontSize: 12, color: "#7D6268" }}>{booking.phone}</p>
                </div>
                <span style={{ backgroundColor: booking.depositPaid ? "#EEF7E9" : "#FEF9EC", color: booking.depositPaid ? "#3A6B28" : "#B8860B", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900 }}>{booking.depositPaid ? "Paid" : "Due"}</span>
              </div>
              <p style={{ fontSize: 13, color: "#201B1C", fontWeight: 900, marginBottom: 4 }}>{booking.serviceLabel}</p>
              <p style={{ fontSize: 12, color: "#7D6268", marginBottom: 8 }}>{dateLabel(booking.preferredDate, booking.flexibleDate)} · {timeLabel(booking.timePreference)} · {amount} deposit</p>
              {booking.notes && <p style={{ fontSize: 12, color: "#5E4B51", lineHeight: 1.45, marginBottom: 10 }}>{booking.notes}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <a href={appleCashHref} style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, backgroundColor: "#FEF9EC", color: "#8A6509", border: "1px solid #EDD9A3", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Apple Cash Text</a>
                <button onClick={() => setDepositPaid(booking.id, !booking.depositPaid)} disabled={updating === booking.id} style={{ padding: "10px 0", borderRadius: 10, backgroundColor: booking.depositPaid ? "#FEECEC" : "#EEF7E9", color: booking.depositPaid ? "#B00020" : "#3A6B28", border: `1px solid ${booking.depositPaid ? "#F5BDBD" : "#C6E3BD"}`, fontSize: 13, fontWeight: 800, opacity: updating === booking.id ? 0.6 : 1 }}>{booking.depositPaid ? "Mark Unpaid" : "Mark Paid"}</button>
              </div>
              <a href={prepHref} style={{ display: "block", textAlign: "center", padding: "10px 0", borderRadius: 10, backgroundColor: "#F7F1EF", color: "#6E565C", border: "1px solid #E4D3D8", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Send Prep Reminder</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
