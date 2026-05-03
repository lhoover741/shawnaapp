const BASE = import.meta.env.BASE_URL;

const IMAGES = [
  { src: "braids-1.jpg", alt: "Knotless braids" },
  { src: "braids-2.jpg", alt: "Box braids" },
  { src: "client-1.jpg", alt: "Client style" },
  { src: "hero-1.jpg", alt: "Braid style" },
  { src: "hero-2.jpg", alt: "Natural hair style" },
  { src: "style-1.jpg", alt: "Protective style" },
];

export default function Gallery() {
  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 20px) 16px 16px", borderBottom: "1px solid #E4D3D8", backgroundColor: "#fff" }}>
        <p style={{ fontSize: 10, letterSpacing: 2.5, color: "#7D6268", fontWeight: 500, marginBottom: 4 }}>RECENT WORK</p>
        <p style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C" }}>Gallery</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 4 }}>A look at Shawna's latest styles</p>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, padding: 3 }}>
        {IMAGES.map((img, i) => (
          <div key={i} style={{ aspectRatio: "3/4", overflow: "hidden" }}>
            <img
              src={`${BASE}${img.src}`}
              alt={img.alt}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>

      {/* Book CTA */}
      <div style={{ padding: "24px 16px" }}>
        <div style={{ backgroundColor: "#FDF0F5", border: "1px solid #E4C9D5", borderRadius: 16, padding: 20, textAlign: "center" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#6B1F3E", marginBottom: 6 }}>Love What You See?</p>
          <p style={{ fontSize: 13, color: "#9C5070", marginBottom: 16, lineHeight: 1.5 }}>Request your appointment and get the look you want.</p>
          <a
            href={`${BASE.replace(/\/$/, "")}#`}
            onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.history.pushState(null, "", `${BASE.replace(/\/$/, "")}/book`); window.dispatchEvent(new PopStateEvent("popstate")); }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: "#AC5D7A", color: "#fff",
              padding: "13px 28px", borderRadius: 50, textDecoration: "none",
              fontSize: 15, fontWeight: 600,
            }}
          >
            Request Appointment
          </a>
        </div>
      </div>
    </div>
  );
}
