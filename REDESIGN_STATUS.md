# Marketing Website Redesign — Build Status

> Working doc for the `redesign-2026-05` branch. Read this to resume the website work.
> Last updated: 2026-06-04.

## TL;DR

The full marketing-site redesign is **built and committed on branch `redesign-2026-05`** in
`flipped-web-work`. **Nothing is pushed; the live site (`main`) is untouched.** Remaining
before launch: wire Stripe (separate plan), final review, then merge `redesign-2026-05` → `main`
and push (Pete's call — public action).

- **Spec:** `~/Flipped/docs/superpowers/specs/2026-05-23-marketing-website-design.md`
- **Plans:** `~/Flipped/docs/superpowers/plans/2026-05-26-marketing-website-redesign.md`
  and `…/2026-05-26-stripe-checkout-integration.md`
- **Preview locally:** `cd ~/flipped-web-work && python3 -m http.server 8001` → open `http://localhost:8001/`
  (the product-walkthrough section uses CSS the headless screenshot tool can't capture, but it
  renders fine in a real browser.)

## Branch hygiene (IMPORTANT)

`flipped-web-work` default branch is `main`. The redesign lives on **`redesign-2026-05`**.
The working tree has gotten switched back to `main` at least once mid-session — if pages look
like the old beta site, run `git checkout redesign-2026-05`. The Stripe landing pages also
exist on a separate `billing-landing-pages` branch but were re-folded into `redesign-2026-05`
(restyled), so that branch is now redundant.

## What's built (branch `redesign-2026-05`)

Design system + all 9 public pages, on a single shared `styles.css`:

| Page | State |
|---|---|
| `index.html` | Full 7-section homepage (nav · hero · product walkthrough · comparison table · "everything you need to know" · pricing · footer) |
| `pricing.html` | 3-tier ($8.99/mo · $89.99/yr featured · $149.99 lifetime) + FAQ |
| `help.html`, `getting-started.html` | Restyled, copy preserved |
| `privacy.html`, `terms.html` | Restyled, legal copy verbatim |
| `press.html` | Restyled, fake press logos pruned |
| `status.html` | Branded redirect to status.useflipped.com |
| `changelog.html` | Restyled, entries verbatim |
| `billing-success.html`, `billing-cancel.html` | Post-checkout landing pages (Stripe success/cancel URLs) |

Shared system: `styles.css` (tokens, nav, buttons, cards, footer, content-page + FAQ),
`styles-homepage.css` (hero, walkthrough demo, comparison, disclosures, pricing),
`js/hero.js` (fade-up), `js/observer.js` (scroll reveal), `js/checkout.js` (pricing CTAs →
`POST /api/billing/checkout-session`), `js/demo.js` (walkthrough animation).

**Untouched (out of scope):** `flip.html` (signed-in panel), `admin.html`.

## Key decisions (so the next session doesn't re-litigate)

- **Brand:** dark + chrome wordmark + Mac-app rounded surfaces + sans/mono only (NO serif).
- **Product-walkthrough animation:** **the original abstract CSS app-grid fly-off** (tiles fade +
  lift + scale away when the Mac FLIP is pressed, synced via `js/demo.js`). We tried and
  REVERTED three fancier directions Pete rejected: (1) a real iPhone screen-recording video,
  (2) SHIFT-style 3D floating-phone depth, (3) an accurate iPhone-17-Pro mockup with vanish
  variants. All recoverable from git (`120ed9f` video, `85201f3` depth). **Keep the simple
  original "for now" — do not rebuild the realistic phone unless Pete asks.**
- **Mac UI in the demo** = matches the real app's Home tab (`HomeView.swift` mega-tile). Kept.
- **Download buttons gate to pricing** (`f9c0e38`): every `▼ DOWNLOAD` → pricing, not the DMG.
  Real DMG download lives only on `billing-success.html` (post-payment). Confirm with Pete if he
  wants a relabel ("GET FLIPPED").
- **Mobile:** Mac UI shrinks to fit <540px; demo stacks vertically.

## Stripe — TEST MODE ✅ DONE + VERIFIED (2026-06-05 late night)

**Pricing: $8.99/mo · $89.99/yr · $149.99 lifetime** (site matched). The whole integration is built, deployed, and end-to-end verified in Stripe **test (sandbox)** mode:
- ✅ Backend code **shipped to prod** — `flipped-backend` repo, branch `prod` at **`672f72f`** (pushed + deployed; `/version` confirms). config.py 3 named price IDs + billing.py `plan` param / `_price_id_for_plan` / subscription-vs-payment + 14-day trial. NOTE: this is the **backend deploy repo** (`~/Flipped/backend`, separate from the Mac repo) — the earlier worktree commits in the Mac repo do NOT deploy; the live code is the `672f72f` commit here.
- ✅ 3 Products in Stripe sandbox; webhook → `…/api/billing/webhook` (5 events, Snapshot payload); 7 test env vars set on the Railway **web** service.
- ✅ **Verified live:** all 3 plans return real `cs_test_` checkout pages; completed a test purchase (card 4242) → webhook fired → `subscription_status: trialing` on Pete's account. (Pete's test account now has a throwaway test "trialing" sub — harmless test data.)
- ⚠️ **Tiny follow-up (non-blocking):** webhook caches `subscription_current_period_end` from `data_object.get("current_period_end")`, but Stripe API `2026-05-27.dahlia` moved that off the subscription top-level (now per-item). So period_end stays null; `subscription_status` is correct + Stripe is source of truth. Fix later: read period_end from the subscription item / invoice.
- ⚠️ Customer-portal endpoint (`/api/billing/portal-session`) not yet smoke-tested (same wiring; deferred).
- Security: Pete's `sk_test_` was shown in a screenshot — fine (test), can "Roll key" anytime. Never screenshot the LIVE key.

## What's LEFT (Pete resumes — launch sequence, IN ORDER)

1. **Stripe LIVE mode** (do NOT push the site before this — else real visitors hit test checkout and "buy" for free):
   - Pete: complete Stripe **account activation** ("Managed Payments: Needs info" → business + bank details).
   - Recreate the 3 Products + the webhook in **LIVE** mode (different IDs); grab the live `sk_live_…`, live price IDs, live `whsec_…`.
   - Swap the 7 Railway env vars to the **live** values (same names).
   - Smoke: one real $1-ish purchase via a 99%-off promo code (plan `2026-05-26-stripe-checkout-integration.md` Phase 5), then refund + delete the promo.
2. **Push the redesigned site** — merge `redesign-2026-05` → `main`, push (GitHub Pages ~30s). Brings the new site + working pricing buttons + `billing-success`/`cancel` pages live. **Pete's OK** (public). Then delete the redundant `billing-landing-pages` branch.
3. **(optional) Final review** + the period_end webhook tweak above.

## Commits on `redesign-2026-05` (newest first)

```
5983a75 revert: back to original CSS animation (drop video + 3D depth)
85201f3 SHIFT-style depth + HQ clip   (reverted)
120ed9f real iPhone screen recording  (reverted)
73367e3 rebuild demo Mac UI to match the real Flipped app
f9c0e38 route all DOWNLOAD CTAs to pricing (paywall gate)
a775f56 restyle billing landing pages to new design system
8c33b7d gitignore .claude/
52a5416 rewrite pricing + restyle 7 content pages
7705bc2 JS-driven product walkthrough animation
eeaa4bf homepage rewrite — 7 sections + JS
e62fe7f new shared design system in styles.css
```
