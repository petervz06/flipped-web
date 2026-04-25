# Deploy the Flipped website to useflipped.com

One-time setup.  After this, every push to `main` that touches `/web/`
auto-deploys to useflipped.com via GitHub Actions.

---

## 1. Push this branch + merge

The GitHub Actions workflow at `.github/workflows/deploy-web.yml` builds
and deploys `/web/` on every push to `main`.  It won't run until the
workflow is on `main`, so:

```bash
git push
# ...then merge PR #1 to main via GitHub.
```

---

## 2. Enable GitHub Pages in the repo settings

1. Go to `https://github.com/<your-username>/flipped-mac/settings/pages`
2. **Source**: "GitHub Actions" (NOT "Deploy from a branch")
3. **Custom domain**: `useflipped.com` — save it.  GitHub will probably
   tell you "DNS check failed" here; that's expected until step 3.
4. Check "Enforce HTTPS" (grey until DNS is live; come back to it).

---

## 3. Point DNS at GitHub Pages

Where you bought the domain (Cloudflare / Namecheap / etc.), add these records:

### If you want `useflipped.com` (apex/naked) to work:

Four `A` records, all pointing to GitHub Pages' IPs:

```
Type  Host  Value
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

### If you want `www.useflipped.com` to work too:

```
Type   Host  Value
CNAME  www   <your-username>.github.io
```

**Note:** DNS propagation takes 5–60 min.  While you wait, you can verify
with:

```bash
dig useflipped.com +short
# Should return the four GitHub IPs above.
```

---

## 4. Re-enable HTTPS in GitHub Pages settings

Once DNS resolves, go back to `Settings → Pages` and tick "Enforce HTTPS."
GitHub automatically provisions a free Let's Encrypt cert.

---

## 5. Test

Open `https://useflipped.com` in a private-browsing window.  You should
see the Win95-chrome landing page.

Go to `https://useflipped.com/privacy` — privacy policy renders.

Go to `https://useflipped.com/downloads/Flipped-latest.dmg` — 404 until
you run `./scripts/build-dmg.sh` and upload the built `.dmg` to the
`/downloads/` folder on the repo's `main` branch.

---

## Updating the DMG link

For each release:

```bash
./scripts/build-dmg.sh
# Produces build/Flipped-1.0.0.dmg

cp build/Flipped-1.0.0.dmg web/downloads/Flipped-latest.dmg
cp build/Flipped-1.0.0.dmg web/downloads/Flipped-1.0.0.dmg   # versioned copy
git add web/downloads/
git commit -m "release: Flipped 1.0.0"
git push
```

GitHub Actions auto-deploys within 1–2 minutes.

---

## Note on DMG size + Git

`.dmg` files are typically 10–30 MB — fine for Git.  If you start
shipping .dmgs larger than 100 MB, move to Git LFS or a proper CDN
(Cloudflare R2, Bunny.net, etc.).
