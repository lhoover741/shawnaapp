import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type PublicSettings = {
  depositAmount: string;
  hoursNote: string;
  closedDaysNote: string;
  sameDayNote: string;
  naturalHairColorsNote: string;
};

const DEFAULTS: PublicSettings = {
  depositAmount: "25",
  hoursNote: "8:30 AM to 6:00 PM by appointment",
  closedDaysNote: "Closed Sunday and Monday",
  sameDayNote: "Same-day bookings only if approved",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
};

function buildPolicies(settings: PublicSettings) {
  const deposit = `$${settings.depositAmount.replace(/[^0-9.]/g, "") || DEFAULTS.depositAmount}`;

  return [
    {
      title: `${deposit} deposit required`,
      body: `A ${deposit} deposit is required to secure your appointment once your request is approved. Your appointment is not fully held until the deposit is received.`,
    },
    {
      title: "Appointments by approval",
      body: "All appointments are requested first and confirmed after availability is reviewed. Please wait for confirmation before considering the appointment finalized.",
    },
    {
      title: "Hours and closed days",
      body: `Ravishing Beauté is available ${settings.hoursNote}. ${settings.closedDaysNote}.`,
    },
    {
      title: "Same-day requests",
      body: `${settings.sameDayNote}. If a same-day opening is not available, we will help you choose another date.`,
    },
    {
      title: "Hair included for natural colors",
      body: settings.naturalHairColorsNote,
    },
    {
      title: "Appointment prep",
      body: "Please come detangled to stay on schedule. Arriving prepared helps us keep your service smooth, polished, and on time.",
    },
    {
      title: "Late arrivals and changes",
      body: "Please communicate as early as possible if you are running late or need to adjust your appointment. Late arrivals may limit the service time available or require rescheduling.",
    },
    {
      title: "Cancellations",
      body: "We understand schedules change. Please give as much notice as possible if you need to cancel or reschedule so the appointment time can be managed professionally.",
    },
  ];
}

export default function Policies() {
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<PublicSettings>(DEFAULTS);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<PublicSettings>;
        setSettings({ ...DEFAULTS, ...data });
      } catch {
        setSettings(DEFAULTS);
      }
    }

    void loadSettings();
  }, []);

  const policies = buildPolicies(settings);

  return (
    <div style={{ background: "linear-gradient(180deg, #FFFBFA 0%, #F9F5F0 50%, #F6EEF1 100%)", minHeight: "100vh", paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 22px) 16px 18px", background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #E4D3D8", backdropFilter: "blur(16px)" }}>
        <button onClick={() => navigate("/")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, padding: 0, marginBottom: 12 }}>← Home</button>
        <p style={{ fontSize: 10, letterSpacing: 2.7, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>RAVISHING BEAUTÉ POLICIES</p>
        <p style={{ fontSize: 30, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C", lineHeight: 1 }}>Before you book</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 8, lineHeight: 1.55 }}>Clear expectations help every appointment feel smooth, professional, and intentional.</p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "grid", gap: 10 }}>
          {policies.map((policy) => (
            <section key={policy.title} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 15, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#201B1C", marginBottom: 5 }}>{policy.title}</p>
              <p style={{ fontSize: 12.5, color: "#5E4B51", lineHeight: 1.55 }}>{policy.body}</p>
            </section>
          ))}
        </div>

        <section style={{ backgroundColor: "#201B1C", borderRadius: 18, padding: 16, marginTop: 14, color: "#fff" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Ready to request your appointment?</p>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.76)", lineHeight: 1.5, marginBottom: 12 }}>Review your service details, choose your preferred date, and submit your request for approval.</p>
          <button onClick={() => navigate("/book")} style={{ width: "100%", border: "none", borderRadius: 13, padding: "13px 0", backgroundColor: "#AC5D7A", color: "#fff", fontSize: 14, fontWeight: 900 }}>Request Appointment</button>
        </section>
      </div>
    </div>
  );
}
