# Marketing Website — Status + "Best Website This Week" Plan

> Working doc for useflipped.com. Read this to resume website work.
> Last updated: 2026-07-02 (post copy-overhaul push).

## Current state

**Everything is LIVE on useflipped.com** (GitHub Pages from `flipped-web-work` `main`; deploy = push to main, ~30-60s). The 2026-05 redesign shipped long ago; Stripe is live; on 2026-07-02 the copy overhaul + competitive upgrades shipped (`88449e9` batch, verified in prod).

Preview locally: `python3 -m http.server 8001 --directory ~/flipped-web-work` → localhost:8001. The product-walkthrough section doesn't render in headless screenshot tools (known limitation) — verify via DOM checks + Pete's real browser. Pete's review loop: **implement → he eyeballs localhost or visuals → THEN push** (push needs his explicit OK; classifier enforces).

## Shipped 2026-07-02 (live)

- **"GOOD TO KNOW" section** (was "HONESTY"): 6 inviting cards — Works with your Mac / Decisions stay made / Set a timer, walk away / Your essentials keep working / Real life happens (15-min check-ins + 1/mo emergency unflip) / Cancel anytime. REMOVED: factory-reset card (scary AND backwards — factory reset is blocked while flipped), lost-Mac card, data-collection card. See memory `feedback_website_inviting_language.md` — this is a standing rule.
- **Statement band** after the demo: "Your phone can't talk you out of it." + committed-session line ("even your Mac holds the line until the timer runs out" — accurate: commitment modes have no manual unflip).
- **Comparison table escape-hatch labels** under column names: Screen Time "tap ignore limit" / Opal "turned off in Screen Time" / Brick "turned off in Screen Time" / Flipped "no escape hatch" (`.th-escape` in styles-homepage.css v23). Row renamed "Zero workarounds — even drastic ones".
- Meta description de-scarified; pricing footnote links pricing FAQ; "iPhone today · Android on the way" microcopy.

## Competitive research (2026-07-02) — the source of the plan

Deep teardowns of **SHIFT** (shiftyourphone.com), **Brick** (getbrick.com), **Opal** (opalapp.com). Distilled lessons: proof density in every scroll (all 3), outcome math with footnoted N (Opal "6 years reclaimed", SHIFT "8h→4h", Brick "95% less distracted, N=3,500"), objections killed within 50px of the buy button (Brick), eager-yes answers to scary questions (SHIFT), one idea per section / ~350 words per homepage (Opal), named commitment mode generates testimonials (SHIFT "REHAB"). SHIFT deltas + weaknesses recorded in memory `reference_shift_competitor.md`. SHIFT raw HTML captures live in session f3923f54's scratchpad (may be GC'd).

## THE WEEK PLAN (Pete 2026-07-02: "best website possible this week")

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | Comparison kill-shot labels | ✅ shipped | |
| 2 | **Homepage FAQ, eager-yes answers** | **DRAFTED, awaiting Pete's redline** | 6 Q&As drafted (in session transcript + below). Build with existing `details.faq` component; move `#faq` anchor from Good to Know to the new FAQ section. |
| 3 | **Social proof section** | blocked on Pete | Needs 2–3 real user quotes. Claude can pull real total-hours-flipped from backend for an honest stat. THE #1 gap vs all three competitors. |
| 4 | OG/share cards + SEO polish | todo | Site has NO og:image/og:title — links shared in iMessage/X render bare. Make a black chrome-wordmark card. Check all pages' titles/descriptions. |
| 5 | Live "time regained" counter (footer) | todo | Opal-style odometer, ours real. Needs small public backend stats endpoint (cache 1h). Backend push = Pete gate. |
| 6 | Parents + quit-porn wedge pages | todo, later in week | SHIFT's two biggest funnels (/parents, /content-filter). We have zero presence. |
| 7 | Named commitment mode | idea for Pete | SHIFT's "REHAB" preset = badge-of-honor testimonial machine. What's Flipped's? |

### FAQ draft (item 2) — awaiting redline
1. **Can I lock myself out on purpose?** Yes — that's the point. A committed focus session holds until the timer runs out. Not even your Mac can end it early.
2. **What if I genuinely need my phone?** Essentials never leave (Phone, Messages, Camera, Maps). 2FA code? 15-minute check-in. Real emergency? One emergency unflip a month.
3. **Can't I just delete the app?** Nothing on your phone to delete — Flipped lives on your Mac, and the block is enforced by iOS itself.
4. **Do I need my Mac every time I flip?** No — flip from the Mac, a schedule, or your phone. The Mac only matters to get apps *back*.
5. **What's setup like?** ~Ten minutes, once. Cable in, follow steps, everything after is wireless.
6. **Will it mess up my phone?** No. Apps, data, layout untouched; unflip restores everything exactly.

## Standing rules for this site

- **Inviting language, never scary** (memory `feedback_website_inviting_language.md`). Scary operational truths → help/legal pages only.
- Homepage stays minimal (Opal lesson): one idea per section; mechanism details live behind the fold or on subpages.
- Every claim must be true of the product today ("no claims the product can't guarantee").
- Brand voice: brutalist mono, caps labels, sentence-case body, geometric symbols, UI.* token palette.
- SHIFT stays OUT of the comparison table (Pete's call, 2026-05).
