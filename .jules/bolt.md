## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-07-13 - Prisma In-Memory Analytics Optimization
**Learning:** For analytical and statistical endpoints (like `app/api/properties/stats/route.ts`), fetching extensive relational data using `include: { relation: true }` alongside `findMany()` triggers a massive over-fetch. The resulting full records consume excessive Node.js memory and significantly slow down payload transfer and processing, even if only a few fields are later aggregated.
**Action:** When calculating statistics in-memory where database-level group by isn't feasible, always replace `include` with targeted `select` blocks. Select only the necessary identifiers and numeric fields required to compute the final JSON response (e.g., `id`, `amount`, `status`) to drastically reduce Node.js memory bloat.
