import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type GalleryImage = {
  id: number;
  imageUrl: string;
  caption: string;
  category: string;
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
};

const MAX_UPLOAD_BYTES = 5.5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1800;

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "12px",
  border: "1px solid #E4D3D8",
  borderRadius: 12,
  fontSize: 14,
  outline: "none",
  backgroundColor: "#fff",
};

function fileSizeLabel(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image. Please choose another photo."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not optimize this image."));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function optimizeGalleryFile(file: File) {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("This photo is too large to process. Please choose a smaller image.");
  }

  if (file.type === "image/jpeg" && file.size <= MAX_UPLOAD_BYTES) {
    return {
      blob: file,
      fileName: file.name || "gallery-image.jpg",
      contentType: file.type,
      wasOptimized: false,
    };
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not optimize this image on this device.");
  context.drawImage(image, 0, 0, width, height);

  const qualities = [0.82, 0.74, 0.66, 0.58, 0.5, 0.42];
  let bestBlob = await canvasToBlob(canvas, qualities[0]);
  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, quality);
    bestBlob = blob;
    if (blob.size <= MAX_UPLOAD_BYTES) break;
  }

  if (bestBlob.size > MAX_UPLOAD_BYTES) {
    throw new Error(`This photo is still ${fileSizeLabel(bestBlob.size)} after optimization. Please choose a smaller photo.`);
  }

  const safeName = (file.name || "gallery-image").replace(/\.[^.]+$/, "");
  return {
    blob: bestBlob,
    fileName: `${safeName}.jpg`,
    contentType: "image/jpeg",
    wasOptimized: true,
  };
}

