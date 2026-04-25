# Flipped — marketing site

Plain static HTML/CSS.  Two pages (`privacy.html`, `terms.html`) provide
the URLs required by App Store Connect.  One landing page (`index.html`)
covers features, how-it-works, download, pricing, FAQ.

## Deploy — cheapest path

**Option A: GitHub Pages (free)**
1. Create a new GitHub repo `flipped-site` (or whatever).
2. Copy the contents of this folder to the repo root.
3. Settings → Pages → Deploy from branch → `main` → `/` → Save.
4. Add custom domain `useflipped.com` in Pages settings + update your DNS:
   - A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - CNAME for `www.useflipped.com` pointing to `<your-gh-user>.github.io`
5. Wait for HTTPS to provision (~15 min).

**Option B: Vercel (free, faster CI)**
1. `cd` into this folder, `npm i -g vercel`, `vercel --prod`.
2. Add custom domain in the Vercel dashboard.

**Option C: Netlify (also free)**
1. Drag-drop the `web/` folder onto https://app.netlify.com/drop.
2. Done.

All three give you free HTTPS.  The URLs Apple requires:
- `https://useflipped.com/privacy`
- `https://useflipped.com/terms`
- `https://useflipped.com/support` — add this later; for now point to a
  Notion doc or mailto link.

## Things you need to replace before going live

Grep the repo for these placeholders and fill them in:

- `privacy@useflipped.com`, `support@useflipped.com` — real addresses you control
- `useflipped.com` domain references — update if using a different domain
- `[STATE TBD before launch]` in `terms.html` — governing-law state
- `/downloads/Flipped-latest.dmg` — actual download URL once you publish
- `https://apps.apple.com/us/app/flipped-companion/` — real URL after approval
- GitHub links to `petervz06/flipped-mac/releases` — check these are public

## Host the Mac `.dmg`

GitHub Releases is the easiest:
1. Build the Mac app, sign, notarize (see separate signing doc).
2. `gh release create v1.0.0 Flipped.dmg --title "Flipped 1.0" --notes "…"`.
3. Update `<a href="/downloads/Flipped-latest.dmg">` to point at the
   github.com/petervz06/flipped-mac/releases/download/v1.0.0/Flipped.dmg
   URL.

Alternative: put the DMG on S3 / Cloudflare R2 behind a CDN for download
speed.
