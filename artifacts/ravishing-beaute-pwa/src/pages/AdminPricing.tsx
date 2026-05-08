import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { SERVICE_CATEGORIES, type ServiceCategory } from "@/lib/services";
import {
  applyServicePriceOverrides,
  getCurrentServicePrices,
  type ServicePriceOverride,
} from "@/lib/service-pricing";

type ServicePriceRow = ReturnType<typeof getCurrentServicePrices>[number];

type PriceDraft = {
  basePrice: string;
  priceLabel: string;
};

function makeDefaultLabel(value: string) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? `$${price}+` : "Custom";
}

function moneyInputValue(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

export default function AdminPricing() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [services, setServices] = useState<ServicePriceRow[]>(getCurrentServicePrices());
  const [drafts, setDrafts] = useState<Record<string, PriceDraft>>({});
  const [activeCategory, setActiveCategory] = useState<"all" | ServiceCategory>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("admin_token");
      const hasAccess = localStorage.getItem("admin_access") === "true";
      if (savedToken) {
        setToken(savedToken);
      } else if (hasAccess) {
        setToken("admin-authenticated");
      }
    } catch {
      // Continue to password prompt.
    }
  }, []);

  useEffect(() => {
    if (token) void loadPricing(token);
  }, [token]);

  function refreshLocalRows(overrides: ServicePriceOverride[] = []) {
    if (overrides.length) applyServicePriceOverrides(overrides);
    const rows = getCurrentServicePrices();
    setServices(rows);
    setDrafts(
      Object.fromEntries(
        rows.map((service) => [
          service.serviceId,
          {
            basePrice: moneyInputValue(service.basePrice),
            priceLabel: service.priceLabel,
          },
        ]),
      ),
    );
  }

  async function loadPricing(authToken: string) {
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch("/api/admin/service-prices", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });

      if (!response.ok) {
        setToken("");
        setPasswordError("Please sign in again to edit pricing.");
        return;
      }

      const data = (await response.json()) as { prices?: ServicePriceOverride[] };
      refreshLocalRows(Array.isArray(data.prices) ? data.prices : []);
    } catch {
      refreshLocalRows();
      setNotice("Pricing loaded from the app. Live updates may need a redeploy check if saving fails.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
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

      try {
        localStorage.setItem("admin_access", "true");
        localStorage.setItem("admin_token", data.token);
      } catch {
        // Ignore storage failures.
      }
      setToken(data.token);
    } catch {
      setPasswordError("Connection error. Try again.");
    }
  }

  async function savePrice(service: ServicePriceRow) {
    const draft = drafts[service.serviceId];
    if (!draft) return;

    const basePrice = Number(draft.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setNotice("Enter a valid price of 0 or higher.");
      return;
    }

    setSaving(service.serviceId);
    setNotice("");
    try {
      const priceLabel = draft.priceLabel.trim() || makeDefaultLabel(draft.basePrice);
      const response = await fetch(`/api/admin/service-prices/${encodeURIComponent(service.serviceId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ basePrice, priceLabel }),
      });

      const data = (await response.json()) as { price?: ServicePriceOverride; error?: string };
      if (!response.ok || !data.price) {
        throw new Error(data.error ?? "Failed to save price.");
      }

      refreshLocalRows([data.price]);
      setNotice(`${service.name} updated to ${data.price.priceLabel}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save price.");
    } finally {
      setSaving(null);
    }
  }

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((service) => {
      const categoryMatch = activeCategory === "all" || service.category === activeCategory;
      const searchMatch =
        !q ||
        service.name.toLowerCase().includes(q) ||
        service.group.toLowerCase().includes(q) ||
        service.priceLabel.toLowerCase().includes(q);
      return categoryMatch && searchMatch;
    });
  }, [services, activeCategory, search]);

  if (!token) {
    return (
      <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 380, backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 18, padding: 20, boxShadow: "0 18px 40px rgba(82,42,57,0.08)" }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: "#7D6268", fontWeight: 800, marginBottom: 6 }}>RAVISHING BEAUTÉ ADMIN</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 700, color: "#201B1C", marginBottom: 8 }}>Pricing Manager</p>
          <p style={{ fontSize: 13, color: "#7D6268", lineHeight: 1.5, marginBottom: 16 }}>Enter the admin password to edit live service pricing.</p>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleLogin()}
            placeholder="Admin password"
            style={{ width: "100%", boxSizing: "border-box", padding: "14px", border: `1.5px solid ${passwordError ? "#E04040" : "#E4D3D8"}`, borderRadius: 12, fontSize: 15, outline: "none", marginBottom: 10 }}
          />
          {passwordError && <p style={{ color: "#E04040", fontSize: 12, marginBottom: 10 }}>{passwordError}</p>}
          <button onClick={handleLogin} style={{ width: "100%", padding: "14px 0", border: "none", borderRadius: 12, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 15, fontWeight: 800 }}>Sign In</button>
          <button onClick={() => navigate("/admin")} style={{ width: "100%", padding: "12px 0 0", border: "none", background: "none", color: "#7D6268", fontSize: 13 }}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F9F5F0", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 16px", backgroundColor: "#fff", borderBottom: "1px solid #E4D3D8", position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => navigate("/admin")} style={{ border: "none", background: "none", color: "#7D6268", fontSize: 13, cursor: "pointer" }}>← Admin</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: "#7D6268", fontWeight: 800 }}>LIVE SERVICES</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#201B1C" }}>Pricing Manager</p>
          </div>
          <button onClick={() => loadPricing(token)} style={{ border: "none", background: "none", color: "#AC5D7A", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Refresh</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 12 }}>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: "#6E565C" }}>
            Edit prices here and they update the public Services page and Booking estimates after the site reloads. Use price labels like <strong>$220+</strong> or <strong>Custom</strong>.
          </p>
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search service, group, or price..."
          style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #E4D3D8", borderRadius: 13, backgroundColor: "#fff", fontSize: 14, outline: "none", marginBottom: 10 }}
        />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10, marginBottom: 8 }}>
          {SERVICE_CATEGORIES.map((category) => {
            const selected = activeCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                style={{ flex: "0 0 auto", border: `1px solid ${selected ? "#AC5D7A" : "#E4D3D8"}`, backgroundColor: selected ? "#AC5D7A" : "#fff", color: selected ? "#fff" : "#7D6268", borderRadius: 999, padding: "9px 13px", fontSize: 12, fontWeight: 800 }}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {notice && (
          <div style={{ backgroundColor: "#FEF9EC", border: "1px solid #EDD9A3", color: "#8A6509", borderRadius: 12, padding: 10, fontSize: 12, marginBottom: 10 }}>
            {notice}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>Loading pricing…</p>
        ) : filteredServices.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7D6268", paddingTop: 30 }}>No services found.</p>
        ) : (
          filteredServices.map((service) => {
            const draft = drafts[service.serviceId] ?? { basePrice: moneyInputValue(service.basePrice), priceLabel: service.priceLabel };
            return (
              <div key={service.serviceId} style={{ backgroundColor: "#fff", border: "1px solid #E4D3D8", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 10px 24px rgba(82,42,57,0.045)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#201B1C", marginBottom: 2 }}>{service.name}</p>
                    <p style={{ fontSize: 11, color: "#7D6268" }}>{service.group} • {service.duration}</p>
                  </div>
                  <span style={{ backgroundColor: "#FBF4F6", border: "1px solid #F0DDE5", color: "#AC5D7A", borderRadius: 999, padding: "4px 9px", fontSize: 12, fontWeight: 800 }}>{service.priceLabel}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: 11, color: "#7D6268", fontWeight: 700, marginBottom: 4 }}>Base Price</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={draft.basePrice}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setDrafts((prev) => ({
                          ...prev,
                          [service.serviceId]: {
                            basePrice: nextValue,
                            priceLabel: prev[service.serviceId]?.priceLabel || makeDefaultLabel(nextValue),
                          },
                        }));
                      }}
                      style={{ width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #E4D3D8", borderRadius: 10, fontSize: 14, outline: "none" }}
                    />
                  </label>
                  <label style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: 11, color: "#7D6268", fontWeight: 700, marginBottom: 4 }}>Display Label</span>
                    <input
                      value={draft.priceLabel}
                      onChange={(event) => {
                        const nextLabel = event.target.value;
                        setDrafts((prev) => ({
                          ...prev,
                          [service.serviceId]: {
                            basePrice: prev[service.serviceId]?.basePrice ?? moneyInputValue(service.basePrice),
                            priceLabel: nextLabel,
                          },
                        }));
                      }}
                      placeholder={makeDefaultLabel(draft.basePrice)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #E4D3D8", borderRadius: 10, fontSize: 14, outline: "none" }}
                    />
                  </label>
                </div>

                <button
                  onClick={() => savePrice(service)}
                  disabled={saving === service.serviceId}
                  style={{ width: "100%", padding: "12px 0", border: "none", borderRadius: 11, backgroundColor: "#AC5D7A", color: "#fff", fontSize: 14, fontWeight: 800, opacity: saving === service.serviceId ? 0.65 : 1 }}
                >
                  {saving === service.serviceId ? "Saving…" : "Save Price"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
