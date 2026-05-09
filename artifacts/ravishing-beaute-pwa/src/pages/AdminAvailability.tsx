import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type Status = "open" | "blocked";
type Row = { date: string; status: Status; note?: string | null };

function datesForMonth(year: number, month: number) {
  return Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
}

function label(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function AdminAvailability() {
  const [, navigate] = useLocation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const auth = typeof window !== "undefined" ? window.localStorage.getItem("admin_token") || "" : "";

  async function load() {
    if (!auth) { setNotice("Sign in from the admin dashboard first."); return; }
    const response = await fetch(`/api/admin/availability?year=${year}&month=${month}`, { headers: { Authorization: `Bearer ${auth}` }, cache: "no-store" });
    if (!response.ok) { setNotice("Could not load availability."); return; }
    const data = await response.json() as Row[];
    const next: Record<string, Row> = {};
    const loadedNotes: Record<string, string> = {};
    for (const row of Array.isArray(data) ? data : []) {
      next[row.date] = row;
      loadedNotes[row.date] = row.note || "";
    }
    setRows(next);
    setNotes(loadedNotes);
  }

  async function save(date: string, status: Status, note = notes[date] || rows[date]?.note || "") {
    if (!auth) { setNotice("Sign in from the admin dashboard first."); return; }
    const response = await fetch("/api/admin/availability", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` }, body: JSON.stringify({ date, status, note }) });
    if (!response.ok) { setNotice("Could not update that date."); return; }
    const row = await response.json() as Row;
    setRows((current) => ({ ...current, [date]: row }));
    setNotes((current) => ({ ...current, [date]: row.note || "" }));
  }

  useEffect(() => { void load(); }, [year, month]);

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8" }}>
        <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>← Admin</button>
        <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginTop: 12 }}>AVAILABILITY</p>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C" }}>{new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
      </div>
      <div style={{ padding: 16 }}>
        {notice && <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 12, padding: 12, color: "#8A6509", fontSize: 12, marginBottom: 12 }}>{notice}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setMonth((m) => m === 1 ? (setYear(year - 1), 12) : m - 1)} style={{ padding: 12, border: "1px solid #E4D3D8", borderRadius: 12, backgroundColor: "#fff" }}>Prev</button>
          <button onClick={load} style={{ padding: 12, border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontWeight: 900 }}>Refresh</button>
          <button onClick={() => setMonth((m) => m === 12 ? (setYear(year + 1), 1) : m + 1)} style={{ padding: 12, border: "1px solid #E4D3D8", borderRadius: 12, backgroundColor: "#fff" }}>Next</button>
        </div>
        <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.5, marginBottom: 12 }}>Booking blocks Sundays, Mondays, past dates, and admin-blocked dates. Mark today open only when same-day booking is approved.</p>
        {datesForMonth(year, month).map((date) => {
          const row = rows[date];
          const day = new Date(`${date}T12:00:00`).getDay();
          const closed = day === 0 || day === 1;
          return (
            <section key={date} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}><p style={{ fontSize: 15, fontWeight: 900, color: "#201B1C" }}>{label(date)}</p><span style={{ fontSize: 11, fontWeight: 900, color: row?.status === "open" ? "#3A6B28" : row?.status === "blocked" || closed ? "#B00020" : "#7D6268" }}>{row?.status === "open" ? "Open" : row?.status === "blocked" || closed ? "Blocked" : "Normal"}</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}><button onClick={() => save(date, "open")} style={{ padding: 10, border: "1px solid #C6E3BD", borderRadius: 10, backgroundColor: "#EEF7E9", color: "#3A6B28", fontWeight: 900 }}>Open</button><button onClick={() => save(date, "blocked")} style={{ padding: 10, border: "1px solid #F5BDBD", borderRadius: 10, backgroundColor: "#FEECEC", color: "#B00020", fontWeight: 900 }}>Block</button></div>
              <input value={notes[date] || ""} onChange={(e) => setNotes((current) => ({ ...current, [date]: e.target.value }))} onBlur={() => save(date, row?.status || "blocked", notes[date] || "")} placeholder="Optional note" style={{ width: "100%", boxSizing: "border-box", padding: 11, border: "1px solid #E4D3D8", borderRadius: 10 }} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
