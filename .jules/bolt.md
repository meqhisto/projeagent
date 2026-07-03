## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2025-02-14 - Replace generic includes with targeted selects for memory-heavy aggregations
**Learning:** Using `include: { units: true, transactions: true }` overfetches entire nested records (potentially hundreds per property) when performing in-memory statistics calculations, severely increasing Node.js memory footprint and database payload sizes.
**Action:** Always replace generic `include` blocks with targeted `select` blocks (e.g., `units: { select: { id: true, status: true, monthlyRent: true } }`) when fetching related records for aggregations. Remember to always fetch the `id` field within `select` blocks for caching and Next.js listing.
