import { SERVICES, type ServiceDetail } from "@/lib/services";

export type ServicePriceOverride = {
  serviceId: string;
  basePrice: number;
  priceLabel: string;
  updatedAt?: string;
};

const pricingByService = new Map<string, ServicePriceOverride>();

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function applyOne(service: ServiceDetail, override: ServicePriceOverride) {
  const basePrice = normalizePrice(override.basePrice);
  if (basePrice === null) return;
  service.basePrice = basePrice;
  service.priceLabel = override.priceLabel || (basePrice > 0 ? `$${basePrice}+` : "Custom");
}

export function applyServicePriceOverrides(overrides: ServicePriceOverride[]) {
  for (const override of overrides) {
    if (!override.serviceId) continue;
    const basePrice = normalizePrice(override.basePrice);
    if (basePrice === null) continue;
    pricingByService.set(override.serviceId, {
      serviceId: override.serviceId,
      basePrice,
      priceLabel: override.priceLabel || (basePrice > 0 ? `$${basePrice}+` : "Custom"),
      updatedAt: override.updatedAt,
    });
  }

  for (const service of SERVICES) {
    const override = pricingByService.get(service.id);
    if (override) applyOne(service, override);
  }
}

export async function fetchServicePriceOverrides(): Promise<ServicePriceOverride[]> {
  const response = await fetch("/api/service-prices", {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Failed to load service pricing");
  const data = (await response.json()) as { prices?: ServicePriceOverride[] };
  return Array.isArray(data.prices) ? data.prices : [];
}

export async function preloadServicePricing() {
  try {
    const prices = await fetchServicePriceOverrides();
    applyServicePriceOverrides(prices);
  } catch (error) {
    console.warn("[RB Pricing] Using built-in service pricing", error);
  }
}

export function getCurrentServicePrices() {
  return SERVICES.map((service) => ({
    serviceId: service.id,
    name: service.name,
    group: service.group,
    category: service.category,
    basePrice: service.basePrice,
    priceLabel: service.priceLabel,
    duration: service.duration,
    updatedAt: pricingByService.get(service.id)?.updatedAt,
  }));
}
