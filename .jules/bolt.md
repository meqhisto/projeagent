## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-06-28 - Optimizing Prisma Nested Includes

**Learning:** When performing complex in-memory aggregations on nested relations where database-level `groupBy` cannot be fully utilized, using `include: { relation: true }` in `prisma.findMany()` severely bloats Node.js memory and degrades latency because it eagerly fetches all fields of the related models (such as large text descriptions, image blobs, or other unneeded data).

**Action:** Always replace `include: { relation: true }` with targeted `select` blocks to fetch only the specific fields required (e.g., `id`, `status`, `amount`). Additionally, when multiple aggregations are needed, execute independent queries concurrently using `Promise.all()` to drastically reduce database transfer payload and network roundtrip time.
