/**
 * Meridian WhatsApp link service.
 *
 * Each CRM user can link their own WhatsApp account by scanning a QR code
 * (WhatsApp → Settings → Linked devices), exactly like WhatsApp Web. After
 * that the CRM can send text messages from that number.
 *
 * - Listens on 127.0.0.1 only and requires a shared secret, so only the
 *   Meridian API (running on the same machine) can use it. The browser never
 *   talks to this service directly.
 * - Session credentials are stored in ./sessions/<user id>/ — treat that
 *   folder like passwords (it is git-ignored).
 * - Uses WhatsApp Web linking (Baileys), which is not an official WhatsApp
 *   API: keep volumes low and only message people who expect it.
 */
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOST = '127.0.0.1';
const PORT = Number(process.env.WHATSAPP_SERVICE_PORT || 5090);
const SESSIONS_DIR = path.join(HERE, 'sessions');
const SECRET_FILE = path.join(HERE, '.service-secret');
const MAX_TEXT = 4000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || 'warn' });

// Shared secret with the API: from the environment, else generated once into a git-ignored file.
const SECRET = process.env.WHATSAPP_SERVICE_SECRET || (() => {
  if (existsSync(SECRET_FILE)) return readFileSync(SECRET_FILE, 'utf8').trim();
  const s = randomBytes(32).toString('hex');
  writeFileSync(SECRET_FILE, s, { mode: 0o600 });
  return s;
})();

mkdirSync(SESSIONS_DIR, { recursive: true });

/** userId -> { sock, state, qr, me, error, starting, attempts } */
const sessions = new Map();
let waVersion;

function sessionDir(userId) {
  return path.join(SESSIONS_DIR, userId);
}

function publicStatus(userId) {
  const s = sessions.get(userId);
  if (!s) return { state: existsSync(path.join(sessionDir(userId), 'creds.json')) ? 'connecting' : 'disconnected' };
  return {
    state: s.state,
    qr: s.state === 'qr' ? s.qr : undefined,
    phone: s.me?.phone,
    name: s.me?.name,
    error: s.error || undefined,
  };
}

async function start(userId) {
  let s = sessions.get(userId);
  if (s?.sock && ['qr', 'connecting', 'connected'].includes(s.state)) return s;
  if (!s) {
    s = { state: 'connecting', attempts: 0 };
    sessions.set(userId, s);
  }
  s.state = 'connecting';
  s.error = undefined;

  waVersion ??= (await fetchLatestBaileysVersion().catch(() => ({ version: undefined }))).version;
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir(userId));
  const sock = makeWASocket({
    auth: state,
    version: waVersion,
    browser: Browsers.ubuntu('Meridian CRM'),
    logger,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false,
  });
  s.sock = sock;
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (u) => {
    if (sessions.get(userId)?.sock !== sock) return; // a newer socket replaced this one
    if (u.qr) {
      s.state = 'qr';
      s.qr = await QRCode.toDataURL(u.qr, { margin: 1, width: 280 });
    }
    if (u.connection === 'open') {
      s.state = 'connected';
      s.qr = undefined;
      s.attempts = 0;
      const id = String(sock.user?.id || '');
      s.me = { phone: `+${id.split(':')[0].split('@')[0]}`, name: sock.user?.name || sock.user?.verifiedName || '' };
    }
    if (u.connection === 'close') {
      const code = u.lastDisconnect?.error?.output?.statusCode;
      const linked = !!state.creds?.registered || !!state.creds?.me;
      s.sock = undefined;
      if (code === DisconnectReason.loggedOut || code === DisconnectReason.forbidden) {
        // Unlinked from the phone (or banned): forget the session.
        rmSync(sessionDir(userId), { recursive: true, force: true });
        sessions.set(userId, { state: 'disconnected', attempts: 0, error: code === DisconnectReason.forbidden ? 'WhatsApp refused this session.' : undefined });
        return;
      }
      if (!linked && code === DisconnectReason.timedOut) {
        // Nobody scanned the QR in time.
        s.state = 'disconnected';
        s.error = 'The QR code expired. Try again.';
        return;
      }
      // Normal after pairing (restart required) or a dropped connection: reconnect with backoff.
      s.attempts += 1;
      if (s.attempts > 6) {
        s.state = 'disconnected';
        s.error = 'Lost the connection to WhatsApp. Link again.';
        return;
      }
      s.state = 'connecting';
      setTimeout(() => start(userId).catch(err => logger.error({ err }, 'reconnect failed')), Math.min(2000 * s.attempts, 15000));
    }
  });
  return s;
}

