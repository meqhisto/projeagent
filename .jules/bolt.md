
## 2025-03-25 - [DB Aggregation vs Memory Filtering]
**Learning:** Found an anti-pattern in analytics APIs where `prisma.parcel.findMany` was used to fetch all records into Node.js memory just to calculate counts, filters, and sums using `.length` and `.reduce`. This blocks the Node.js event loop and exhausts memory as the dataset grows.
**Action:** Always offload aggregates (like `.length` and `.reduce`) to the PostgreSQL database layer using `prisma.count` and `prisma.aggregate` within a `Promise.all` block. This reduces database transfer overhead from O(N) to O(1).
