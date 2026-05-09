## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-09 - N+1 Query Overfetching in APIs
**Learning:** Found N+1 query and overfetching issue where nested relationships (like ratings, matches) are fully retrieved into Node.js memory just to compute counts and averages. This causes excessive data transfer.
**Action:** Use Prisma's `_count` aggregate in `include` alongside targeted `select` blocks for nested relationships to dramatically reduce DB latency and payload size. Destructure away the selected array before returning it as JSON.
