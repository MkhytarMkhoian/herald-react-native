// Sets one version on every package, and on the ranges between them, so they release together.
//
//   npm run set-version -- 1.0.0-beta.1
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version ?? '')) {
  console.error('Usage: npm run set-version -- X.Y.Z');
  process.exit(1);
}

const packages = readdirSync('packages').map((name) => `packages/${name}/package.json`);
for (const file of [...packages, 'example/package.json']) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  if (file.startsWith('packages/')) json.version = version;
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    for (const name of Object.keys(json[field] ?? {})) {
      if (name.startsWith('@herald-analytics/')) json[field][name] = `^${version}`;
    }
  }
  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}
console.log(`Every package is ${version}. Run npm install to update package-lock.json.`);
