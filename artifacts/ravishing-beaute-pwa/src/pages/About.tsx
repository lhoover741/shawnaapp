import { useLocation } from "wouter";
import {
  DEPOSIT_NOTE,
  HAIR_INCLUDED_NOTE,
  HOURS_NOTE,
  PREP_NOTE,
  SAME_DAY_NOTE,
} from "@/lib/services";

const BASE = import.meta.env.BASE_URL;

const SPECIALTIES = [
  { label: "Knotless Braids" },
  { label: "Feed-In Braids" },
  { label: "Fulani & Lemonade Braids" },
  { label: "Sleek Ponytails" },
  { label: "Quick Weaves" },
];

const VALUES = [
  {
    icon: "heart",
    title: "Client-First Experience",
    body: "A calm, appointment-only experience with thoughtful consultation, clear pricing, and polished communication from request to confirmation.",
  },
  {
    icon: "shield",
    title: "Protective Styling",
    body: "Protective styles are installed with clean parting, comfortable tension, and aftercare-minded technique to help your style wear beautifully.",
  },
  {
    icon: "award",
    title: "Premium Quality",
    body: "Premium finishing, refined details, and schedule-conscious appointments designed for clients who love a feminine, elevated salon experience.",
  },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    heart: (
      <>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </>
    ),
    mapPin: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  };
  return (
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
      {paths[name] ?? null}
    </svg>
  );
}

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        backgroundColor: "#F9F5F0",
        minHeight: "100vh",
        paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Hero photo */}
      <div style={{ position: "relative", height: 280, margin: 0 }}>
        <img
          src={`${BASE}shawna.jpg`}
          alt="Shawna"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,4,7,0.75) 0%, transparent 60%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 20, left: 20 }}>
          <p
            style={{
              color: "#fff",
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: 32,
              marginBottom: 4,
            }}
          >
            Shawna
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Owner & Master Braider · Ravishing Beauté
          </p>
        </div>
      </div>

      {/* Bio */}
      <div
        style={{
          margin: 16,
          backgroundColor: "#fff",
          border: "1px solid #E4D3D8",
          borderRadius: 18,
          padding: 18,
          boxShadow: "0 14px 34px rgba(82,42,57,0.07)",
        }}
      >
        <p
          style={{
            fontSize: 14,
            color: "#201B1C",
            lineHeight: 1.7,
            marginBottom: 12,
          }}
        >
          Shawna is the owner and lead stylist behind Ravishing Beauté — a
          premium braiding, weave, and natural styling studio serving Calumet
          City and the Northwest Indiana area.
        </p>
        <p
          style={{
            fontSize: 14,
            color: "#201B1C",
            lineHeight: 1.7,
            marginBottom: 12,
          }}
        >
          Her work blends protective styling with a luxury salon finish: clean
          parts, low-tension technique, thoughtful shaping, and a polished look
          that feels personal rather than rushed.
        </p>
        <p style={{ fontSize: 14, color: "#201B1C", lineHeight: 1.7 }}>
          Every appointment is request-based so timing, hair color needs,
          add-ons, and style details can be approved before your visit.
        </p>
      </div>

      {/* Specialties */}
      <div style={{ padding: "0 16px 24px" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#7D6268",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          SPECIALTIES
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SPECIALTIES.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#fff",
                border: "1px solid #E4D3D8",
                borderRadius: 50,
                padding: "8px 14px",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: "#FDF0F5",
                  borderRadius: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#AC5D7A"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#201B1C" }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div style={{ padding: "0 16px 24px" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#7D6268",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          WHAT TO EXPECT
        </p>
        {VALUES.map((v) => (
          <div
            key={v.title}
            style={{
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              backgroundColor: "#fff",
              border: "1px solid #E4D3D8",
              borderRadius: 14,
              padding: 16,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                backgroundColor: "#FDF0F5",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={v.icon} />
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#201B1C",
                  marginBottom: 4,
                }}
              >
                {v.title}
              </p>
              <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.6 }}>
                {v.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Location & hours */}
      <div style={{ padding: "0 16px 24px" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#7D6268",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          LOCATION & HOURS
        </p>
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #E4D3D8",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: 16,
            }}
          >
            <Icon name="mapPin" />
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#201B1C",
                  marginBottom: 2,
                }}
              >
                Calumet City / NWI
              </p>
              <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.5 }}>
                Exact address provided after booking confirmation.
              </p>
            </div>
          </div>
          <div style={{ height: 1, backgroundColor: "#E4D3D8" }} />
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: 16,
            }}
          >
            <Icon name="clock" />
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#201B1C",
                  marginBottom: 2,
                }}
              >
                {HOURS_NOTE}
              </p>
              <p style={{ fontSize: 12, color: "#7D6268", lineHeight: 1.5 }}>
                By appointment only. {SAME_DAY_NOTE}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px 24px" }}>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 2,
            color: "#7D6268",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          BOOKING NOTES
        </p>
        <div
          style={{
            background: "linear-gradient(135deg, #FFF, #FFF7FA)",
            border: "1px solid #E4D3D8",
            borderRadius: 16,
            padding: 16,
          }}
        >
          {[DEPOSIT_NOTE, HAIR_INCLUDED_NOTE, PREP_NOTE].map((note) => (
            <p
              key={note}
              style={{
                fontSize: 12,
                color: "#6E565C",
                lineHeight: 1.55,
                marginBottom: 8,
              }}
            >
              • {note}
            </p>
          ))}
        </div>
      </div>

      {/* Book CTA */}
      <div style={{ padding: "0 16px" }}>
        <button
          onClick={() => navigate("/book")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#AC5D7A",
            color: "#fff",
            border: "none",
            borderRadius: 50,
            padding: "16px 0",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Request Appointment
        </button>
      </div>
    </div>
  );
}
