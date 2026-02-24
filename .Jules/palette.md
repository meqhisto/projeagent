## 2026-02-08 - Accessibility for Icon-Only Buttons
**Learning:** Icon-only buttons must include `aria-label` and `title` attributes for accessibility.
**Action:** Always verify `aria-label` and `title` on icon buttons in code reviews.
## 2026-02-08 - CI Build Fix
**Learning:** CI pipelines for Next.js + Prisma require explicit `prisma generate` in the build script.
**Action:** Update `package.json` build script to `prisma generate && next build`.
## 2026-02-08 - pnpm Build Whitelist
**Learning:** Projects using pnpm require explicit `pnpm.onlyBuiltDependencies` whitelist in `package.json` for postinstall scripts to run.
**Action:** Add `pnpm: { onlyBuiltDependencies: [...] }` to `package.json` including `@prisma/client` and others.
