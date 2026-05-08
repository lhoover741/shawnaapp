import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  ADD_ONS,
  DEPOSIT_NOTE,
  HAIR_INCLUDED_NOTE,
  HOURS_NOTE,
  PREP_NOTE,
  SAME_DAY_NOTE,
  SERVICE_CATEGORIES,
  getGroupedServices,
  getServicesByCategory,
  type ServiceCategory,
} from "@/lib/services";

export default function Services() {
  const [, navigate] = useLocation();
  const [expanded, setExpanded] = useState<string | null>("medium-knotless");
  const [activeCategory, setActiveCategory] = useState<"all" | ServiceCategory>(
    "all",
  );

  const filteredServices = useMemo(
    () => getServicesByCategory(activeCategory),
    [activeCategory],
  );
  const groupedServices = useMemo(
    () => getGroupedServices(filteredServices),
    [filteredServices],
  );
  const groupNames = Object.keys(groupedServices);

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, #FFFBFA 0%, #F9F5F0 34%, #F6EEF1 100%)",
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
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2.8,
            color: "#7D6268",
            fontWeight: 700,
            marginBottom: 5,
          }}
        >
          RAVISHING BEAUTÉ MENU
        </p>
        <p
          style={{
            fontSize: 30,
            fontFamily: "'Playfair Display', serif",
            fontWeight: 700,
            color: "#201B1C",
            lineHeight: 1,
          }}
        >
          Services & Pricing
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#7D6268",
            marginTop: 8,
            lineHeight: 1.55,
          }}
        >
          {HAIR_INCLUDED_NOTE}
        </p>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {[DEPOSIT_NOTE, HOURS_NOTE, SAME_DAY_NOTE, PREP_NOTE].map((note) => (
            <div
              key={note}
              style={{
                backgroundColor: "rgba(255,255,255,0.88)",
                border: "1px solid #E8D8DD",
                borderRadius: 16,
                padding: "11px 12px",
                boxShadow: "0 10px 30px rgba(87, 47, 62, 0.06)",
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#6E565C",
                  lineHeight: 1.45,
                  margin: 0,
                }}
              >
                {note}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 8,
            marginBottom: 10,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {SERVICE_CATEGORIES.map((category) => {
            const selected = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setExpanded(null);
                }}
                style={{
                  flex: "0 0 auto",
                  minWidth: category.id === "all" ? 82 : 132,
                  border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`,
                  background: selected
                    ? "linear-gradient(135deg, #AC5D7A, #8F4864)"
                    : "rgba(255,255,255,0.9)",
                  color: selected ? "#fff" : "#201B1C",
                  borderRadius: 999,
                  padding: "10px 14px",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: selected
                    ? "0 12px 24px rgba(172,93,122,0.22)"
                    : "none",
                  transition:
                    "transform 160ms ease, box-shadow 160ms ease, background 160ms ease",
                }}
              >
                <span
                  style={{ display: "block", fontSize: 13, fontWeight: 700 }}
                >
                  {category.label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 9.5,
                    opacity: selected ? 0.82 : 0.62,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {category.eyebrow}
                </span>
              </button>
            );
          })}
        </div>

        {groupNames.length === 0 ? (
          <div
            style={{
              backgroundColor: "#fff",
              border: "1px dashed #D8C3C9",
              borderRadius: 18,
              padding: 24,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 21,
                color: "#201B1C",
                marginBottom: 6,
              }}
            >
              No services found
            </p>
            <p style={{ fontSize: 13, color: "#7D6268" }}>
              Try another category or text Shawna for a custom request.
            </p>
          </div>
        ) : (
          groupNames.map((group) => (
            <section key={group} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "12px 2px 9px",
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: 2,
                    color: "#7D6268",
                    fontWeight: 800,
                  }}
                >
                  {group.toUpperCase()}
                </p>
                <span
                  style={{
                    width: 44,
                    height: 1,
                    background: "linear-gradient(90deg, transparent, #D9A96A)",
                  }}
                />
              </div>

              {groupedServices[group].map((s) => {
                const open = expanded === s.id;
                return (
                  <div
                    key={s.id}
                    style={{
                      backgroundColor: "rgba(255,255,255,0.96)",
                      border: `1px solid ${open ? "#D6A9BA" : "#E4D3D8"}`,
                      borderRadius: 18,
                      marginBottom: 10,
                      overflow: "hidden",
                      boxShadow: open
                        ? "0 18px 38px rgba(82, 42, 57, 0.10)"
                        : "0 10px 24px rgba(82, 42, 57, 0.045)",
                      transition:
                        "box-shadow 180ms ease, border-color 180ms ease, transform 180ms ease",
                    }}
                  >
                    <button
                      onClick={() => setExpanded(open ? null : s.id)}
                      style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "44px 1fr auto",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 14px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          background: open
                            ? "linear-gradient(135deg, #F8E8F4, #F7EFE3)"
                            : "#F3EAED",
                          borderRadius: 14,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#AC5D7A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="20" y1="4" x2="8.12" y2="15.88" />
                          <line x1="14.47" y1="14.48" x2="20" y2="20" />
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            flexWrap: "wrap",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#201B1C",
                              letterSpacing: -0.15,
                            }}
                          >
                            {s.name}
                          </span>
                          {s.badge && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: s.badge.color,
                                backgroundColor: s.badge.bg,
                                padding: "3px 8px",
                                borderRadius: 50,
                              }}
                            >
                              {s.badge.label}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#B9874D",
                            }}
                          >
                            {s.priceLabel}
                          </span>
                          <span style={{ fontSize: 12, color: "#7D6268" }}>
                            {s.duration}
                          </span>
                        </div>
                      </div>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#7D6268"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: open ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {open && (
                      <div
                        style={{
                          borderTop: "1px solid #F3EAED",
                          padding: "14px 16px 16px",
                          animation: "rbFadeIn 180ms ease",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13.5,
                            color: "#6E565C",
                            lineHeight: 1.65,
                            marginBottom: 12,
                          }}
                        >
                          {s.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 7,
                            marginBottom: 12,
                          }}
                        >
                          {s.details.map((detail) => (
                            <span
                              key={detail}
                              style={{
                                fontSize: 11,
                                color: "#7D6268",
                                backgroundColor: "#FBF4F6",
                                border: "1px solid #F0DDE5",
                                borderRadius: 999,
                                padding: "5px 9px",
                              }}
                            >
                              {detail}
                            </span>
                          ))}
                        </div>
                        {s.hairIncluded && (
                          <p
                            style={{
                              fontSize: 12,
                              color: "#5C6F2E",
                              lineHeight: 1.45,
                              marginBottom: 12,
                            }}
                          >
                            ✓ {HAIR_INCLUDED_NOTE}
                          </p>
                        )}

                        <button
                          onClick={() =>
                            navigate(
                              `/book?service=${encodeURIComponent(s.id)}`,
                            )
                          }
                          style={{
                            width: "100%",
                            marginTop: 2,
                            padding: "13px 0",
                            background:
                              "linear-gradient(135deg, #AC5D7A, #8F4864)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 13,
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: "0 12px 24px rgba(172,93,122,0.22)",
                          }}
                        >
                          Request This Service
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))
        )}

        <section
          style={{
            background: "linear-gradient(135deg, #2A1D22, #6B1F3E)",
            borderRadius: 20,
            padding: 18,
            color: "#fff",
            boxShadow: "0 18px 42px rgba(67, 32, 45, 0.18)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: 2,
              opacity: 0.7,
              marginBottom: 6,
              fontWeight: 800,
            }}
          >
            ADD-ONS
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Finishing Touches
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
            {ADD_ONS.map((addOn) => (
              <div
                key={addOn.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.86)" }}>
                  {addOn.name}
                </span>
                <span
                  style={{ fontSize: 13, color: "#F1C98E", fontWeight: 800 }}
                >
                  {addOn.priceLabel}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <style>{`@keyframes rbFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
