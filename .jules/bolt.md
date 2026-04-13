## 2023-10-27 - [Prisma Nested Relations Array Resolution]
**Learning:** Returning nested object arrays in Prisma (like `include: { matches: { include: { parcel: true, customer: true } } }`) just to measure `.length` on the frontend results in an enormous payload and severe N+1 memory issues.
**Action:** Always replace the heavy nested objects with Prisma's `_count` aggregation (`_count: { select: { matches: true } }`) when the frontend only consumes the array length, and update frontend interfaces to refer to `_count.matches`.
