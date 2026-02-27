## 2026-02-08 - Optimized Prisma API Payload size for /api/parcels
**Learning:** Returning `include: { images: true, zoning: true }` in `prisma.findMany` for list endpoints causes massive JSON payload bloat, especially when tables store a lot of unnecessary fields (like full URLs, retrieval timestamps, etc).
**Action:** When a Next.js App Router client relies on basic subset data like `parcel.images[0].url`, we should explicitly use nested `select` and `take: 1` limit inside the Prisma query to fetch only what the UI component needs, drastically reducing memory footprint and network load.
