# Ravishing Beauté — Mobile App

## Overview
A polished native mobile app (Expo/React Native) for Ravishing Beauté, Shawna's hair salon in Calumet City / NWI. Premium, feminine, modern aesthetic using Playfair Display headings and a dusty rose + champagne color palette.

## Architecture

### Monorepo Structure (pnpm workspace)
- `artifacts/ravishing-beaute-app/` — Expo (React Native) mobile app (port 23816, preview path `/`)
- `artifacts/api-server/` — Express 5 API server (port 8080, path `/api`)
- `lib/api-spec/` — OpenAPI 3.1 specification (source of truth for API contract)
- `lib/api-client-react/` — Orval-generated React Query hooks
- `lib/api-zod/` — Orval-generated Zod schemas
- `lib/db/` — Drizzle ORM schema + PostgreSQL migrations

### Key Technologies
- **Mobile:** Expo SDK, React Native, Expo Router (tab navigation), expo-image, expo-linear-gradient, expo-haptics
- **Backend:** Express 5, Drizzle ORM, PostgreSQL
- **Fonts:** Playfair Display (headings) + Inter (body) via expo-google-fonts
- **Color Palette:** Dusty rose primary `#AC5D7A`, warm cream background `#F9F5F0`, champagne accent `#D9A96A`

## App Tabs (5)
1. **Home** — Hero photo with logo overlay, featured services, gallery strip, featured reviews, CTA
2. **Services** — Full service menu with pricing grouped by category (Braids / Styling / Weaves)
3. **Gallery** — Photo grid with real client photos
4. **Reviews** — Client reviews from DB with star ratings
5. **Book / Contact** — SMS booking, hours, location, social links

## Services & Pricing
- Small Knotless Braids — $220+ (5–7 hrs, hair included)
- Medium Knotless Braids — $180+ (4–6 hrs, hair included)
- Large Knotless Braids — $140+ (3–4 hrs, hair included)
- Feed-In Braids — $85+ (2–3 hrs, hair included)
- Stitch Braids — $95+ (2–4 hrs, hair included)
- Bob Braids — $150+ (2–3 hrs, hair included)
- Sleek Ponytail — $75+ (1–2 hrs)
- Quick Weave — $100+ (2–3 hrs)

## Add-ons
- Extra Length +$25 | Boho Curls +$35 | Custom Color +$20 | Wash + Blow Dry Prep +$30

## API Endpoints
- `GET /api/healthz` — Health check
- `GET /api/reviews` — All approved reviews
- `GET /api/reviews/featured` — Featured approved reviews

## Database
- **Table:** `reviews` — id, client_name, rating, body, service, created_at, featured, approved
- DB provisioned via Replit PostgreSQL (DATABASE_URL env var)
- Schema managed by Drizzle ORM (`lib/db/src/schema/reviews.ts`)

## Business Details (Shawna)
- Styling since 2016, cosmetology school 2023
- Hours: Tuesday–Saturday, 8:30 AM – 6:00 PM (closed Sun/Mon)
- By appointment only, $25 non-refundable deposit required
- Braiding hair provided in colors 1, 1B, 2, 4 only
- "Please come detangled to stay on schedule"
- Contact/booking via SMS: `7085743658`

## Logo
- Transparent PNG (teal script on transparent): `artifacts/ravishing-beaute-app/assets/images/logo-cropped.png`
- Displayed in home hero overlay, centered at top

## Key Files
- `artifacts/ravishing-beaute-app/app/_layout.tsx` — Root layout, fonts, QueryClient
- `artifacts/ravishing-beaute-app/app/(tabs)/_layout.tsx` — Tab bar configuration
- `artifacts/ravishing-beaute-app/app/(tabs)/index.tsx` — Home screen with hero + logo
- `artifacts/ravishing-beaute-app/app/(tabs)/services.tsx` — Services list
- `artifacts/ravishing-beaute-app/app/(tabs)/gallery.tsx` — Photo gallery
- `artifacts/ravishing-beaute-app/app/(tabs)/reviews.tsx` — Reviews from API
- `artifacts/ravishing-beaute-app/app/(tabs)/contact.tsx` — Booking + contact
- `artifacts/api-server/src/routes/reviews.ts` — Reviews API routes
- `lib/db/src/schema/reviews.ts` — Reviews DB schema

## Admin Panel (API-level)
- Auth: HMAC-SHA256 token from `SESSION_SECRET` + `ADMIN_PASSWORD` secrets
- Admin routes in `artifacts/api-server/src/routes/admin.ts`
- `POST /api/admin/login`, `GET /api/admin/verify`, `GET /api/admin/reviews`, `PATCH /api/admin/reviews/:id`, `DELETE /api/admin/reviews/:id`

## Important Notes
- **Phone number:** Placeholder `5550000000` in `app/(tabs)/index.tsx` and `app/(tabs)/contact.tsx` — replace with Shawna's real number
- Reviews display fallback data when API is unavailable (graceful degradation)
- To run codegen after OpenAPI spec changes: `pnpm --filter @workspace/api-spec run codegen`
