## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-07-24 - [Avoid `include` in Analytics & Stats Prisma Queries]
**Learning:** In complex stats or analytics routes (e.g., portfolio properties), fetching complete relational trees using `prisma.findMany({ include: { relations: true } })` pulls massive amounts of unnecessary data into Node.js memory. This causes slow database transfers and severe memory bloat.
**Action:** Always replace `include` with targeted `select` structures to fetch only the specific numeric or categorical fields needed for calculation. Additionally, combine independent Prisma queries into a single `Promise.all` block to execute concurrently, significantly reducing overall API latency.
