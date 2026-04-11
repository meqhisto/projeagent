## 2023-10-27 - [Prisma WhereInput Type Safety]
**Learning:** When dynamically building Prisma `where` clauses, avoid using `any` or loose types like `Record<string, unknown>`. Prisma generates strict, exact types for inputs (e.g. `Prisma.ContractorWhereInput`). Using a generic string index signature causes compilation errors since it's not assignable to exact object types.
**Action:** Always import the generated `Prisma` namespace (`import { Prisma } from "@prisma/client"`) and type dynamic query objects strongly (e.g. `const baseWhere: Prisma.ContractorWhereInput = {}`) to maintain type safety and avoid build failures.

## 2023-10-27 - [Cloudflare Workers Runtime Configuration]
**Learning:** NEVER add `export const runtime = 'nodejs'` or `export const runtime = 'edge'` to Next.js API routes that do not already have it, as doing so will cause Cloudflare Pages (next-on-pages) CI builds to fail if the route uses modules incompatible with the Edge runtime or breaks existing nodejs builds.
**Action:** When modifying or completely rewriting a route, ONLY preserve the directive if it was explicitly defined in the original file.
