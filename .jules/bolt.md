## 2024-03-07 - [Database Performance] Use database aggregations instead of in-memory JS processing
**Learning:** The application was fetching all database records into memory (e.g., using `findMany` on Parcels) just to calculate KPI metrics like counts, sums, and date filtering in JavaScript. This causes massive memory spikes, slows down the event loop, and introduces N+1-like overfetching bottlenecks as data grows.
**Action:** Use Prisma's native `.count()` and `.aggregate()` with `Promise.all()` to push data processing to the database layer, returning only the scalar values needed.
