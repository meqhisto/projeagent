## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-18 - Overfetching Lists within API Relation Includes
**Learning:** Returning full object arrays (e.g., `matches: { include: { parcel: true, customer: true } }`) inside a `findMany` solely to compute an array length `matches.length` on the frontend causes severe N+1-like overfetching, wasting memory and bandwidth.
**Action:** Use Prisma's `_count: { select: { matches: true } }` inside `include` to push count aggregations to the DB. Update frontend interfaces to check `_count.matches` instead of array `.length`.
