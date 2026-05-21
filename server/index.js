const express = require('express');
const cors = require('cors');
const axios = require('axios');

const PORT = process.env.PORT || 3000;
const GRUBHUB_BASE = 'https://api-gtm.grubhub.com';

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
  'x-px-authorization':
    process.env.PX_AUTHORIZATION ||
    '2:eyJ1IjoiOGQ3NGE4OGUtNTUzOC0xMWYxLTkxYjYtMDM4OWMwNmI0YzU2IiwidiI6ImQ2M2VmOTAwLTM5MGEtMTFmMS05NGU4LWM2ZjE5NmU4YzZhYSIsInQiOjE3NzkzODQxODA4OTUsImgiOiIwNDkwOTA1Yzk4NzVhZGQwYzUwNmJmM2E2NDEwOWU4Nzc4ZWRjZmI0ODY5MGQ3Y2IzNDBiMTU1YWViODMzNjM3In0=',
};

function buildHeaders(req) {
  const headers = { ...STATIC_HEADERS };
  if (req.headers.authorization) {
    headers.Authorization = req.headers.authorization;
  }
  return headers;
}

async function forward(method, url, req, res) {
  try {
    const response = await axios({
      method,
      url: `${GRUBHUB_BASE}${url}`,
      headers: buildHeaders(req),
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

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/login', (req, res) => forward('POST', '/auth/login', req, res));

app.post('/refresh', (req, res) => forward('POST', '/auth/refresh', req, res));

app.get('/orders/:udId', (req, res) =>
  forward('GET', `/tapingo/diners/${req.params.udId}/orders`, req, res),
);

app.get('/orders/:udId/:orderId', (req, res) =>
  forward(
    'GET',
    `/tapingo/diners/${req.params.udId}/order-history/${req.params.orderId}`,
    req,
    res,
  ),
);

app.listen(PORT, () => {
  console.log(`Grubhub proxy listening on port ${PORT}`);
});
