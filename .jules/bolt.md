## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.
## 2024-04-26 - Nullish Coalescing vs Logical OR for Database Aggregates
**Learning:** When applying mapped database aggregations (like an average score calculated via Prisma's `_avg`) to in-memory records, using logical OR (`|| null`) to handle missing map entries will incorrectly convert a valid aggregate of exactly `0` into `null`.
**Action:** Always use the nullish coalescing operator (`?? null`) when mapping computed numerics from a Map to preserve intentional zeroes.
