// Runs every design side by side, plus the showcase page that links to them.
//   npm run dev  ->  showcase on http://localhost:4320, designs on the ports in showcase/designs.json
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const designs = JSON.parse(readFileSync(join(root, 'showcase/designs.json'), 'utf8'));
const children = [];

for (const d of designs) {
  const child = spawn('npx', ['astro', 'dev', '--port', String(d.port)], {
    cwd: join(root, 'designs', d.slug),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefix = `[${d.slug}] `;
  const pipe = (s) => s.on('data', (b) => process.stdout.write(b.toString().replace(/^(?=.)/gm, prefix)));
  pipe(child.stdout);
  pipe(child.stderr);
  children.push(child);
}

const types = { '.html': 'text/html', '.json': 'application/json' };
createServer((req, res) => {
  const file = req.url === '/' ? 'index.html' : req.url.slice(1).split('?')[0];
  if (!(file in { 'index.html': 1, 'designs.json': 1 })) return res.writeHead(404).end('Not found');
  res.writeHead(200, { 'Content-Type': types[file.slice(file.lastIndexOf('.'))] });
  res.end(readFileSync(join(root, 'showcase', file)));
}).listen(4320, () => {
  console.log('\nShowcase:  http://localhost:4320');
  for (const d of designs) console.log(`${d.name.padEnd(10)} http://localhost:${d.port}`);
  console.log('');
});

const stop = () => { children.forEach((c) => c.kill()); process.exit(); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
