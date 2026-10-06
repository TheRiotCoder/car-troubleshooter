# CarCare – car troubleshooting & service log (PWA)
Static, no build step. Serve this folder over HTTPS (or localhost) with any static host.
- Local: `python3 -m http.server 8099` then open http://localhost:8099
- Host free: drag this folder onto https://app.netlify.com/drop, or push to GitHub Pages / Cloudflare Pages / Vercel.
Data (garage, service log, receipt photos) is stored on-device in IndexedDB/localStorage. NHTSA data needs internet the first time and is cached afterwards.