export default function AdminGallery() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Style");
  const [featured, setFeatured] = useState(false);
  const [visible, setVisible] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

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

  useEffect(() => {
    if (token) void loadImages();
  }, [token]);

  const visibleCount = useMemo(() => images.filter((image) => image.visible).length, [images]);
  const featuredCount = useMemo(() => images.filter((image) => image.featured).length, [images]);

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

  async function loadImages() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/gallery", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Could not load gallery photos.");
      const data = (await response.json()) as GalleryImage[];
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load gallery photos.");
      setImages([]);
    } finally {
      setLoading(false);
    }
  }

  async function uploadPhoto() {
    setNotice("");
    if (!file) {
      setNotice("Choose a photo before uploading.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setNotice("Only JPG, PNG, and WebP images are supported.");
      return;
    }

    setUploading(true);
    try {
      setNotice("Optimizing photo for upload…");
      const optimized = await optimizeGalleryFile(file);
      const params = new URLSearchParams({
        caption: caption.trim(),
        category: category.trim() || "Style",
        featured: String(featured),
        visible: String(visible),
        sortOrder: sortOrder.trim() || "0",
      });
      const response = await fetch(`/api/admin/gallery?${params.toString()}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": optimized.contentType,
          "X-File-Name": optimized.fileName,
        },
        body: await optimized.blob.arrayBuffer(),
      });
      const data = (await response.json()) as GalleryImage & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      setImages((current) => [data, ...current]);
      setFile(null);
      setCaption("");
      setCategory("Style");
      setFeatured(false);
      setVisible(true);
      setSortOrder("0");
      setNotice(optimized.wasOptimized ? "Photo optimized and uploaded to the Ravishing Beauté gallery." : "Photo uploaded to the Ravishing Beauté gallery.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function updateImage(id: number, updates: Partial<GalleryImage>) {
    setNotice("");
    try {
      const response = await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = (await response.json()) as GalleryImage & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Update failed.");
      setImages((current) => current.map((image) => (image.id === id ? data : image)));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Update failed.");
    }
  }

  async function removeImage(id: number, hard = false) {
    setNotice("");
    try {
      const response = await fetch(`/api/admin/gallery/${id}${hard ? "?hard=true" : ""}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as GalleryImage & { deleted?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Remove failed.");
      if (hard || data.deleted) {
        setImages((current) => current.filter((image) => image.id !== id));
        setNotice("Photo permanently deleted.");
      } else {
        setImages((current) => current.map((image) => (image.id === id ? data : image)));
        setNotice("Photo hidden from public gallery.");
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Remove failed.");
    }
  }

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Gallery Manager</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to upload and manage gallery photos.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && login()}
            placeholder="Admin password"
            style={{ ...inputStyle, border: `1.5px solid ${passwordError ? "#E04040" : "#E4D3D8"}`, marginBottom: 10 }}
          />
          {passwordError && <p style={{ color: "#E04040", fontSize: 12, marginBottom: 10 }}>{passwordError}</p>}
          <button onClick={login} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 15, fontWeight: 800 }}>Sign In</button>
          <button onClick={() => navigate("/admin")} style={{ width: "100%", padding: "12px 0 0", border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 44 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>← Admin</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>GALLERY</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Photo Manager</p>
          </div>
          <button onClick={() => void loadImages()} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700 }}>{loading ? "Loading" : "Refresh"}</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[["Total", images.length], ["Visible", visibleCount], ["Featured", featuredCount]].map(([label, value]) => (
            <div key={String(label)} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 14, padding: 12, textAlign: "center" }}>
              <p style={{ color: "#201B1C", fontSize: 22, fontWeight: 900 }}>{value}</p>
              <p style={{ color: "#7D6268", fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>{String(label).toUpperCase()}</p>
            </div>
          ))}
        </div>

        <section style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 16, marginBottom: 14, boxShadow: "0 12px 28px rgba(82,42,57,0.05)" }}>
          <p style={{ fontSize: 11, letterSpacing: 1.5, color: "#7D6268", fontWeight: 900, marginBottom: 5 }}>UPLOAD NEW PHOTO</p>
          <p style={{ fontSize: 12.5, color: "#6E565C", lineHeight: 1.45, marginBottom: 12 }}>Add polished work directly to the public Ravishing Beauté gallery. Large phone photos are automatically resized before upload.</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption, example: Medium knotless with curls" style={{ ...inputStyle, marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: 8, marginBottom: 10 }}>
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" style={inputStyle} />
            <input value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} inputMode="numeric" placeholder="Order" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6E565C", fontWeight: 800 }}><input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} /> Featured</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6E565C", fontWeight: 800 }}><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Public</label>
          </div>
          <button onClick={uploadPhoto} disabled={uploading} style={{ width: "100%", padding: "13px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 15, fontWeight: 900, opacity: uploading ? 0.65 : 1 }}>{uploading ? "Optimizing…" : "Upload Photo"}</button>
        </section>

        {notice && <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", borderRadius: 14, padding: 12, color: "#8A6509", fontSize: 12.5, lineHeight: 1.45, marginBottom: 12 }}>{notice}</div>}

        <section style={{ display: "grid", gap: 12 }}>
          {images.length === 0 ? (
            <div style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 16, color: "#7D6268", fontSize: 13 }}>No uploaded gallery photos yet.</div>
          ) : (
            images.map((image) => (
              <div key={image.id} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, overflow: "hidden", boxShadow: "0 12px 28px rgba(82,42,57,0.05)", opacity: image.visible ? 1 : 0.72 }}>
                <div style={{ aspectRatio: "4/5", backgroundColor: "#F3EAED", overflow: "hidden" }}>
                  {image.visible ? (
                    <img src={image.imageUrl} alt={image.caption || "Ravishing Beauté gallery photo"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#7D6268", fontSize: 13, fontWeight: 800 }}>Hidden from public gallery</div>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <input value={image.caption} onChange={(event) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, caption: event.target.value } : item))} onBlur={() => updateImage(image.id, { caption: image.caption })} placeholder="Caption" style={{ ...inputStyle, marginBottom: 8 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 86px", gap: 8, marginBottom: 10 }}>
                    <input value={image.category} onChange={(event) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, category: event.target.value } : item))} onBlur={() => updateImage(image.id, { category: image.category })} style={inputStyle} />
                    <input value={String(image.sortOrder)} inputMode="numeric" onChange={(event) => setImages((current) => current.map((item) => item.id === image.id ? { ...item, sortOrder: Number(event.target.value || 0) } : item))} onBlur={() => updateImage(image.id, { sortOrder: image.sortOrder })} style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    <button onClick={() => updateImage(image.id, { featured: !image.featured })} style={{ padding: "10px 0", border: "1px solid #E4D3D8", borderRadius: 11, backgroundColor: image.featured ? "#FEF9EC" : "#fff", color: image.featured ? "#8A6509" : "#7D6268", fontSize: 12, fontWeight: 900 }}>{image.featured ? "Featured" : "Make Featured"}</button>
                    <button onClick={() => updateImage(image.id, { visible: !image.visible })} style={{ padding: "10px 0", border: "1px solid #E4D3D8", borderRadius: 11, backgroundColor: image.visible ? "#EEF7E9" : "#FFF7FA", color: image.visible ? "#3A6B28" : "#8F4864", fontSize: 12, fontWeight: 900 }}>{image.visible ? "Public" : "Restore"}</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button onClick={() => removeImage(image.id, false)} style={{ padding: "10px 0", border: "1px solid #E4D3D8", borderRadius: 11, backgroundColor: "#FFF7FA", color: "#8F4864", fontSize: 12, fontWeight: 900 }}>Hide</button>
                    <button onClick={() => removeImage(image.id, true)} style={{ padding: "10px 0", border: "1px solid #E04040", borderRadius: 11, backgroundColor: "#fff", color: "#C0392B", fontSize: 12, fontWeight: 900 }}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
