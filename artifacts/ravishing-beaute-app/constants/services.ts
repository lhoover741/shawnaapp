export type AddOn = {
  id: string;
  name: string;
  price: number;
};

export type ServiceDetail = {
  id: string;
  name: string;
  basePrice: number;
  priceLabel: string;
  duration: string;
  hairIncluded: boolean;
  description: string;
  badge?: { label: string; color: string; bg: string };
  addOns: AddOn[];
};

export const SERVICES: ServiceDetail[] = [
  {
    id: "knotless-sm",
    name: "Small Knotless Braids",
    basePrice: 220,
    priceLabel: "$220+",
    duration: "5–7 hrs",
    hairIncluded: true,
    description: "Clean parts, lightweight finish, and a natural look. Perfect for those who want a polished protective style that lasts.",
    badge: { label: "⭐ Most Popular", color: "#5C6F2E", bg: "#EEF5DF" },
    addOns: [
      { id: "extra-length", name: "Extra Length", price: 25 },
      { id: "boho-curls", name: "Boho Curls", price: 35 },
      { id: "colored-hair", name: "Colored Hair Request", price: 15 },
      { id: "beads", name: "Beads / Accessories", price: 10 },
      { id: "takedown", name: "Take-Down Service", price: 35 },
    ],
  },
  {
    id: "knotless-md",
    name: "Medium Knotless Braids",
    basePrice: 180,
    priceLabel: "$180+",
    duration: "4–6 hrs",
    hairIncluded: true,
    description: "A polished everyday braid style that balances size, fullness, and versatility for a timeless finish.",
    addOns: [
      { id: "extra-length", name: "Extra Length", price: 20 },
      { id: "boho-curls", name: "Boho Curls", price: 30 },
      { id: "colored-hair", name: "Colored Hair Request", price: 15 },
      { id: "beads", name: "Beads / Accessories", price: 10 },
      { id: "takedown", name: "Take-Down Service", price: 35 },
    ],
  },
  {
    id: "knotless-lg",
    name: "Large Knotless Braids",
    basePrice: 140,
    priceLabel: "$140+",
    duration: "3–4 hrs",
    hairIncluded: true,
    description: "A bold, neat finish with chunky sections. Ideal for a statement look with comfort and low tension.",
    addOns: [
      { id: "extra-length", name: "Extra Length", price: 15 },
      { id: "boho-curls", name: "Boho Curls", price: 25 },
      { id: "colored-hair", name: "Colored Hair Request", price: 15 },
      { id: "beads", name: "Beads / Accessories", price: 10 },
      { id: "takedown", name: "Take-Down Service", price: 35 },
    ],
  },
  {
    id: "feedin",
    name: "Feed-In Braids",
    basePrice: 85,
    priceLabel: "$85+",
    duration: "2–3 hrs",
    hairIncluded: true,
    description: "Sleek, sculpted braids fed in at the root for a flat, natural look. Final price may vary by braid count and length.",
    badge: { label: "🌸 Summer Fave", color: "#7A3D6E", bg: "#F8E8F4" },
    addOns: [
      { id: "extra-length", name: "Extra Length", price: 15 },
      { id: "designed-parts", name: "Designed Parts", price: 15 },
      { id: "additional-count", name: "Additional Braid Count", price: 20 },
      { id: "colored-hair", name: "Colored Hair Request", price: 15 },
      { id: "beads", name: "Beads / Accessories", price: 10 },
    ],
  },
  {
    id: "stitch",
    name: "Stitch Braids",
    basePrice: 95,
    priceLabel: "$95+",
    duration: "2–4 hrs",
    hairIncluded: true,
    description: "Defined parts with a clean stitched finish that creates a crisp, graphic look close to the scalp.",
    addOns: [
      { id: "extra-length", name: "Extra Length", price: 15 },
      { id: "designed-parts", name: "Designed Parts", price: 20 },
      { id: "additional-count", name: "Additional Braid Count", price: 20 },
      { id: "colored-hair", name: "Colored Hair Request", price: 15 },
      { id: "beads", name: "Beads / Accessories", price: 10 },
    ],
  },
  {
    id: "bobbraids",
    name: "Bob Braids",
    basePrice: 150,
    priceLabel: "$150+",
    duration: "3–5 hrs",
    hairIncluded: true,
    description: "Chic bob-length braid style — short, structured, and effortlessly elegant. A favorite for clients who want a fresh look.",
    badge: { label: "✨ Trending", color: "#7A5C1E", bg: "#FBF3DF" },
    addOns: [
      { id: "boho-curls", name: "Boho Curls", price: 30 },
      { id: "colored-hair", name: "Colored Hair Request", price: 15 },
      { id: "beads", name: "Beads / Accessories", price: 10 },
      { id: "triangle-parts", name: "Triangle Parts", price: 20 },
      { id: "takedown", name: "Take-Down Service", price: 35 },
    ],
  },
  {
    id: "ponytail",
    name: "Sleek Ponytail",
    basePrice: 75,
    priceLabel: "$75+",
    duration: "1.5–2 hrs",
    hairIncluded: false,
    description: "Smooth molded base with a polished, sleek finish. Clean edges, laid baby hairs, and a flawless look.",
    addOns: [
      { id: "wand-curls", name: "Wand Curls", price: 15 },
      { id: "crimps", name: "Crimps", price: 20 },
      { id: "extended-length", name: "Extended Ponytail Length", price: 20 },
      { id: "swoop-bang", name: "Swoop Bang Detail", price: 15 },
      { id: "track-styling", name: "Added Track / Bundle Styling", price: 25 },
    ],
  },
  {
    id: "quickweave",
    name: "Quick Weave",
    basePrice: 100,
    priceLabel: "$100+",
    duration: "2–3 hrs",
    hairIncluded: false,
    description: "Protective cap foundation with clean blending, styling, and a seamless finish. Great for a polished look fast.",
    badge: { label: "🆕 New", color: "#1A5276", bg: "#E8F4FD" },
    addOns: [
      { id: "bob-cut", name: "Bob Cut / Style", price: 20 },
      { id: "wand-curls", name: "Wand Curls", price: 15 },
      { id: "crimps", name: "Crimps", price: 20 },
      { id: "leave-out-blend", name: "Leave-Out Blend", price: 15 },
      { id: "closure-install", name: "Closure Install", price: 30 },
      { id: "takedown", name: "Take-Down Service", price: 35 },
    ],
  },
];

export const HAIR_COLORS = ["1", "1B", "2", "4", "Other color request"];
