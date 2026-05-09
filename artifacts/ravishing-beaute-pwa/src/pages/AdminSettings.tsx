import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Settings = {
  depositAmount: string;
  hoursNote: string;
  closedDaysNote: string;
  sameDayNote: string;
  naturalHairColorsNote: string;
  contactPhone: string;
};

const DEFAULTS: Settings = {
  depositAmount: "25",
  hoursNote: "8:30 AM to 6:00 PM by appointment",
  closedDaysNote: "Closed Sunday and Monday",
  sameDayNote: "Same-day bookings only if approved",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
  contactPhone: "7085743658",
};

const fields: { key: keyof Settings; label: string; helper: string }[] = [
  { key: "depositAmount", label: "Deposit amount", helper: "Numbers only. The default is 25." },
  { key: "hoursNote", label: "Hours note", helper: "Shown anywhere booking hours are referenced." },
  { key: "closedDaysNote", label: "Closed days note", helper: "Keep Sunday and Monday unless the schedule changes." },
  { key: "sameDayNote", label: "Same-day booking note", helper: "Use this to explain approval-only same-day requests." },
  { key: "naturalHairColorsNote", label: "Natural hair colors note", helper: "Keep 1, 1B, 2, and 4 listed for included braiding hair." },
  { key: "contactPhone", label: "Contact phone number", helper: "Used for client text links when connected." },
];

export default function AdminSettings() {
  const [, navigate] = useLocation();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [token, setToken] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_token") || "";
      setToken(saved);
      if (saved) void loadSettings(saved);
    } catch {
      // Keep defaults.
    }
  }, []);

  async function loadSettings(auth = token) {
    if (!auth) {
      setNotice("Open the admin dashboard and sign in first.");
      return;
    }
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${auth}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not load settings");
      const data = (await response.json()) as Partial<Settings>;
      setSettings({ ...DEFAULTS, ...data });
    } catch {
      setNotice("Using default booking settings until the settings API is available.");
      setSettings(DEFAULTS);
    }
  }

  async function saveSettings() {
    if (!token) {
      setNotice("Open the admin dashboard and sign in first.");
      return;
    }
    setSaving(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = (await response.json()) as Partial<Settings> & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save settings");
      setSettings({ ...DEFAULTS, ...data });
      setNotice("Booking settings saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>← Admin</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900 }}>BOOKING SETTINGS</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Site Rules</p>
          </div>
          <button onClick={() => loadSettings()} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 800 }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        {notice && <section style={{ backgroundColor: notice.includes("saved") ? "#EEF7E9" : "#FEF9EC", border: `1px solid ${notice.includes("saved") ? "#C6E3BD" : "#EDD9A3"}`, borderRadius: 14, padding: 12, marginBottom: 12, color: notice.includes("saved") ? "#3A6B28" : "#8A6509", fontSize: 12 }}>{notice}</section>}

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, boxShadow: "0 12px 28px rgba(82,42,57,0.05)", marginBottom: 14 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#201B1C", marginBottom: 6 }}>Editable booking rules</p>
          <p style={{ fontSize: 12.5, color: "#7D6268", lineHeight: 1.5 }}>Update the details clients see across Ravishing Beauté. If settings cannot load, the app falls back to the current approved business rules.</p>
        </section>

        <div style={{ display: "grid", gap: 10 }}>
          {fields.map((field) => (
            <section key={field.key} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: "#5E4B51", fontWeight: 900, marginBottom: 6 }}>{field.label}</label>
              <textarea
                value={settings[field.key]}
                onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value }))}
                rows={field.key === "depositAmount" || field.key === "contactPhone" ? 1 : 3}
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 13px", border: "1px solid #E4D3D8", borderRadius: 12, fontSize: 14, color: "#201B1C", outline: "none", resize: "vertical", lineHeight: 1.4 }}
              />
              <p style={{ fontSize: 11.5, color: "#7D6268", lineHeight: 1.45, marginTop: 6 }}>{field.helper}</p>
            </section>
          ))}
        </div>

        <button onClick={saveSettings} disabled={saving} style={{ width: "100%", marginTop: 14, border: "none", borderRadius: 13, padding: "14px 0", backgroundColor: "#AC5D7A", color: "#fff", fontSize: 14, fontWeight: 900, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Booking Settings"}</button>
      </div>
    </div>
  );
}
