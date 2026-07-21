# Wave Group Website

Static site for wavegroup.capital — deploys directly on Vercel, no build step required.

## Structure
- 13 HTML pages, one shared `styles.css`
- `assets/` — logo and the budget tracker product mockup
- `api/contact.js` — Vercel serverless function, sends the contact form via Resend

## Deploy
1. Push this repo to GitHub
2. Import it in Vercel (Vercel auto-detects static sites, no config needed)
3. In the Vercel project settings, add environment variable `RESEND_API_KEY`
4. Once wavegroup.capital is verified as a sending domain in Resend, update `FROM_ADDRESS` in `api/contact.js`

## Editing
Every page is a self-contained HTML file linking to the shared `styles.css`. Edit directly, commit, push — Vercel redeploys automatically on push to main.
