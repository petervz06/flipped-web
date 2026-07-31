/* Meta Pixel — central loader + event helpers for useflipped.com.

   One place owns the Pixel ID and the plan→price map. Every funnel page loads
   this in <head> (async). The Pixel ID is public by design — it ships in every
   browser, so it is NOT a secret. Server-side Purchase (Conversions API: higher
   match quality + browser/server dedup) is added separately in the backend.

   Safety: this file only OBSERVES. It never touches checkout logic. If Facebook's
   script fails to load, fbqTrack() no-ops and the page behaves exactly as before. */
(function () {
  'use strict';
  var PIXEL_ID = '910145582104079';

  // Standard Meta base code (injects connect.facebook.net/.../fbevents.js).
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  // Manual advanced matching. checkout.js stashes the buyer's email before the
  // Stripe redirect; passing it here lets Meta match events to a person instead
  // of guessing from cookies alone. fbevents.js normalises + hashes this itself
  // (SHA-256, in the browser) — the raw address never reaches Meta.
  // Without it, Purchase lands on billing-success with no identifiers and a
  // Stripe referrer, which is why its Event Match Quality reads 0.
  var amEmail = null;
  try { amEmail = localStorage.getItem('flipped_checkout_email'); } catch (e) {}
  if (amEmail) {
    fbq('init', PIXEL_ID, { em: String(amEmail).trim().toLowerCase() });
  } else {
    fbq('init', PIXEL_ID);
  }
  fbq('track', 'PageView');

  // Shared with checkout.js (InitiateCheckout) and the Purchase block below.
  // lifetime is the only plan on sale ($99). 149.99 is the struck-through anchor
  // shown next to it, not a charge — reporting it inflated every Purchase by ~51%.
  // annual is archived in Stripe and unpurchasable; monthly still exists but is
  // not surfaced anywhere on the site.
  window.FLIPPED_PLANS = { monthly: 8.99, lifetime: 99 };

  // Safe wrapper — callers never break the page if fbq failed to load.
  window.fbqTrack = function (event, params, opts) {
    if (window.fbq) { try { window.fbq('track', event, params, opts); } catch (e) {} }
  };

  var path = location.pathname;

  // Pricing intent — fires only on the pricing page.
  if (path.indexOf('pricing') !== -1) {
    window.fbqTrack('ViewContent', { content_category: 'pricing' });
  }

  // Purchase confirmation. Browser-side signal; the backend Conversions API
  // carries the authoritative value and deduplicates via the Stripe session id
  // (passed as ?session_id=… and used here as the eventID).
  if (path.indexOf('billing-success') !== -1) {
    var plan = null;
    try { plan = localStorage.getItem('flipped_pending_plan'); } catch (e) {}
    var params = { currency: 'USD' };
    if (plan && window.FLIPPED_PLANS[plan]) {
      params.value = window.FLIPPED_PLANS[plan];
      params.content_name = plan;
    }
    var sid = null;
    try { sid = new URLSearchParams(location.search).get('session_id'); } catch (e) {}
    window.fbqTrack('Purchase', params, sid ? { eventID: sid } : undefined);
    try { localStorage.removeItem('flipped_pending_plan'); } catch (e) {}
  }
})();
