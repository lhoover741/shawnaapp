import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { requestAndSubscribe } from "@/lib/push";

export default function AdminNotifications() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [title, setTitle] = useState("Ravishing Beauté");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
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

  async function enableAdminNotifications() {
    setNotice("Requesting admin notification access…");
    const result = await requestAndSubscribe("admin");
    if (result.status === "success") {
      setNotice("Admin notifications are enabled on this device.");
    } else {
      setNotice(result.message);
    }
  }

  async function enableClientNotifications() {
    setNotice("Requesting client notification access…");
    const result = await requestAndSubscribe("client");
    if (result.status === "success") {
      setNotice("This device is subscribed as a client notification test device.");
    } else {
      setNotice(result.message);
    }
  }

  async function sendNotification() {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setNotice("Type a message before sending.");
      return;
    }

    setSending(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/client-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim() || "Ravishing Beauté",
          body: cleanMessage,
          url: url.trim() || "/",
        }),
      });
      const data = (await response.json()) as { sent?: number; failed?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not send notification.");
      setNotice(`Notification sent to ${data.sent ?? 0} client device(s). Failed: ${data.failed ?? 0}.`);
      setMessage("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send notification.");
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Notifications</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to send client notifications.</p>
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
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>PUSH</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Notifications</p>
          </div>
          <button onClick={enableAdminNotifications} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700 }}>Enable</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>ADMIN ALERTS</p>
          <p style={{ fontSize: 12.5, color: "#6E565C", lineHeight: 1.45, marginBottom: 10 }}>
            Tap Enable to subscribe this device as Shawna/admin. Admin devices receive new booking, confirmation, and cancellation alerts.
          </p>
          <button onClick={enableAdminNotifications} style={{ width: "100%", padding: "11px 0", border: "none", borderRadius: 11, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 13, fontWeight: 800 }}>Enable Admin Notifications</button>
        </div>

        <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: 12.5, color: "#8A6509", lineHeight: 1.45 }}>
            Client notifications only go to clients who allow notifications on the Ravishing Beauté site/app. This should be used for real updates like sale reminders, openings, or appointment information.
          </p>
        </div>

        <div style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>SEND CLIENT NOTIFICATION</p>
          <label style={{ display: "block", fontSize: 12, color: "#7D6268", fontWeight: 800, marginBottom: 5 }}>Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ravishing Beauté"
            style={{ width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #E4D3D8", borderRadius: 11, fontSize: 14, outline: "none", marginBottom: 10 }}
          />
          <label style={{ display: "block", fontSize: 12, color: "#7D6268", fontWeight: 800, marginBottom: 5 }}>Message</label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Example: Last-minute openings this Friday. Book now before spots fill."
            rows={6}
            style={{ width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #E4D3D8", borderRadius: 11, fontSize: 14, lineHeight: 1.45, resize: "vertical", outline: "none", marginBottom: 10 }}
          />
          <label style={{ display: "block", fontSize: 12, color: "#7D6268", fontWeight: 800, marginBottom: 5 }}>Open page when tapped</label>
          <select
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #E4D3D8", borderRadius: 11, fontSize: 14, outline: "none", marginBottom: 12, backgroundColor: "#fff" }}
          >
            <option value="/">Home</option>
            <option value="/book">Booking</option>
            <option value="/services">Services</option>
            <option value="/gallery">Gallery</option>
          </select>
          <button onClick={sendNotification} disabled={sending} style={{ width: "100%", padding: "13px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 15, fontWeight: 900, opacity: sending ? 0.65 : 1 }}>
            {sending ? "Sending…" : "Send Notification to Clients"}
          </button>
        </div>

        <button onClick={enableClientNotifications} style={{ width: "100%", padding: "11px 0", border: "1px dashed #D8C3C9", borderRadius: 11, backgroundColor: "transparent", color: "#7D6268", fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Subscribe This Device as Client Test</button>

        {notice && <div style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 12, padding: 12, fontSize: 12.5, color: "#6E565C", lineHeight: 1.45 }}>{notice}</div>}
      </div>
    </div>
  );
}
