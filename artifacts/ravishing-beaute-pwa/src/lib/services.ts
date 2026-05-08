export type AddOn = {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
};

export type ServiceCategory = "braids" | "weaves" | "natural";

export type ServiceDetail = {
  id: string;
  name: string;
  category: ServiceCategory;
  group: string;
  basePrice: number;
  priceLabel: string;
  duration: string;
  hairIncluded: boolean;
  description: string;
  details: string[];
  badge?: { label: string; color: string; bg: string };
  addOns: AddOn[];
};

export const HAIR_INCLUDED_NOTE =
  "Braiding hair is included in natural colors only: 1, 1B, 2, and 4. Specialty colors must be requested in advance.";
export const DEPOSIT_NOTE =
  "$25 non-refundable deposit required to secure approved appointments.";
export const HOURS_NOTE =
  "Tuesday–Saturday, 8:30 AM – 6:00 PM. Closed Sunday & Monday.";
export const SAME_DAY_NOTE =
  "Same-day bookings are request-only and must be approved.";
export const PREP_NOTE =
  "Please arrive detangled to protect your appointment time and keep the salon schedule flowing.";

export const ADD_ONS: AddOn[] = [
  {
    id: "boho-human-hair",
    name: "Boho Human Hair",
    price: 25,
    priceLabel: "+$25",
  },
  {
    id: "past-waist",
    name: "Past Waist Length",
    price: 25,
    priceLabel: "+$25",
  },
  { id: "crimps", name: "Crimps", price: 50, priceLabel: "+$50" },
  { id: "colored-hair", name: "Colored Hair", price: 15, priceLabel: "+$15" },
  {
    id: "beads-accessories",
    name: "Beads / Accessories",
    price: 10,
    priceLabel: "+$10+",
  },
  {
    id: "braid-take-down",
    name: "Braid Take Down",
    price: 35,
    priceLabel: "+$35–50",
  },
  {
    id: "sew-in-take-down",
    name: "Sew-In Take Down",
    price: 50,
    priceLabel: "+$50",
  },
];

const braidAddOns = [
  "boho-human-hair",
  "past-waist",
  "colored-hair",
  "beads-accessories",
  "braid-take-down",
];
const weaveAddOns = ["crimps", "colored-hair", "sew-in-take-down"];
const ponytailAddOns = ["crimps", "colored-hair"];

function addOns(ids: string[]) {
  return ids
    .map((id) => ADD_ONS.find((addOn) => addOn.id === id))
    .filter((addOn): addOn is AddOn => Boolean(addOn));
}

export const SERVICE_CATEGORIES: {
  id: "all" | ServiceCategory;
  label: string;
  eyebrow: string;
}[] = [
  { id: "all", label: "All", eyebrow: "Complete menu" },
  { id: "braids", label: "Braids", eyebrow: "Knotless, feed-ins & specialty" },
  { id: "weaves", label: "Weaves", eyebrow: "Quick weaves & sew-ins" },
  { id: "natural", label: "Natural", eyebrow: "Ponytails & natural styling" },
];

