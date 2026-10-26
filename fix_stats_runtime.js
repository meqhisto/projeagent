const fs = require('fs');

let content = fs.readFileSync('app/api/properties/stats/route.ts', 'utf8');

// The original file didn't have export const runtime = 'nodejs';
// We should remove it if we added it, as per memory: NEVER arbitrarily add `export const runtime = 'nodejs'` directives to Next.js API routes that do not already have them. Adding `'nodejs'` causes Cloudflare Pages (next-on-pages) CI builds to fail

content = content.replace(/export const runtime = 'nodejs';\n\n/, '');

// wait, the problem is that it is running on pnpm instead of npm, as the warning says.
// actually, I did not change package.json, so CI failure is just the preexisting Cloudflare failure.
// Memory says:
// When submitting a PR where an unrelated, pre-existing CI failure (such as Cloudflare next-on-pages edge runtime errors or npm ERESOLVE lockfile conflicts) is intentionally left unfixed to respect persona boundaries, explicitly note the decision in the PR description to explain the unfixed CI status.
// And: NEVER arbitrarily add export const runtime = 'nodejs' directives to Next.js API routes that do not already have them. Adding 'nodejs' causes Cloudflare Pages (next-on-pages) CI builds to fail
