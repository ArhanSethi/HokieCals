# HokieCals Handoff

## What this is
React Native Expo app for VT students to track calories. Located at C:\Users\arhan\HokieCals.

## Current status
All screens built and working: Home, Calendar, Grubhub, Settings, Pending Queue.
Real Grubhub API integration is built but blocked by PerimeterX (463 error) on direct calls from the app.

## The fix needed
Build a small Express proxy server in /server folder and deploy to Railway.
The server sits between the app and Grubhub, handling the px token and auth headers.

## Grubhub API (reverse engineered)
Base URL: https://api-gtm.grubhub.com

Login: POST /auth/login
Orders list: GET /tapingo/diners/{ud_id}/orders  
Order detail: GET /tapingo/diners/{ud_id}/order-history/{order_id}
Refresh: POST /auth/refresh

Working px token (grab fresh one from mitmproxy if this expires):
x-px-authorization: 2:eyJ1IjoiOGQ3NGE4OGUtNTUzOC0xMWYxLTkxYjYtMDM4OWMwNmI0YzU2IiwidiI6ImQ2M2VmOTAwLTM5MGEtMTFmMS05NGU4LWM2ZjE5NmU4YzZhYSIsInQiOjE3NzkzODQxODA4OTUsImgiOiIwNDkwOTA1Yzk4NzVhZGQwYzUwNmJmM2E2NDEwOWU4Nzc4ZWRjZmI0ODY5MGQ3Y2IzNDBiMTU1YWViODMzNjM3In0=

Static headers needed for all requests:
user-agent: GrubHub/2026.19 (iPhone; iOS 26.4.1; Scale/3.00)
x-gh-browser-id: 8E2C438E-6A6E-4587-8C69-20CC8BB30D7F
x-px-device-model: iPhone16,1
x-px-mobile-sdk-version: 3.1.5
x-gh-features: 0=phone;1=Grubhub 2026.19.0;2=iOS 26.4.1;60=24061
x-px-os: iOS
x-gh-cs-id: 2C266A98-281D-4934-9317-9D17CFC93BDA

Login body:
{
  email, password,
  client_id: 'ghiphone_Vkuxbs6t0f4SZjTOW42Y52z1itJ7Li0Tw3FEcboT',
  brand: 'GRUBHUB',
  device_id: '609EC148-2425-4840-ADF1-C27697504EE0',
  scope: 'diner',
  exclusive_session: false
}

## My account (for testing)
ud_id: c80c21a0-4293-11f1-9930-c5c0eaad83a3

## Next task
Build /server/index.js as an Express proxy with these endpoints:
POST /login -> forwards to Grubhub auth/login with above headers
GET /orders/:udId -> forwards to tapingo/diners/:udId/orders
GET /orders/:udId/:orderId -> forwards to tapingo/diners/:udId/order-history/:orderId
POST /refresh -> forwards to auth/refresh

Add CORS. Use axios. Add Procfile for Railway.
Then update services/grubhubApi.ts to point to the Railway URL instead of api-gtm.grubhub.com directly.