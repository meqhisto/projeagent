## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-06-09 - Prevent DB Overfetching in Stats Views
**Learning:** Found an anti-pattern in `app/api/properties/stats/route.ts` where `include: { units: true, transactions: true }` was used to fetch all unit and transaction fields into memory just to calculate some aggregations like `totalIncome`, `totalExpenses`, and `monthlyRentPotential`.
**Action:** Always use targeted `select` blocks inside `findMany()` queries to fetch only the exact fields needed for in-memory calculations (e.g., `id`, `status`, `amount`), reducing the payload size and Node.js memory footprint.
