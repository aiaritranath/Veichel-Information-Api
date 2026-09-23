# FireAPI RC Proxy

Private proxy for FireAPI RC Vehicle Info.
Hides the real API key from the browser.

## Deploy

1. Push this folder to a GitHub repo.
2. Import the repo at https://vercel.com/new
3. Add environment variable FIREAPI_KEY in Vercel.
   Optionally add PROXY_SECRET.
4. Deploy.

## Usage

GET https://YOUR-PROJECT.vercel.app/api/rc?vehicle_no=WB26D2797

With secret:
GET https://YOUR-PROJECT.vercel.app/api/rc?vehicle_no=WB26D2797&key=YOUR_SECRET