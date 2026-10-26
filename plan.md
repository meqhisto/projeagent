1. **Analyze `app/api/properties/stats/route.ts`**
   - The route currently uses `prisma.property.findMany` with `include: { units: true, transactions: true }` to fetch all properties and their relationships into memory.
   - It then performs in-memory aggregations, reducing and mapping over potentially large arrays (`properties`, `allUnits`, `allTransactions`).
   - This approach leads to large payload sizes and high memory usage, especially as the portfolio grows, representing a classic N+1/overfetching performance issue.

2. **Rewrite `app/api/properties/stats/route.ts` using Prisma Aggregations**
   - Refactor the code to use targeted database-level `Promise.all` queries instead of `findMany`.
   - `prisma.property.count({ where })` to get total properties.
   - `prisma.property.aggregate({ _sum: { currentValue: true, purchasePrice: true, monthlyRent: true } })` to get value, purchase price, and rent potentials.
   - `prisma.property.groupBy({ by: ['status'], _count: { _all: true } })` to calculate status counts.
   - `prisma.property.groupBy({ by: ['type'], _count: { _all: true } })` to calculate type counts.
   - `prisma.property.groupBy({ by: ['city'], _count: { _all: true } })` to calculate city distribution.
   - `prisma.unit.count()` and `prisma.unit.count({ where: { status: 'RENTED' } })` for unit stats.
   - `prisma.unit.aggregate({ _sum: { monthlyRent: true } })` for rent potentials.
   - `prisma.transaction.groupBy({ by: ['type'], _sum: { amount: true } })` for income/expenses (filtered by current year).
   - `prisma.property.aggregate({ where: { status: 'RENTED' }, _sum: { monthlyRent: true } })` for actual monthly rent calculation.
   - Keep the recent transactions query but optimize it with targeted selects if needed.
   - Ensure the JSON response perfectly matches the previous exact structure, falling back with `|| 0` on numbers and mapping database groupBy arrays into their respective object structures.

3. **Verify the Optimization**
   - Write out the new `route.ts`.
   - Ensure it returns the same API contract.
   - Delete `test_db.ts` and `get_kpis_stats.ts`.
   - Test by running `pnpm exec tsc --noEmit` on the file and `pnpm lint`.

4. **Complete Pre-Commit Steps**
   - Call `pre_commit_instructions` to ensure proper testing, verification, review, and reflection are done.

5. **Document Learnings**
   - Add an entry to `.jules/bolt.md` detailing how replacing large nested `findMany` queries with concurrent database-level aggregations prevents Next.js edge/node memory bloat and speeds up analytic route responses.

6. **Submit Pull Request**
   - Submit the PR with the title format `⚡ Bolt: [performance improvement]`.
