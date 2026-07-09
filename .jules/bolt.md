## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-07-09 - Prevent DB Overfetching in Stats APIs
**Learning:** Overfetching full relational objects (e.g., `properties`, `units`, `transactions`) with `include` just to run in-memory calculations (like counting or summing values) wastes bandwidth, memory, and database processing. This was observed in `app/api/properties/stats/route.ts`.
**Action:** When working on analytics or statistics routes where database-level aggregation cannot be fully utilized, strictly replace `include: { relation: true }` with a targeted `select` block. Fetch only the specific fields required (e.g., `id`, `status`, `amount`, `monthlyRent`) to drastically reduce database transfer payload size and Node.js memory bloat.

## 2024-07-09 - Cloudflare Pages CI Failure with explicit Node.js Runtime Directives
**Learning:** Adding explicit `export const runtime = 'nodejs'` directives to Next.js API routes or layouts causes Cloudflare Pages (`next-on-pages`) CI builds to unconditionally fail with errors related to the Edge runtime missing.
**Action:** Never arbitrarily add `export const runtime` directives to Next.js files if they do not already have them. The `next-on-pages` build pipeline relies on implicit detection, and explicitly forcing 'nodejs' breaks compatibility with Cloudflare Workers' build system.

## 2024-07-09 - Package Manager Lockfile Pollution in Cloudflare Pages CI
**Learning:** If a project relies on `pnpm` (indicated by `pnpm-lock.yaml`) but an accidental `package-lock.json` is generated or checked into the repository, Cloudflare Pages (`next-on-pages` CI) will mistakenly default to `npm` for dependency resolution, causing fatal build errors (`npm error ERESOLVE unable to resolve dependency tree`).
**Action:** Always maintain strict package manager hygiene. If a `package-lock.json` file is accidentally created in a `pnpm` repository, delete it using `rm package-lock.json` before committing to prevent conflicting dependency resolutions in the CI pipeline.
