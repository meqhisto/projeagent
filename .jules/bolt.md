## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-07-21 - [Prevent overfetching using select]
**Learning:** In analytics-heavy routes like `api/properties/stats`, using `include` to fetch full related models (e.g., `transactions`, `units`) pulls in vast amounts of unnecessary data, causing severe Node.js memory bloat and slow database transfer speeds.
**Action:** Always replace `include` with targeted `select` blocks when fetching deep relations for aggregations. Combine this with `Promise.all` to run independent queries concurrently.
## 2024-07-21 - Ignore Red Herring "Edge Runtime" Errors During Local Builds
**Learning:** When debugging Cloudflare Pages CI failures locally with `npx @cloudflare/next-on-pages`, the tool may unconditionally fail with "routes were not configured to run with the Edge Runtime" if the app uses Prisma (Node.js runtime). This specific local error is a red herring.
**Action:** Do not forcefully add `export const runtime = 'edge'` to fix this local error, as Prisma requires a native Node.js query engine. The correct fix for the CI is to merely delete conflicting `package-lock.json` files and strictly remove any explicit `export const runtime = 'nodejs'` directives from all Next.js files (including API routes and global layouts like `app/layout.tsx`).
