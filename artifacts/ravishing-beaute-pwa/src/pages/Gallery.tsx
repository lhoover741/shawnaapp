import { useEffect, useMemo, useState } from "react";

const BASE = import.meta.env.BASE_URL;

const FALLBACK_IMAGES = [
  { imageUrl: `${BASE}braids-1.jpg`, caption: "Knotless braids", featured: true },
  { imageUrl: `${BASE}braids-2.jpg`, caption: "Box braids", featured: false },
  { imageUrl: `${BASE}client-1.jpg`, caption: "Client style", featured: false },
  { imageUrl: `${BASE}hero-1.jpg`, caption: "Braid style", featured: false },
  { imageUrl: `${BASE}hero-2.jpg`, caption: "Natural hair style", featured: false },
  { imageUrl: `${BASE}style-1.jpg`, caption: "Protective style", featured: false },
];

type GalleryImage = {
  id?: number;
  imageUrl: string;
  caption?: string;
  category?: string;
  featured?: boolean;
};

export default function Gallery() {
  const [uploadedImages, setUploadedImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadGallery() {
      try {
        const response = await fetch("/api/gallery", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load gallery");
        const data = (await response.json()) as GalleryImage[];
        if (active && Array.isArray(data)) setUploadedImages(data.filter((image) => image.imageUrl));
      } catch {
        if (active) setUploadedImages([]);
      } finally {
        if (active) setLoaded(true);
      }
    }
    void loadGallery();
    return () => {
      active = false;
    };
  }, []);

  const images = useMemo(() => {
    const uploadedUrls = new Set(uploadedImages.map((image) => image.imageUrl));
    const originalImages = FALLBACK_IMAGES.filter((image) => !uploadedUrls.has(image.imageUrl));
    return [...uploadedImages, ...originalImages];
  }, [uploadedImages]);

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 48 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 22px) 16px 18px", borderBottom: "1px solid #E4D3D8", backgroundColor: "#fff" }}>
        <p style={{ fontSize: 10, letterSpacing: 2.5, color: "#7D6268", fontWeight: 800, marginBottom: 4 }}>RECENT WORK</p>
        <p style={{ fontSize: 29, fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "#201B1C", lineHeight: 1 }}>Gallery</p>
        <p style={{ fontSize: 13, color: "#7D6268", marginTop: 7, lineHeight: 1.5 }}>
          A curated look at Shawna’s latest Ravishing Beauté styles.
        </p>
      </div>

      <div style={{ padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 8, alignItems: "stretch", marginBottom: 8 }}>
          {images.slice(0, 2).map((img, index) => (
            <div key={`${img.imageUrl}-${index}`} style={{ aspectRatio: index === 0 ? "3/4" : "3/5", borderRadius: 22, overflow: "hidden", backgroundColor: "#F3EAED", boxShadow: "0 18px 36px rgba(82,42,57,0.08)" }}>
              <img src={img.imageUrl} alt={img.caption || "Ravishing Beauté style"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {images.slice(2).map((img, i) => (
            <div key={`${img.imageUrl}-${i}`} style={{ aspectRatio: i % 3 === 0 ? "3/4" : "4/5", borderRadius: 18, overflow: "hidden", backgroundColor: "#F3EAED", position: "relative" }}>
              <img src={img.imageUrl} alt={img.caption || "Ravishing Beauté gallery photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {img.featured && (
                <span style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(255,255,255,0.9)", color: "#8F4864", borderRadius: 999, padding: "6px 9px", fontSize: 10.5, fontWeight: 900, letterSpacing: 0.8 }}>
                  FEATURED
                </span>
              )}
            </div>
          ))}
        </div>

        {!loaded && <p style={{ color: "#7D6268", fontSize: 12, textAlign: "center", marginTop: 12 }}>Loading gallery…</p>}
      </div>

      <div style={{ padding: "12px 16px 24px" }}>
        <div style={{ backgroundColor: "#FDF0F5", border: "1px solid #E4C9D5", borderRadius: 18, padding: 20, textAlign: "center" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: "#6B1F3E", marginBottom: 6 }}>Love What You See?</p>
          <p style={{ fontSize: 13, color: "#9C5070", marginBottom: 16, lineHeight: 1.5 }}>Request your appointment and get the look you want.</p>
          <a
            href={`${BASE.replace(/\/$/, "")}#`}
            onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.history.pushState(null, "", `${BASE.replace(/\/$/, "")}/book`); window.dispatchEvent(new PopStateEvent("popstate")); }}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", backgroundColor: "#AC5D7A", color: "#fff", padding: "13px 28px", borderRadius: 50, textDecoration: "none", fontSize: 15, fontWeight: 800 }}
          >
            Request Appointment
          </a>
        </div>
      </div>
    </div>
  );
}
