## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-22 - Avoid Over-Fetching Nested Relationships for Aggregate Counts
**Learning:** Found a performance bottleneck in `app/api/contractors/route.ts` where large nested relationship arrays (like `matches` including `parcel` and `customer`) were being eagerly fetched into memory merely to display their count (`contractor.matches.length`).
**Action:** When only aggregate counts of relations are needed in API responses, use Prisma's `include: { _count: { select: { matches: true } } }` and map the frontend interfaces to read `_count.matches` to drastically reduce payload size and memory overhead.
