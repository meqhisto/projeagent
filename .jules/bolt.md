## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-06-05 - Parallelize Independent Queries and Use Targeted Selects
**Learning:** Found multiple independent database queries being executed sequentially in analytics routes (like `app/api/properties/stats/route.ts`). Additionally, full relational object graphs were being over-fetched into memory just to aggregate specific fields (e.g., computing totals from amounts). This causes high latency and large memory footprints.
**Action:** Use `Promise.all` to parallelize independent database queries (e.g., fetching main lists, recent activity, and historical trends concurrently). Couple this with targeted `select` blocks instead of `include` to fetch only the specific columns needed for in-memory aggregations (e.g., `id`, `amount`, `status`) to drastically reduce DB transfer payload and Node.js memory bloat.
