const express = require('express');
const cors = require('cors');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
const GRUBHUB_BASE = 'https://api-gtm.grubhub.com';

// Per-user Grubhub sessions captured from the WebView login flow.
// Keyed by userId -> { cookies: Record<string, string>, createdAt: number }.
// In-memory only: a Railway restart drops every session, and the app simply
// falls back to the login screen. That tradeoff is acceptable for now.
const sessions = new Map();

const STATIC_HEADERS = {
  'Content-Type': 'application/json',
  accept: '*/*',
  'accept-language': 'en-US;q=1',
  'accept-encoding': 'gzip',
  'user-agent': 'GrubHub/2026.19 (iPhone; iOS 26.4.1; Scale/3.00)',
  'x-gh-browser-id': '8E2C438E-6A6E-4587-8C69-20CC8BB30D7F',
  'x-px-device-model': 'iPhone16,1',
  'x-px-mobile-sdk-version': '3.1.5',
  'x-gh-features': '0=phone;1=Grubhub 2026.19.0;2=iOS 26.4.1;60=24061',
  'x-px-os': 'iOS',
  'x-gh-cs-id': '2C266A98-281D-4934-9317-9D17CFC93BDA',
};

function cookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function buildHeaders(req, cookies) {
  const headers = { ...STATIC_HEADERS };
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  if (cookies && Object.keys(cookies).length > 0) {
    headers.Cookie = cookieHeader(cookies);
  }
  return headers;
}

async function forward(method, url, req, res, cookies) {
  try {
    const response = await axios({
      method,
      url: `${GRUBHUB_BASE}${url}`,
      headers: buildHeaders(req, cookies),
      data: req.body,
      validateStatus: () => true,
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || 'Upstream request failed';
    res.status(err.response?.status || 502).json({ error: message });
  }
}

// Resolves the stored session for a `?userId=` query param, or writes an
// error response and returns null if it is missing/unknown.
function requireSession(req, res) {
  const { userId } = req.query;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId query param.' });
    return null;
  }
  const session = sessions.get(userId);
  if (!session) {
    res
      .status(401)
      .json({ error: 'No session for this user. Please sign in again.' });
    return null;
  }
  return session;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, sessions: sessions.size });
});

// --- WebView session registration ---

// Store the cookies captured after a user logs into Grubhub in the WebView.
app.post('/api/session', (req, res) => {
  const { userId, cookies } = req.body || {};
  if (!userId || !cookies || typeof cookies !== 'object') {
    return res.status(400).json({ error: 'userId and cookies are required.' });
  }
  sessions.set(userId, { cookies, createdAt: Date.now() });
  res.json({ ok: true });
});

// Logout: drop the user's stored session.
app.delete('/api/session/:userId', (req, res) => {
  sessions.delete(req.params.userId);
  res.json({ ok: true });
});

// --- Auth passthrough (no hardcoded px token anymore) ---

app.post('/login', (req, res) => forward('POST', '/auth/login', req, res));

app.post('/refresh', (req, res) => forward('POST', '/auth/refresh', req, res));

// --- Order history (authenticated with the user's captured cookies) ---

app.get('/orders/:udId', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  forward(
    'GET',
    `/tapingo/diners/${req.params.udId}/orders`,
    req,
    res,
    session.cookies,
  );
});

app.get('/orders/:udId/:orderId', (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  forward(
    'GET',
    `/tapingo/diners/${req.params.udId}/order-history/${req.params.orderId}`,
    req,
    res,
    session.cookies,
  );
});

app.listen(PORT, () => {
  console.log(`Grubhub proxy listening on port ${PORT}`);
});
