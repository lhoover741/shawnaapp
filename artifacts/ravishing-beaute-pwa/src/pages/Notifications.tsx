import { useLocation } from "wouter";
import ClientNotificationOptIn from "@/components/ClientNotificationOptIn";

export default function Notifications() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #FFFBFA 0%, #F9F5F0 45%, #F6EEF1 100%)",
        minHeight: "100vh",
        paddingBottom: "calc(104px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        style={{
          padding: "calc(env(safe-area-inset-top, 0px) + 22px) 16px 18px",
          borderBottom: "1px solid #E4D3D8",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, padding: 0, marginBottom: 12 }}
        >
          ← Home
        </button>
        <p style={{ fontSize: 10, letterSpacing: 2.8, color: "#7D6268", fontWeight: 800, marginBottom: 5 }}>
          RAVISHING BEAUTÉ APP
        </p>
        <p style={{ fontSize: 30, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C", lineHeight: 1 }}>
          App & Notifications
        </p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 8, lineHeight: 1.55 }}>
          Add Ravishing Beauté to your Home Screen, then allow notifications for appointment updates, openings, and service announcements.
        </p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <ClientNotificationOptIn />

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginTop: 14, boxShadow: "0 12px 28px rgba(82,42,57,0.05)" }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 900, marginBottom: 6 }}>
            IPHONE SETUP
          </p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#201B1C", marginBottom: 10 }}>
            Add us to your Home Screen
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              "Open ravishingbeaute.salon in Safari on your iPhone.",
              "Tap the Share button. It may show as the square with the arrow, or under the More button depending on your Safari layout.",
              "Scroll down and tap Add to Home Screen.",
              "Keep Open as Web App turned on if your iPhone shows that option.",
              "Tap Add. Then open Ravishing Beauté from the new Home Screen icon.",
              "Come back to this page and tap Allow Notifications."
            ].map((step, index) => (
              <div key={step} style={{ display: "grid", gridTemplateColumns: "30px 1fr", gap: 10, alignItems: "start" }}>
                <span style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: "#F3EAED", color: "#AC5D7A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900 }}>
                  {index + 1}
                </span>
                <p style={{ fontSize: 13, color: "#5E4B51", lineHeight: 1.5, paddingTop: 5 }}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 16, padding: 14, marginTop: 14 }}>
          <p style={{ fontSize: 12.5, color: "#8A6509", lineHeight: 1.5 }}>
            Tip: iPhone web push notifications work best after the site is added to the Home Screen and opened like an app. If notifications are blocked, check iPhone Settings and allow notifications for Ravishing Beauté.
          </p>
        </section>

        <button
          onClick={() => navigate("/book")}
          style={{ width: "100%", marginTop: 14, padding: "13px 0", background: "linear-gradient(135deg, #AC5D7A, #8F4864)", color: "#fff", border: "none", borderRadius: 13, fontSize: 14, fontWeight: 900, boxShadow: "0 12px 24px rgba(172,93,122,0.22)" }}
        >
          Request Appointment
        </button>
      </div>
    </div>
  );
}
