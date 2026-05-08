import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { getPushDebugSnapshot, requestAndSubscribe, sendDebugPush, type PushDebugSnapshot, type PushServerJson } from "@/lib/push";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", background: "#201B1C", color: "#FFF7FA", borderRadius: 12, padding: 12, fontSize: 11, lineHeight: 1.5 }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: "1px solid #E4D3D8" }}>
      <span style={{ color: "#7D6268", fontSize: 13 }}>{label}</span>
      <strong style={{ color: "#201B1C", fontSize: 13, textAlign: "right" }}>{String(value ?? "—")}</strong>
    </div>
  );
}

export default function Debug() {
  const [snapshot, setSnapshot] = useState<PushDebugSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSubscribeResponse, setLastSubscribeResponse] = useState<PushServerJson | undefined>();
  const [lastSendResult, setLastSendResult] = useState<PushServerJson | undefined>();

  async function refresh() {
    setBusy(true);
    setMessage("Refreshing push diagnostics...");
    const next = await getPushDebugSnapshot();
    setSnapshot({ ...next, subscribeResponse: lastSubscribeResponse, lastSendResult });
    setMessage("Diagnostics refreshed.");
    setBusy(false);
  }

  async function subscribe() {
    setBusy(true);
    setMessage("Subscribing this device...");
    const result = await requestAndSubscribe();
    setLastSubscribeResponse(result.subscribeResponse);
    setMessage(result.message);
    const next = await getPushDebugSnapshot();
    setSnapshot({ ...next, subscribeResponse: result.subscribeResponse, lastSendResult });
    setBusy(false);
  }

  async function sendTest() {
    setBusy(true);
    setMessage("Sending test push through Railway...");
    try {
      const result = await sendDebugPush();
      setLastSendResult(result);
      const next = await getPushDebugSnapshot();
      setSnapshot({ ...next, subscribeResponse: lastSubscribeResponse, lastSendResult: result });
      setMessage("Send request completed.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 96px" }}>
      <p style={{ fontSize: 10, letterSpacing: 2.5, color: "#7D6268", fontWeight: 700, marginBottom: 4 }}>PUSH DEBUG</p>
      <h1 style={{ fontSize: 28, fontFamily: "'Playfair Display', serif", color: "#201B1C", marginBottom: 8 }}>Notification Diagnostics</h1>
      <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>
        Use this page from the installed iPhone Home Screen app to verify service worker, permission, subscription, and Railway responses.
      </p>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <button onClick={refresh} disabled={busy} style={buttonStyle("#FFF", "#AC5D7A", "#E4D3D8")}>Refresh Status</button>
        <button onClick={subscribe} disabled={busy} style={buttonStyle("#AC5D7A", "#FFF", "#AC5D7A")}>Subscribe This Device</button>
        <button onClick={sendTest} disabled={busy} style={buttonStyle("#201B1C", "#FFF", "#201B1C")}>Send Test Push</button>
      </div>

      {message && <p style={{ color: busy ? "#7D6268" : "#2E7D32", fontSize: 13, marginBottom: 16 }}>{message}</p>}

      <section style={cardStyle}>
        <Row label="Permission" value={snapshot?.notificationPermission} />
        <Row label="Service worker" value={snapshot?.serviceWorkerSupported ? "supported" : "not supported"} />
        <Row label="PushManager" value={snapshot?.pushManagerSupported ? "supported" : "not supported"} />
        <Row label="Standalone PWA" value={snapshot?.standalone ? "yes" : "no"} />
        <Row label="HTTPS / secure" value={snapshot?.secureContext ? "yes" : "no"} />
        <Row label="Railway URL" value={snapshot?.pushServerUrl} />
        <Row label="Stored count" value={snapshot?.storedSubscriptionCount ?? "unknown"} />
      </section>

      <section style={cardStyle}>
        <h2 style={headingStyle}>Service worker registration</h2>
        <JsonBlock value={snapshot?.serviceWorkerRegistration ?? null} />
      </section>

      <section style={cardStyle}>
        <h2 style={headingStyle}>Push subscription object</h2>
        <JsonBlock value={snapshot?.subscription ?? null} />
      </section>

      <section style={cardStyle}>
        <h2 style={headingStyle}>Railway subscribe response</h2>
        <JsonBlock value={lastSubscribeResponse ?? snapshot?.subscribeResponse ?? null} />
      </section>

      <section style={cardStyle}>
        <h2 style={headingStyle}>Last send result</h2>
        <JsonBlock value={lastSendResult ?? snapshot?.lastSendResult ?? null} />
      </section>

      {snapshot?.lastError && <p style={{ color: "#C0392B", fontSize: 12 }}>Last error: {snapshot.lastError}</p>}
    </div>
  );
}

function buttonStyle(backgroundColor: string, color: string, borderColor: string): CSSProperties {
  return {
    width: "100%",
    border: `1px solid ${borderColor}`,
    borderRadius: 14,
    padding: "12px 14px",
    backgroundColor,
    color,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  };
}

const cardStyle: CSSProperties = {
  backgroundColor: "#FFF",
  border: "1px solid #E4D3D8",
  borderRadius: 16,
  padding: 16,
  marginBottom: 14,
};

const headingStyle: CSSProperties = {
  color: "#201B1C",
  fontSize: 15,
  marginBottom: 10,
};
