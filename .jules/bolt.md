## 2024-05-24 - [List View Optimizations]
**Learning:** Found an N+1 fetching problem where full relationship models were being loaded (e.g. ratings, matches) just to count lengths or calculate averages.
**Action:** Use Prisma's `_count` feature and targeted `select` statements to fetch only needed aggregate data.
