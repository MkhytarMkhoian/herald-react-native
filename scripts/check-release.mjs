// Refuses to publish unless every package has the tag's version and the change log has a dated
// entry for it. The Publish workflow runs it with the version from the tag.
import { readFileSync, readdirSync } from 'node:fs';

const version = process.argv[2];
const problems = [];

for (const name of readdirSync('packages')) {
  const json = JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8'));
  if (json.version !== version) problems.push(`${json.name} is ${json.version}, not ${version}.`);
}

const changelog = readFileSync('CHANGELOG.md', 'utf8');
const entry = changelog.split(`## Version ${version}\n`)[1];
if (entry === undefined) {
  problems.push(`CHANGELOG.md has no "## Version ${version}".`);
} else if (!/^\s*_\d{4}-\d{2}-\d{2}_/.test(entry)) {
  problems.push(`CHANGELOG.md's entry for ${version} has no release date.`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Ready to publish ${version}.`);
