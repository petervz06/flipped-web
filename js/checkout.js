/* Pricing CTAs:
   <button class="btn primary" data-checkout-plan="annual">Get started</button>
   On click: POST {plan} → backend returns { url }; window.location = url.

   On error: button reverts + alert. Backend feature-gating may return 503
   before Stripe goes live — show an honest fallback. */
(function () {
  'use strict';
  var ENDPOINT = 'https://flipped-production-79b3.up.railway.app/api/billing/checkout-session';

  function setBusy(btn, busy) {
    if (busy) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Loading...';
      btn.setAttribute('disabled', 'true');
    } else {
      if (btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
      btn.removeAttribute('disabled');
    }
  }

  function showError(btn, msg) {
    setBusy(btn, false);
    alert(msg || 'Checkout is briefly unavailable — please email support@useflipped.com and we will set you up directly.');
  }

  function go(btn) {
    var plan = btn.getAttribute('data-checkout-plan');
    if (!plan) return;

    // Meta: stash the plan so billing-success can attribute Purchase value, and
    // fire InitiateCheckout. Guarded — never blocks or alters the checkout below.
    try { localStorage.setItem('flipped_pending_plan', plan); } catch (e) {}
    if (window.fbqTrack) {
      var v = window.FLIPPED_PLANS && window.FLIPPED_PLANS[plan];
      window.fbqTrack('InitiateCheckout', { content_name: plan, value: v, currency: 'USD' });
    }

    setBusy(btn, true);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: plan })
    }).then(function (res) {
      if (!res.ok) {
        if (res.status === 503) {
          showError(btn, 'Checkout is launching soon. Email support@useflipped.com to be notified.');
        } else {
          showError(btn, 'Something went wrong (HTTP ' + res.status + '). Please try again or email support@useflipped.com.');
        }
        return null;
      }
      return res.json();
    }).then(function (data) {
      if (data && data.url) {
        window.location.href = data.url;
      } else if (data) {
        showError(btn, 'Checkout did not return a URL. Please email support@useflipped.com.');
      }
    }).catch(function () {
      showError(btn, 'Network error — please check your connection and try again.');
    });
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-checkout-plan]');
    if (!btn) return;
    ev.preventDefault();
    go(btn);
  });
})();