/** Waits briefly for the first QR or connection so the API can answer with something useful. */
async function startAndWait(userId, ms = 8000) {
  const s = await start(userId);
  const until = Date.now() + ms;
  while (Date.now() < until && s.state === 'connecting') await new Promise(r => setTimeout(r, 250));
  return publicStatus(userId);
}

async function logout(userId) {
  const s = sessions.get(userId);
  try { await s?.sock?.logout(); } catch { /* already gone */ }
  try { s?.sock?.end?.(undefined); } catch { /* ignore */ }
  sessions.delete(userId);
  rmSync(sessionDir(userId), { recursive: true, force: true });
}

const digitsOf = (phone) => String(phone || '').replace(/\D/g, '');

async function lookup(userId, phone) {
  const s = sessions.get(userId);
  if (s?.state !== 'connected' || !s.sock) return { error: 'not_connected' };
  const digits = digitsOf(phone);
  if (digits.length < 8 || digits.length > 15) return { error: 'invalid_phone' };
  const [result] = await s.sock.onWhatsApp(`${digits}@s.whatsapp.net`);
  return { exists: !!result?.exists, jid: result?.jid };
}

async function send(userId, phone, text) {
  const found = await lookup(userId, phone);
  if (found.error) return found;
  if (!found.exists) return { error: 'not_on_whatsapp' };
  const sent = await sessions.get(userId).sock.sendMessage(found.jid, { text });
  return { id: sent?.key?.id };
}

// ---- HTTP -------------------------------------------------------------------

function reply(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 64 * 1024) { reject(Object.assign(new Error('too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(Object.assign(new Error('bad json'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}`);
    if (url.pathname === '/health') return reply(res, 200, { ok: true });
    if (req.headers['x-service-secret'] !== SECRET) return reply(res, 401, { error: 'unauthorized' });

    const m = /^\/sessions\/([^/]+)(?:\/(connect|logout|check|send))?$/.exec(url.pathname);
    if (!m || !UUID.test(m[1])) return reply(res, 404, { error: 'not_found' });
    const [, userId, action] = m;

    if (req.method === 'GET' && !action) return reply(res, 200, publicStatus(userId));
    if (req.method !== 'POST') return reply(res, 405, { error: 'method_not_allowed' });

    if (action === 'connect') return reply(res, 200, await startAndWait(userId));
    if (action === 'logout') { await logout(userId); return reply(res, 200, publicStatus(userId)); }

    const body = await readJson(req);
    if (action === 'check') {
      const r = await lookup(userId, body.phone);
      return reply(res, r.error ? 409 : 200, r);
    }
    if (action === 'send') {
      const text = String(body.text || '').trim();
      if (!text || text.length > MAX_TEXT) return reply(res, 400, { error: 'invalid_text' });
      const r = await send(userId, body.phone, text);
      return reply(res, r.error ? (r.error === 'not_on_whatsapp' ? 404 : 409) : 200, r);
    }
    return reply(res, 404, { error: 'not_found' });
  } catch (err) {
    logger.error({ err }, 'request failed');
    return reply(res, err.status || 500, { error: 'failed' });
  }
});

// Reconnect users who linked before the service restarted.
for (const entry of readdirSync(SESSIONS_DIR, { withFileTypes: true })) {
  if (entry.isDirectory() && UUID.test(entry.name) && existsSync(path.join(SESSIONS_DIR, entry.name, 'creds.json'))) {
    start(entry.name).catch(err => logger.error({ err }, 'restore failed'));
  }
}

server.listen(PORT, HOST, () => {
  console.log(`[whatsapp] Listening on http://${HOST}:${PORT} (local only)`);
});