export const SERVICES: ServiceDetail[] = [
  {
    id: "small-knotless",
    name: "Small Knotless",
    category: "braids",
    group: "Knotless",
    basePrice: 375,
    priceLabel: "$375+",
    duration: "7–9 hrs",
    hairIncluded: true,
    description:
      "Ultra-refined, lightweight knotless braids with a soft editorial finish and long-wear protective styling.",
    details: [
      "Low-tension install",
      "Polished parting",
      "Protective style finish",
    ],
    badge: { label: "Signature", color: "#7A3D6E", bg: "#F8E8F4" },
    addOns: addOns(braidAddOns),
  },
  {
    id: "medium-knotless",
    name: "Medium Knotless",
    category: "braids",
    group: "Knotless",
    basePrice: 220,
    priceLabel: "$220+",
    duration: "5–7 hrs",
    hairIncluded: true,
    description:
      "A balanced knotless set with clean parts, comfortable movement, and a timeless salon-polished finish.",
    details: [
      "Versatile fullness",
      "Everyday luxury",
      "Low-tension foundation",
    ],
    badge: { label: "Most booked", color: "#5C6F2E", bg: "#EEF5DF" },
    addOns: addOns(braidAddOns),
  },
  {
    id: "large-knotless",
    name: "Large Knotless",
    category: "braids",
    group: "Knotless",
    basePrice: 150,
    priceLabel: "$150+",
    duration: "3–4 hrs",
    hairIncluded: true,
    description:
      "Bold, neat knotless braids designed for a chic statement style with a lighter appointment window.",
    details: ["Statement scale", "Comfortable wear", "Clean finish"],
    addOns: addOns(braidAddOns),
  },
  {
    id: "two-feed-ins",
    name: "2 Feed-Ins",
    category: "braids",
    group: "Feed-Ins",
    basePrice: 75,
    priceLabel: "$75+",
    duration: "1.5–2 hrs",
    hairIncluded: true,
    description:
      "Sleek sculpted feed-ins with a smooth, polished finish for a refined minimal look.",
    details: ["Flat natural start", "Sleek finish", "Great refresh style"],
    addOns: addOns(["past-waist", "colored-hair", "beads-accessories"]),
  },
  {
    id: "six-feed-ins",
    name: "6 Feed-Ins",
    category: "braids",
    group: "Feed-Ins",
    basePrice: 145,
    priceLabel: "$145+",
    duration: "2.5–3.5 hrs",
    hairIncluded: true,
    description:
      "A clean feed-in set with defined parting, soft hold, and elevated protective styling.",
    details: [
      "Defined sections",
      "Protective styling",
      "Natural color hair included",
    ],
    addOns: addOns(["past-waist", "colored-hair", "beads-accessories"]),
  },
  {
    id: "eight-feed-ins",
    name: "8 Feed-Ins",
    category: "braids",
    group: "Feed-Ins",
    basePrice: 165,
    priceLabel: "$165+",
    duration: "3–4 hrs",
    hairIncluded: true,
    description:
      "Fuller feed-ins with crisp detailing and a photo-ready finish from every angle.",
    details: ["Crisp parting", "Fuller finish", "Protective styling"],
    addOns: addOns(["past-waist", "colored-hair", "beads-accessories"]),
  },
  {
    id: "ten-fourteen-feed-ins",
    name: "10–14 Feed-Ins",
    category: "braids",
    group: "Feed-Ins",
    basePrice: 185,
    priceLabel: "$185+",
    duration: "4–5 hrs",
    hairIncluded: true,
    description:
      "Detailed feed-ins for clients who want more density, artistry, and a beautifully structured result.",
    details: ["Detailed braid count", "Structured finish", "Style longevity"],
    addOns: addOns(["past-waist", "colored-hair", "beads-accessories"]),
  },
  {
    id: "fourteen-twenty-feed-ins",
    name: "14–20+ Feed-Ins",
    category: "braids",
    group: "Feed-Ins",
    basePrice: 225,
    priceLabel: "$225+",
    duration: "5–6 hrs",
    hairIncluded: true,
    description:
      "High-detail feed-ins with a premium, intricate finish for a fuller protective style moment.",
    details: ["Intricate detailing", "Full protective style", "Premium finish"],
    addOns: addOns(["past-waist", "colored-hair", "beads-accessories"]),
  },
  {
    id: "fulani-braids",
    name: "Fulani Braids",
    category: "braids",
    group: "Specialty",
    basePrice: 300,
    priceLabel: "$300+",
    duration: "5–7 hrs",
    hairIncluded: true,
    description:
      "An artful braided style with face-framing detail, beautiful movement, and elevated protective styling.",
    details: [
      "Specialty braid design",
      "Face-framing finish",
      "Protective style artistry",
    ],
    badge: { label: "Editorial", color: "#7A5C1E", bg: "#FBF3DF" },
    addOns: addOns(braidAddOns),
  },
  {
    id: "lemonade-braids",
    name: "Lemonade Braids",
    category: "braids",
    group: "Specialty",
    basePrice: 225,
    priceLabel: "$225+",
    duration: "4–5.5 hrs",
    hairIncluded: true,
    description:
      "Side-swept braids with clean direction, polished edges, and a confident luxury silhouette.",
    details: ["Side-swept styling", "Clean direction", "Statement finish"],
    addOns: addOns(braidAddOns),
  },
  {
    id: "braided-ponytail",
    name: "Braided Ponytail",
    category: "braids",
    group: "Specialty",
    basePrice: 225,
    priceLabel: "$225+",
    duration: "3.5–5 hrs",
    hairIncluded: true,
    description:
      "A lifted braided ponytail with sculpted polish, secure styling, and a runway-inspired profile.",
    details: ["Sculpted base", "Secure lift", "Polished profile"],
    addOns: addOns(braidAddOns),
  },
  {
    id: "middle-part-quick-weave",
    name: "Middle Part Quick Weave",
    category: "weaves",
    group: "Quick Weaves",
    basePrice: 125,
    priceLabel: "$125+",
    duration: "2–3 hrs",
    hairIncluded: false,
    description:
      "A protective cap foundation with a sleek middle part and seamless, salon-finished styling.",
    details: ["Protective cap method", "Sleek parting", "Polished finish"],
    addOns: addOns(weaveAddOns),
  },
  {
    id: "side-part-quick-weave",
    name: "Side Part Quick Weave",
    category: "weaves",
    group: "Quick Weaves",
    basePrice: 125,
    priceLabel: "$125+",
    duration: "2–3 hrs",
    hairIncluded: false,
    description:
      "A soft side-part quick weave shaped for movement, framing, and a sophisticated finish.",
    details: ["Protective cap method", "Face-framing shape", "Soft finish"],
    addOns: addOns(weaveAddOns),
  },
  {
    id: "free-part-quick-weave",
    name: "Free Part Quick Weave",
    category: "weaves",
    group: "Quick Weaves",
    basePrice: 125,
    priceLabel: "$125+",
    duration: "2–3 hrs",
    hairIncluded: false,
    description:
      "A versatile quick weave install designed for flexible parting and a clean, blended finish.",
    details: ["Flexible parting", "Protective cap method", "Custom styling"],
    addOns: addOns(weaveAddOns),
  },
  {
    id: "half-up-half-down",
    name: "Half Up Half Down",
    category: "weaves",
    group: "Quick Weaves",
    basePrice: 150,
    priceLabel: "$150+",
    duration: "2.5–3.5 hrs",
    hairIncluded: false,
    description:
      "A feminine half-up style with soft volume, a secure foundation, and camera-ready polish.",
    details: ["Lifted crown", "Soft movement", "Secure styling"],
    addOns: addOns(weaveAddOns),
  },
  {
    id: "half-freestyle-half-quick-weave",
    name: "Half Freestyle Half Quick Weave",
    category: "weaves",
    group: "Quick Weaves",
    basePrice: 175,
    priceLabel: "$175+",
    duration: "3–4 hrs",
    hairIncluded: false,
    description:
      "A custom hybrid style blending freestyle detail with quick-weave glam for a standout finish.",
    details: ["Custom freestyle detail", "Hybrid styling", "Statement finish"],
    badge: { label: "Custom", color: "#7A3D6E", bg: "#F8E8F4" },
    addOns: addOns(weaveAddOns),
  },
  {
    id: "standard-sew-in",
    name: "Standard Sew-In",
    category: "weaves",
    group: "Sew-Ins",
    basePrice: 150,
    priceLabel: "$150+",
    duration: "2.5–3.5 hrs",
    hairIncluded: false,
    description:
      "A classic sew-in install with a secure foundation, smooth blending, and polished styling.",
    details: ["Secure foundation", "Classic install", "Smooth blend"],
    addOns: addOns(weaveAddOns),
  },
  {
    id: "half-up-half-down-sew-in",
    name: "Half Up Half Down Sew-In",
    category: "weaves",
    group: "Sew-Ins",
    basePrice: 165,
    priceLabel: "$165+",
    duration: "3–4 hrs",
    hairIncluded: false,
    description:
      "A sew-in version of the half-up look with added security, softness, and luxury movement.",
    details: ["Secure sew-in base", "Half-up styling", "Soft movement"],
    addOns: addOns(weaveAddOns),
  },
  {
    id: "sleek-ponytail",
    name: "Sleek Ponytail",
    category: "natural",
    group: "Ponytails / Natural",
    basePrice: 140,
    priceLabel: "$140+",
    duration: "1.5–2.5 hrs",
    hairIncluded: false,
    description:
      "A smooth molded ponytail with clean edges, shine, and an elegant finish that holds beautifully.",
    details: ["Molded base", "Smooth shine", "Elegant finish"],
    badge: { label: "Polished", color: "#7A5C1E", bg: "#FBF3DF" },
    addOns: addOns(ponytailAddOns),
  },
  {
    id: "natural-styles",
    name: "Natural Styles",
    category: "natural",
    group: "Ponytails / Natural",
    basePrice: 0,
    priceLabel: "Braided equivalent − $50",
    duration: "Varies by style",
    hairIncluded: false,
    description:
      "Natural hair styling priced from the comparable braided look, adjusted for a refined natural finish.",
    details: [
      "Consult-led pricing",
      "Natural finish",
      "Detangled arrival required",
    ],
    addOns: addOns(["beads-accessories"]),
  },
];

const LEGACY_SERVICE_IDS: Record<string, string> = {
  "knotless-sm": "small-knotless",
  "knotless-md": "medium-knotless",
  "knotless-lg": "large-knotless",
  feedin: "two-feed-ins",
  stitch: "six-feed-ins",
  bobbraids: "fulani-braids",
  ponytail: "sleek-ponytail",
  quickweave: "middle-part-quick-weave",
};

export function getServiceById(id: string) {
  const normalizedId = LEGACY_SERVICE_IDS[id] ?? id;
  return SERVICES.find((service) => service.id === normalizedId);
}

export function getServicesByCategory(category: "all" | ServiceCategory) {
  return category === "all"
    ? SERVICES
    : SERVICES.filter((service) => service.category === category);
}

export function getGroupedServices(services: ServiceDetail[]) {
  return services.reduce<Record<string, ServiceDetail[]>>((groups, service) => {
    groups[service.group] = [...(groups[service.group] ?? []), service];
    return groups;
  }, {});
}
