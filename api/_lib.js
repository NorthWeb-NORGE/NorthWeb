// Shared helpers for the contact API. Files prefixed with "_" are not routes on Vercel.
const crypto = require('crypto');

const CODE_TTL_MS = 10 * 60 * 1000; // a code is valid for 10 minutes
const MAX_ATTEMPTS = 5;             // wrong guesses allowed per code

function env(name, fallback) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

const isDev = () => !env('RESEND_API_KEY') && env('NODE_ENV') !== 'production';

function secret() {
  const s = env('CODE_SECRET');
  if (s) return s;
  if (isDev()) return 'dev-only-secret-do-not-use-in-production';
  throw new Error('CODE_SECRET is not set');
}

// ---------- HTTP helpers (work on Vercel and in server.js) ----------
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 20000) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (fwd ? String(fwd).split(',')[0] : req.socket && req.socket.remoteAddress) || 'unknown';
}

// ---------- Validation ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const normEmail = (e) => String(e || '').trim().toLowerCase();
const isEmail = (e) => e.length <= 254 && EMAIL_RE.test(e);
const clean = (s, max) => String(s || '').replace(/\r/g, '').trim().slice(0, max);
const oneLine = (s, max) => clean(s, max).replace(/\s+/g, ' ');

// ---------- Rate limiting (in memory, per running instance) ----------
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return true; }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  return false;
}

// ---------- Stateless verification token ----------
// token = base64url(payload) + "." + HMAC(secret, payload + "|" + code)
// The code itself is never in the token, so the token alone can't be used to finish verification.
const b64 = (s) => Buffer.from(s).toString('base64url');
const sign = (payload, code) => crypto.createHmac('sha256', secret()).update(payload + '|' + code).digest('base64url');

function createChallenge(email) {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  const payload = b64(JSON.stringify({ e: email, x: Date.now() + CODE_TTL_MS, n: crypto.randomBytes(9).toString('base64url') }));
  return { code, token: payload + '.' + sign(payload, code) };
}

const attempts = new Map();
function checkChallenge(token, code, email) {
  const [payload, mac] = String(token || '').split('.');
  if (!payload || !mac) return 'invalid';
  let data;
  try { data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return 'invalid'; }
  if (!data || data.e !== email) return 'invalid';
  if (Date.now() > data.x) return 'expired';
  const tries = (attempts.get(data.n) || 0) + 1;
  attempts.set(data.n, tries);
  if (attempts.size > 10000) attempts.clear();
  if (tries > MAX_ATTEMPTS) return 'locked';
  const expected = Buffer.from(sign(payload, String(code || '').replace(/\D/g, '')));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return 'wrong';
  attempts.set(data.n, Infinity); // single use
  return 'ok';
}

// ---------- Email ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sendMail({ to, subject, text, html, replyTo }) {
  if (isDev()) {
    console.log('\n──── [DEV] E-post ble IKKE sendt (RESEND_API_KEY mangler) ────');
    console.log('Til:    ', to);
    console.log('Emne:   ', subject);
    if (replyTo) console.log('Svar til:', replyTo);
    console.log(text);
    console.log('──────────────────────────────────────────────────────────────\n');
    return;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env('MAIL_FROM', 'NorthWeb <noreply@northweb.no>'),
      to: [to], subject, text, html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()));
}

module.exports = {
  env, readJson, send, clientIp, normEmail, isEmail, clean, oneLine,
  limited, createChallenge, checkChallenge, sendMail, esc, CODE_TTL_MS,
};
