import { build } from 'esbuild';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('bin', { recursive: true });

await build({
  entryPoints: ['src/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: 'bin/analytics-cli.cjs',
  external: [
    '@google-analytics/data',
    '@google-analytics/admin',
    'open',
  ],
});

// Thin ESM wrapper with shebang that calls into the CJS bundle
writeFileSync('bin/analytics-cli', `#!/usr/bin/env node
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('./analytics-cli.cjs');
`);

chmodSync('bin/analytics-cli', 0o755);
console.log('Built bin/analytics-cli');
