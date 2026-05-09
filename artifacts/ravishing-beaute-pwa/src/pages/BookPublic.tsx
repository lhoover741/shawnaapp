import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ADD_ONS, SERVICE_CATEGORIES, getServicesByCategory, getServiceById, type ServiceCategory } from "@/lib/services";
import ClientNotificationOptIn from "@/components/ClientNotificationOptIn";
import { requestAndSubscribe } from "@/lib/push";

type Settings = {
  depositAmount: string;
  hoursNote: string;
  closedDaysNote: string;
  sameDayNote: string;
  naturalHairColorsNote: string;
  contactPhone: string;
};

type AvailabilityRow = { date: string; status: "open" | "blocked" };

const DEFAULT_SETTINGS: Settings = {
  depositAmount: "25",
  hoursNote: "8:30 AM to 6:00 PM by appointment",
  closedDaysNote: "Closed Sunday and Monday",
  sameDayNote: "Same-day bookings only if approved",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
  contactPhone: "7085743658",
};

function cleanMoney(value: string) {
  return value.replace(/[^0-9.]/g, "") || DEFAULT_SETTINGS.depositAmount;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function isClosedDay(date: string) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 || day === 1;
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function BookPublic() {
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [category, setCategory] = useState<"all" | ServiceCategory>("all");
  const [serviceId, setServiceId] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [timePreference, setTimePreference] = useState("Flexible");
  const [addons, setAddons] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<Record<string, "open" | "blocked">>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const service = getServiceById(serviceId);
  const deposit = `$${cleanMoney(settings.depositAmount)}`;
  const contactPhone = settings.contactPhone.replace(/\D/g, "") || DEFAULT_SETTINGS.contactPhone;
  const services = useMemo(() => getServicesByCategory(category), [category]);
  const selectedAddOns = ADD_ONS.filter((item) => addons.includes(item.id));
  const total = (service?.basePrice || 0) + selectedAddOns.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<Settings>;
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      }
    }

    void loadSettings();
  }, []);

  useEffect(() => {
    async function loadAvailability() {
      const date = preferredDate || todayString();
      const [year, month] = date.split("-");
      if (!year || !month) return;
      try {
        const response = await fetch(`/api/availability?year=${year}&month=${Number(month)}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as AvailabilityRow[];
        const next: Record<string, "open" | "blocked"> = {};
        for (const row of Array.isArray(data) ? data : []) next[row.date] = row.status;
        setAvailability(next);
      } catch {
        setAvailability({});
      }
    }

    void loadAvailability();
  }, [preferredDate]);

  function validateDate(date: string) {
    if (!date) return "Please choose your preferred date.";
    if (date < todayString()) return "Please choose a future appointment date.";
    if (isClosedDay(date)) return settings.closedDaysNote;
    if (availability[date] === "blocked") return "That date is currently unavailable. Please choose another date.";
    if (date === todayString() && availability[date] !== "open") return settings.sameDayNote;
    return "";
  }

  async function submitBooking() {
    setError("");
    if (!service) { setError("Please choose a service."); return; }
    const dateError = validateDate(preferredDate);
    if (dateError) { setError(dateError); return; }
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!phone.trim()) { setError("Please enter your phone number."); return; }

    setSubmitting(true);
    try {
      let subscription: string | undefined;
      try {
        const push = await requestAndSubscribe("client");
        if (push.status === "success" && push.subscription) subscription = JSON.stringify(push.subscription);
      } catch {
        // Booking should continue even if notifications are skipped.
      }

      const response = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name.trim(),
          phone: phone.trim(),
          service: service.id,
          preferredDate,
          flexibleDate: false,
          timePreference,
          notes: notes.trim() || undefined,
          addons: selectedAddOns.length ? selectedAddOns.map((item) => `${item.name} (${item.priceLabel})`).join(", ") : undefined,
          basePrice: service.basePrice,
          totalEstimate: total,
          clientWebPushSubscription: subscription,
        }),
      });
      const data = (await response.json()) as { id?: number; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not submit booking request.");
      setSubmittedId(data.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit booking request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    const followUp = `Hi Shawna, I just submitted a booking request with Ravishing Beauté${submittedId ? ` Confirmation #${submittedId}` : ""}.`;
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 28px) 16px 20px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", textAlign: "center" }}>
          <p style={{ fontSize: 10, letterSpacing: 2.5, color: "#7D6268", fontWeight: 900 }}>REQUEST SENT</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: "#201B1C", fontWeight: 700, marginTop: 4 }}>Pending review</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.55, marginTop: 8 }}>Your request was sent to Ravishing Beauté. Shawna will review availability and text you to confirm. The {deposit} deposit is required once approved.</p>
        </div>
        <div style={{ padding: 16 }}>
          <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginBottom: 14 }}>
            <p style={{ fontSize: 14, fontWeight: 900, color: "#201B1C" }}>{service?.name}</p>
            <p style={{ fontSize: 12.5, color: "#7D6268", marginTop: 4 }}>{preferredDate ? dateLabel(preferredDate) : "Date pending"} · {timePreference}</p>
            <p style={{ fontSize: 12.5, color: "#7D6268", marginTop: 4 }}>Estimated total: ${total}+</p>
            <p style={{ fontSize: 12.5, color: "#7D6268", marginTop: 4 }}>Confirmation #{submittedId}</p>
          </section>
          <ClientNotificationOptIn compact />
          <a href={`sms:${contactPhone}?body=${encodeURIComponent(followUp)}`} style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 14, padding: "13px 0", backgroundColor: "#AC5D7A", color: "#fff", borderRadius: 13, fontSize: 14, fontWeight: 900 }}>Follow up via text</a>
          <button onClick={() => navigate("/")} style={{ width: "100%", marginTop: 10, padding: "13px 0", border: "1px solid #E4D3D8", borderRadius: 13, backgroundColor: "#fff", color: "#201B1C", fontSize: 14, fontWeight: 800 }}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #FFFBFA 0%, #F9F5F0 54%, #F6EEF1 100%)", minHeight: "100vh", paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 22px) 16px 18px", background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #E4D3D8", backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, padding: 0, marginBottom: 12 }}>← Home</button>
        <p style={{ fontSize: 10, letterSpacing: 2.7, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>BOOK RAVISHING BEAUTÉ</p>
        <p style={{ fontSize: 30, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C", lineHeight: 1 }}>Request appointment</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 8, lineHeight: 1.55 }}>{settings.hoursNote}. {settings.closedDaysNote}. {settings.sameDayNote}.</p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <section style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 16, padding: 14, marginBottom: 14 }}>
          <p style={{ fontSize: 12.5, color: "#8A6509", lineHeight: 1.5 }}>{deposit} deposit required after approval. {settings.naturalHairColorsNote} Please come detangled to stay on schedule.</p>
        </section>

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginBottom: 10 }}>SERVICE</p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 12 }}>
            {SERVICE_CATEGORIES.map((item) => (
              <button key={item.id} onClick={() => setCategory(item.id)} style={{ flex: "0 0 auto", border: `1px solid ${category === item.id ? "#AC5D7A" : "#E4D3D8"}`, backgroundColor: category === item.id ? "#AC5D7A" : "#fff", color: category === item.id ? "#fff" : "#7D6268", borderRadius: 999, padding: "9px 13px", fontSize: 12, fontWeight: 800 }}>{item.label}</button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {services.map((item) => (
              <button key={item.id} onClick={() => { setServiceId(item.id); setAddons([]); }} style={{ textAlign: "left", border: `1.5px solid ${serviceId === item.id ? "#AC5D7A" : "#E4D3D8"}`, borderRadius: 14, padding: 13, backgroundColor: serviceId === item.id ? "#F9EFF3" : "#fff" }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 900, color: "#201B1C" }}>{item.name}</span>
                <span style={{ display: "block", fontSize: 12, color: "#7D6268", marginTop: 3 }}>{item.priceLabel} · {item.duration}</span>
              </button>
            ))}
          </div>
        </section>

        {service && service.addOns.length > 0 && (
          <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginBottom: 14 }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginBottom: 10 }}>ADD-ONS</p>
            <div style={{ display: "grid", gap: 8 }}>
              {service.addOns.map((item) => {
                const checked = addons.includes(item.id);
                return <button key={item.id} onClick={() => setAddons((current) => checked ? current.filter((id) => id !== item.id) : [...current, item.id])} style={{ display: "flex", justifyContent: "space-between", border: `1px solid ${checked ? "#AC5D7A" : "#E4D3D8"}`, borderRadius: 12, padding: 12, backgroundColor: checked ? "#F9EFF3" : "#fff", fontSize: 13, color: "#201B1C", fontWeight: 800 }}><span>{item.name}</span><span>{item.priceLabel}</span></button>;
              })}
            </div>
          </section>
        )}

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginBottom: 10 }}>DATE & CLIENT INFO</p>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#5E4B51", marginBottom: 6 }}>Preferred date</label>
          <input type="date" min={todayString()} value={preferredDate} onChange={(e) => { setPreferredDate(e.target.value); setError(""); }} style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #E4D3D8", borderRadius: 12, marginBottom: 10 }} />
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#5E4B51", marginBottom: 6 }}>Time preference</label>
          <select value={timePreference} onChange={(e) => setTimePreference(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #E4D3D8", borderRadius: 12, marginBottom: 10, backgroundColor: "#fff" }}><option>Morning</option><option>Afternoon</option><option>Flexible</option></select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #E4D3D8", borderRadius: 12, marginBottom: 10 }} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #E4D3D8", borderRadius: 12, marginBottom: 10 }} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Style notes, length, color, or questions" rows={4} style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #E4D3D8", borderRadius: 12, resize: "vertical" }} />
        </section>

        {error && <section style={{ backgroundColor: "#FEECEC", border: "1px solid #F5BDBD", borderRadius: 14, padding: 12, color: "#B00020", fontSize: 12.5, marginBottom: 12 }}>{error}</section>}

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: "#7D6268", marginBottom: 4 }}>Estimated total</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#201B1C", fontWeight: 700 }}>${total}+</p>
          <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.45, marginTop: 4 }}>Final pricing can vary by length, density, add-ons, and approved service details.</p>
        </section>

        <button onClick={submitBooking} disabled={submitting} style={{ width: "100%", border: "none", borderRadius: 13, padding: "14px 0", backgroundColor: "#AC5D7A", color: "#fff", fontSize: 14, fontWeight: 900, opacity: submitting ? 0.7 : 1 }}>{submitting ? "Submitting…" : "Submit Booking Request"}</button>
      </div>
    </div>
  );
}
