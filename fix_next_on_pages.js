const fs = require('fs');
const glob = require('glob');

// This specific local error is a red herring; the actual fix for the CI is to strictly remove any explicit `export const runtime = 'nodejs'` directives from all Next.js files (including API routes and global layouts like `app/layout.tsx`) rather than changing them to 'edge'.

// Verify nothing has 'nodejs'
glob('app/**/*.ts*', (err, files) => {
  files.forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    if (c.includes('export const runtime')) {
      console.log('Found runtime config in:', f);
      // Remove the runtime config
      const newC = c.replace(/export const runtime = ['"][^'"]+['"];\n?/g, '');
      fs.writeFileSync(f, newC);
    }
  });
});
