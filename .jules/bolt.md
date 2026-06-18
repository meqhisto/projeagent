## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-06-12 - Memory Bloat with Prisma findMany and include

**Learning:** When using Prisma's `findMany` alongside nested `include` blocks, entire objects and their relations are fetched into Node.js memory. This can cause massive overfetching, performance degradation, and payload bloat, particularly for calculation-heavy endpoints (e.g., `app/api/properties/stats/route.ts`) that only require specific fields (like `id`, `amount`, `status`) to compute aggregated values.

**Action:** Replace `include` blocks with targeted `select` blocks whenever fetching nested data strictly for backend aggregations. Only fetch the exact scalar fields required to compute the result. This drastically reduces the database payload transfer size and minimizes Node.js memory consumption.
