/* Pricing CTAs:
   <button class="btn primary" data-checkout-plan="annual">Get started</button>

   On click (2026-07-15, Pete-approved): open the pre-checkout modal —
   "Flipped is set up from your Mac. Where should we send your setup link
   after purchase?" — capture the email, THEN POST {plan, email} → backend
   returns { url }; window.location = url.  Stripe checkout arrives with the
   email pre-filled, and the welcome email is guaranteed deliverable.  The
   modal is also where a phone buyer learns the Mac requirement as a
   delivery question, not a warning (the stranded-buyer fix, forensics
   2026-07-15).

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

  /* ── Pre-checkout modal ─────────────────────────────────────────── */

  var MODAL_ID = 'flipped-precheckout';

  function buildModal() {
    var wrap = document.createElement('div');
    wrap.id = MODAL_ID;
    wrap.innerHTML =
      '<div class="fpc-overlay">' +
      '  <div class="fpc-card" role="dialog" aria-modal="true" aria-label="Before checkout">' +
      '    <button class="fpc-close" aria-label="Close">&times;</button>' +
      '    <div class="fpc-eyebrow">ONE THING FIRST</div>' +
      '    <h3 class="fpc-title">Flipped is set up<br>from your Mac.</h3>' +
      '    <p class="fpc-body">Where should we send your setup link after purchase?  Buy now &mdash; set up whenever you’re at your Mac.</p>' +
      '    <input class="fpc-email" type="email" autocomplete="email" placeholder="you@example.com" />' +
      '    <div class="fpc-err" style="display:none;">That doesn’t look like an email &mdash; mind checking it?</div>' +
      '    <button class="fpc-go">CONTINUE TO CHECKOUT →</button>' +
      '    <div class="fpc-micro">THIS EMAIL BECOMES YOUR ACCOUNT &middot; MACOS 14+ &middot; IPHONE IOS 17+</div>' +
      '  </div>' +
      '</div>';
    var style = document.createElement('style');
    style.textContent =
      '#' + MODAL_ID + ' .fpc-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;}' +
      '#' + MODAL_ID + ' .fpc-card{position:relative;background:#000;border:1px solid rgba(255,255,255,.25);border-radius:14px;max-width:400px;width:100%;padding:30px 26px 24px;text-align:center;box-shadow:0 18px 70px rgba(0,0,0,.8);}' +
      '#' + MODAL_ID + ' .fpc-close{position:absolute;top:10px;right:14px;background:none;border:0;color:rgba(255,255,255,.4);font-size:22px;cursor:pointer;line-height:1;}' +
      '#' + MODAL_ID + ' .fpc-close:hover{color:#fff;}' +
      '#' + MODAL_ID + ' .fpc-eyebrow{font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:3px;color:rgba(255,255,255,.45);margin-bottom:14px;}' +
      '#' + MODAL_ID + ' .fpc-title{color:#fff;font-size:21px;font-weight:800;margin:0 0 10px;line-height:1.25;}' +
      '#' + MODAL_ID + ' .fpc-body{color:rgba(255,255,255,.6);font-size:13.5px;line-height:1.55;margin:0 0 18px;}' +
      '#' + MODAL_ID + ' .fpc-email{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font-size:15px;padding:12px 14px;margin-bottom:12px;outline:none;}' +
      '#' + MODAL_ID + ' .fpc-email:focus{border-color:rgba(255,255,255,.4);}' +
      '#' + MODAL_ID + ' .fpc-err{color:#d9734f;font-size:12.5px;margin:-4px 0 10px;}' +
      '#' + MODAL_ID + ' .fpc-go{display:block;width:100%;box-sizing:border-box;background:#fff;color:#000;font-family:var(--font-mono,monospace);font-size:12px;font-weight:700;letter-spacing:2px;border:0;border-radius:8px;padding:14px 0;margin-bottom:12px;cursor:pointer;}' +
      '#' + MODAL_ID + ' .fpc-go[disabled]{opacity:.6;cursor:default;}' +
      '#' + MODAL_ID + ' .fpc-micro{font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,.4);line-height:1.7;}';
    wrap.appendChild(style);
    return wrap;
  }

  function openModal(planBtn) {
    closeModal();
    var modal = buildModal();
    document.body.appendChild(modal);
    var input = modal.querySelector('.fpc-email');
    var err = modal.querySelector('.fpc-err');
    var goBtn = modal.querySelector('.fpc-go');

    // Remember the email across visits/plans — typed once, ever.
    try {
      var saved = localStorage.getItem('flipped_checkout_email');
      if (saved) input.value = saved;
    } catch (e) {}
    input.focus();

    function submit() {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.style.display = 'block';
        input.focus();
        return;
      }
      err.style.display = 'none';
      try { localStorage.setItem('flipped_checkout_email', email); } catch (e) {}
      goBtn.setAttribute('disabled', 'true');
      goBtn.textContent = 'OPENING CHECKOUT…';
      go(planBtn, email, function () {
        goBtn.removeAttribute('disabled');
        goBtn.textContent = 'CONTINUE TO CHECKOUT →';
      });
    }

    goBtn.addEventListener('click', submit);
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') submit();
    });
    modal.querySelector('.fpc-close').addEventListener('click', closeModal);
    modal.querySelector('.fpc-overlay').addEventListener('click', function (ev) {
      if (ev.target === ev.currentTarget) closeModal();
    });
  }

  function closeModal() {
    var existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();
  }

  /* ── Checkout ───────────────────────────────────────────────────── */

  function go(btn, email, onError) {
    var plan = btn.getAttribute('data-checkout-plan');
    if (!plan) return;

    // Meta: stash the plan so billing-success can attribute Purchase value, and
    // fire InitiateCheckout. Guarded — never blocks or alters the checkout below.
    try { localStorage.setItem('flipped_pending_plan', plan); } catch (e) {}
    if (window.fbqTrack) {
      var v = window.FLIPPED_PLANS && window.FLIPPED_PLANS[plan];
      window.fbqTrack('InitiateCheckout', { content_name: plan, value: v, currency: 'USD' });
    }

    function fail(msg) {
      if (onError) onError();
      showError(btn, msg);
    }

    setBusy(btn, true);
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: plan, email: email || null })
    }).then(function (res) {
      if (!res.ok) {
        if (res.status === 503) {
          fail('Checkout is launching soon. Email support@useflipped.com to be notified.');
        } else {
          fail('Something went wrong (HTTP ' + res.status + '). Please try again or email support@useflipped.com.');
        }
        return null;
      }
      return res.json();
    }).then(function (data) {
      if (data && data.url) {
        window.location.href = data.url;
      } else if (data) {
        fail('Checkout did not return a URL. Please email support@useflipped.com.');
      }
    }).catch(function () {
      fail('Network error — please check your connection and try again.');
    });
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-checkout-plan]');
    if (!btn) return;
    ev.preventDefault();
    openModal(btn);
  });
})();
