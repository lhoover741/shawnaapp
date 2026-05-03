import { useState } from "react";
import { useLocation } from "wouter";
import { SERVICES } from "@/lib/services";

export default function Services() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 16px", borderBottom: "1px solid #E4D3D8", backgroundColor: "#fff" }}>
        <p style={{ fontSize: 10, letterSpacing: 2.5, color: "#7D6268", fontWeight: 500, marginBottom: 4 }}>WHAT WE OFFER</p>
        <p style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C" }}>Services</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 4 }}>All styles include professional braiding hair</p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {SERVICES.map((s) => {
          const open = expanded === s.id;
          return (
            <div key={s.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
              {/* Header row */}
              <button
                onClick={() => setExpanded(open ? null : s.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 14,
                  padding: 16, background: "none", border: "none", cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ width: 42, height: 42, backgroundColor: "#F3EAED", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#AC5D7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#201B1C" }}>{s.name}</span>
                    {s.badge && (
                      <span style={{ fontSize: 10, fontWeight: 500, color: s.badge.color, backgroundColor: s.badge.bg, padding: "2px 7px", borderRadius: 50 }}>
                        {s.badge.label}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#D9A96A" }}>{s.priceLabel}</span>
                    <span style={{ fontSize: 12, color: "#7D6268" }}>{s.duration}</span>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7D6268" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Expanded content */}
              {open && (
                <div style={{ borderTop: "1px solid #F3EAED", padding: "14px 16px 16px" }}>
                  <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.6, marginBottom: 12 }}>{s.description}</p>

                  {s.hairIncluded && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C8A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize: 12, color: "#5C8A40", fontWeight: 500 }}>Braiding hair included</span>
                    </div>
                  )}

                  {s.addOns.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, letterSpacing: 1.5, color: "#7D6268", fontWeight: 600, marginBottom: 8 }}>ADD-ONS</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {s.addOns.map((addon) => (
                          <span key={addon.id} style={{
                            fontSize: 11, color: "#201B1C", fontWeight: 500,
                            backgroundColor: "#F3EAED", borderRadius: 50,
                            padding: "4px 10px",
                          }}>
                            {addon.name} <span style={{ color: "#AC5D7A" }}>+${addon.price}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => navigate(`/book?service=${encodeURIComponent(s.id)}&addons=${encodeURIComponent(s.addOns.map((a) => a.id).join(","))}`)}
                    style={{
                      width: "100%", marginTop: 14, padding: "12px 0",
                      backgroundColor: "#AC5D7A", color: "#fff",
                      border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Book This Service
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
