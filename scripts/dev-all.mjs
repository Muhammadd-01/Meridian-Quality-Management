/**
 * Starts the API (ASP.NET Core, http://localhost:5080), the WhatsApp link
 * service (127.0.0.1:5090) and the web app (Vite) together — this is what
 * `npm run dev` runs. Ctrl+C stops them all.
 *
 * - If the API is already running (e.g. in another terminal), it is reused.
 * - If the API stops, the website keeps running and a clear message is printed;
 *   the site then shows "service isn't available" until the API is back.
 */
import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const API_HEALTH = 'http://localhost:5080/health';
const procs = [];

function start(name, command, args, { critical }) {
  // On Windows `dotnet` / `npx` resolve through the shell; the arguments are fixed strings.
  const child = isWindows
    ? spawn([command, ...args].join(' '), { stdio: ['ignore', 'pipe', 'pipe'], shell: true })
    : spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = `[${name}] `;
  const pipe = (stream, out) => stream.on('data', (chunk) => {
    String(chunk).split(/\r?\n/).filter(Boolean).forEach((line) => out.write(prefix + line + '\n'));
  });
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    if (stopping) return;
    if (critical) {
      console.log(`${prefix}stopped (code ${code}).`);
      stopAll();
    } else {
      const effect = name === 'api'
        ? 'The website will show "service isn\'t available"'
        : 'Sending on WhatsApp is unavailable';
      console.log(`\n${prefix}${name === 'api' ? 'The API' : 'The WhatsApp service'} stopped (code ${code}). ${effect} until it runs again.`);
      console.log(`${prefix}Start it with:  npm run dev:${name}\n`);
    }
  });
  procs.push(child);
}

let stopping = false;
function stopAll() {
  if (stopping) return;
  stopping = true;
  procs.forEach((p) => {
    if (p.exitCode !== null) return;
    if (isWindows) spawn('taskkill', ['/pid', String(p.pid), '/t', '/f'], { stdio: 'ignore' });
    else p.kill('SIGINT');
  });
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

async function isUp(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

async function apiAlreadyRunning() {
  try {
    const res = await fetch(API_HEALTH, { signal: AbortSignal.timeout(1500) });
    return res.status === 200 || res.status === 503; // 503 = up, but Supabase unreachable
  } catch {
    return false;
  }
}

if (await apiAlreadyRunning()) {
  console.log('[api] Already running on http://localhost:5080, reusing it.');
} else {
  start('api', 'dotnet', ['run', '--project', 'backend/Meridian.Api', '--launch-profile', 'http'], { critical: false });
}
// WhatsApp link service (QR linking in Settings); installs its packages the first time.
if (await isUp('http://127.0.0.1:5090/health')) {
  console.log('[whatsapp] Already running on port 5090, reusing it.');
} else {
  const { existsSync } = await import('node:fs');
  const install = existsSync('whatsapp-service/node_modules') ? '' : 'npm install --prefix whatsapp-service --no-audit --no-fund && ';
  start('whatsapp', isWindows ? `${install}node whatsapp-service/server.mjs` : 'sh', isWindows ? [] : ['-c', `${install}node whatsapp-service/server.mjs`], { critical: false });
}
start('web', 'npx', ['vite', ...process.argv.slice(2)], { critical: true });
