import { useEffect, useState } from "react";
import { requestAndSubscribe } from "@/lib/push";

export default function ClientNotificationOptIn({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<"idle" | "saved" | "denied" | "error">("idle");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function enableNotifications() {
    setBusy(true);
    setStatus("idle");
    setMessage("");
    try {
      const result = await requestAndSubscribe("client");
      setMessage(result.message);
      if (result.status === "success") setStatus("saved");
      else if (result.status === "denied" || result.status === "unsupported") setStatus("denied");
      else setStatus("error");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not enable notifications right now.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (status !== "saved") return;
    const timer = setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 6000);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #E4D3D8",
        borderRadius: compact ? 14 : 18,
        padding: compact ? 14 : 16,
        boxShadow: compact ? "none" : "0 12px 28px rgba(82,42,57,0.05)",
      }}
    >
      <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 5 }}>
        CLIENT ALERTS
      </p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: compact ? 19 : 22, fontWeight: 700, color: "#201B1C", marginBottom: 6 }}>
        Stay updated with Ravishing Beauté
      </p>
      <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.55, marginBottom: 12 }}>
        Get notified about last-minute openings, booking updates, and limited-time service announcements.
      </p>
      <button
        onClick={enableNotifications}
        disabled={busy}
        style={{
          width: "100%",
          border: "none",
          borderRadius: 12,
          padding: "12px 14px",
          backgroundColor: "#AC5D7A",
          color: "#fff",
          fontSize: 14,
          fontWeight: 800,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.78 : 1,
        }}
      >
        {busy ? "Enabling…" : "Allow Notifications"}
      </button>
      {status === "saved" && <p style={{ marginTop: 9, fontSize: 12, color: "#2E7D32" }}>{message || "Notifications enabled."}</p>}
      {status === "denied" && <p style={{ marginTop: 9, fontSize: 12, color: "#9C5070" }}>{message || "Notifications were not enabled."}</p>}
      {status === "error" && <p style={{ marginTop: 9, fontSize: 12, color: "#C0392B" }}>{message || "Could not enable notifications."}</p>}
    </div>
  );
}
