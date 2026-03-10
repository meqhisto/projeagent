## 2024-03-10 - Avoid `findMany` for Aggregates in Node.js Memory
**Learning:** Loading large sets of rows into memory with Prisma's `findMany` just to perform array methods (`.length`, `.reduce`, `.filter`) for KPIs causes a Node.js memory bottleneck and slows down response times.
**Action:** Always use Prisma's native `.count()` and `.aggregate()` methods with `Promise.all` instead of `.findMany()` when calculating totals, sums, averages, or counts. Let the PostgreSQL database perform the processing.
