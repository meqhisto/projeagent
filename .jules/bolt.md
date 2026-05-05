## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-05 - Avoid Fetching Large Relational Arrays for Length Checking
**Learning:** In list endpoints like `app/api/contractors/route.ts`, eagerly including full nested relations (e.g., `include: { matches: { include: { parcel: true, customer: true } } }`) just to check `matches.length` in the frontend drastically inflates the JSON payload and database memory footprint.
**Action:** Replace full array includes with Prisma's `_count` aggregate (e.g., `include: { _count: { select: { matches: true } } }`) and update the frontend consumer to use `item._count.matches` instead of `item.matches.length`. Also strip any intermediate data used for computation before returning the JSON response.
