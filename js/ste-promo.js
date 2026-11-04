/* ============================================================
   STE — promo presentation (badges, promo price, Buy + cart)
   Ported from rosa-promo.js for ste palette.
   Settings keys (site_settings): promo_badge_color,
     promo_price_color, promo_badge_shape, buy_cart_icon
   ============================================================ */
(function () {
  'use strict';

  var DEFAULTS = {
    promo_badge_color: 'green',
    promo_price_color: 'red',
    promo_badge_shape: 'pill',
    buy_cart_icon: 'plus-cart'
  };

  var COLORS = { green: '#03B557', red: '#E0231F', gold: '#B08D4A', black: '#2B1D12' };
  var ICONS = {
    'plus-cart': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 6h18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    'bag': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 6h18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 10a4 4 0 0 1-8 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    'cart': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h2l2 9h9l2-6H7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="18.5" r="1.4"/><circle cx="16" cy="18.5" r="1.4"/></svg>',
    'bolt': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3 6.5 13H11l-1 8 7-10.5H12.5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
  };

  var S = Object.assign({}, DEFAULTS);

  var CSS = [
    '.rp-badge{position:absolute;z-index:4;display:inline-flex;align-items:center;justify-content:center;',
    'font-family:\'Montserrat\',sans-serif;font-weight:600;letter-spacing:.01em;color:#fff;text-align:center;line-height:1;',
    'background:var(--rp-badge-bg,' + COLORS.green + ');pointer-events:none;border:0;box-shadow:none;}',
    '.rp-badge--pill{top:var(--rp-badge-top,11px);left:var(--rp-badge-left,11px);min-width:54px;height:26px;padding:0 11px;border-radius:var(--rp-badge-radius,999px);font-size:15px;}',
    '.rp-badge--corner{top:var(--rp-badge-top,0);left:var(--rp-badge-left,0);min-width:54px;height:26px;padding:0 11px;border-radius:var(--rp-badge-radius,0 0 12px 0);font-size:15px;}',
    '.rp-price--promo{color:var(--rp-price-color,' + COLORS.red + ')!important;}',
    '.rp-buy-row{display:flex;gap:.4rem;align-items:center;}',
    '.rp-buy-row.product-actions{justify-content:center;max-width:480px;margin-left:auto;margin-right:auto;width:100%;}',
    '.rp-buy-btn{flex:1 1 auto;min-width:0;}',
    '.rp-buy-row .buy-now-btn{background:var(--espresso,#2B1D12);border:none;color:var(--white,#fff);min-height:56px;padding:.6rem 1.1rem;border-radius:999px;font-weight:600;font-size:1rem;letter-spacing:.02em;box-shadow:0 6px 18px rgba(90,70,50,.18);justify-content:center;text-align:center;}',
    '.rp-buy-row .buy-now-btn:hover{background:var(--gold,#B08D4A);transform:translateY(-1px);}',
    '.rp-cart-btn{flex:0 0 auto;width:75px;min-height:56px;display:inline-flex;align-items:center;justify-content:center;',
    'background:transparent;border:1.5px solid var(--espresso,#2B1D12);color:var(--espresso,#2B1D12);border-radius:10px;cursor:pointer;',
    'transition:background-color .25s,color .25s;padding:0;}',
    '.rp-cart-btn:hover{background:var(--espresso,#2B1D12);color:var(--white,#fff);}',
    '.rp-cart-btn svg{width:23px;height:23px;}',
    '.rp-cart-btn[disabled]{opacity:.5;cursor:not-allowed;}',
    '@media (max-width:480px){',
    '  .rp-buy-row{gap:.35rem;}',
    '  .rp-buy-row .buy-now-btn{min-height:40px;padding:.4rem .5rem;font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '  .rp-buy-row .rp-cart-btn{width:42px;min-height:44px;border-radius:9px;}',
    '  .rp-buy-row .rp-cart-btn svg{width:18px;height:18px;}',
    '  .product-actions.rp-buy-row{gap:.5rem;}',
    '  .product-actions.rp-buy-row .buy-now-btn{min-height:60px;max-height:60px;padding:.3rem 1.4rem;font-size:1.15rem;}',
    '  .product-actions .rp-cart-btn{width:64px;min-height:60px;border-radius:10px;}',
    '  .product-actions .rp-cart-btn svg{width:24px;height:24px;}',
    '}',
    '@media (max-width:420px){.rp-badge--pill,.rp-badge--corner{height:24px;min-width:50px;font-size:14px;padding:0 10px;}}',
    /* In a product card the cart square must match the buy button's height, so
       let the row stretch it instead of using the standalone 56px min-height. */
    '.product-card .rp-buy-row{align-items:stretch;}',
    '.product-card .rp-buy-row .rp-cart-btn{min-height:0;}',
    /* the card button carries margin-top:10px for its standalone layout; inside
       the buy row it would push the row 10px taller than the cart square */
    '.product-card .rp-buy-row .add-btn{margin-top:0;}'
  ].join('\n');

  var cssDone = false;
  function injectCss() {
    if (cssDone || document.getElementById('stePromoCss')) { cssDone = true; return; }
    var s = document.createElement('style');
    s.id = 'stePromoCss';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
    cssDone = true;
  }

  function setSettings(s) {
    S = Object.assign({}, DEFAULTS, s || {});
    repaint();
    return S;
  }

  /* Publish the current look to the document so the shop can be repainted
     without re-rendering the cards. Without this, a saved change only showed
     on the next full render of the grid (which is why the owner saw nothing). */
  function publish() {
    try {
      var root = document.documentElement;
      root.style.setProperty('--rp-badge-bg', bg());
      root.style.setProperty('--rp-price-color', priceColor());
      if (shape() === 'corner') {
        root.style.setProperty('--rp-badge-radius', '0 0 12px 0');
        root.style.setProperty('--rp-badge-top', '0');
        root.style.setProperty('--rp-badge-left', '0');
      } else {
        root.style.setProperty('--rp-badge-radius', '999px');
        root.style.setProperty('--rp-badge-top', '11px');
        root.style.setProperty('--rp-badge-left', '11px');
      }
    } catch (e) {}
  }

  /* Repaint what is already on screen: badges drawn earlier keep an inline
     background from the old markup, and any cart button keeps its old glyph. */
  function repaint() {
    publish();
    try {
      var badges = document.querySelectorAll('.rp-badge');
      for (var i = 0; i < badges.length; i++) badges[i].style.background = bg();
    } catch (e) {}
    try {
      var btns = document.querySelectorAll('.rp-cart-btn');
      for (var j = 0; j < btns.length; j++) {
        if (btns[j].getAttribute('data-rp-icon') === S.buy_cart_icon) continue;
        btns[j].setAttribute('data-rp-icon', S.buy_cart_icon);
        btns[j].innerHTML = buyIcon();
      }
    } catch (e) {}
  }

  function bg() { return COLORS[S.promo_badge_color] || COLORS.green; }
  function priceColor() { return COLORS[S.promo_price_color] || COLORS.red; }
  function shape() { return ['pill', 'corner'].indexOf(S.promo_badge_shape) >= 0 ? S.promo_badge_shape : 'pill'; }
  function buyIcon() { return ICONS[S.buy_cart_icon] || ICONS['plus-cart']; }

  /* app2.js hands us normalized rows (oldPrice / promoPercent) while variant
     objects use the raw column names (old_price / promo_percent). Accept both:
     reading only the snake_case names made isPromo() false for every storefront
     product, so no badge ever rendered there. */
  function oldPriceOf(p) {
    var v = (p.old_price !== undefined && p.old_price !== null && p.old_price !== '') ? p.old_price : p.oldPrice;
    return (v === undefined || v === null || v === '') ? NaN : parseFloat(v);
  }
  function manualPercentOf(p) {
    var v = (p.promo_percent !== undefined && p.promo_percent !== null && p.promo_percent !== '') ? p.promo_percent : p.promoPercent;
    var n = (v === undefined || v === null || v === '') ? NaN : parseFloat(v);
    /* Clamp: a manual value outside 1..99 is ignored (falls back to the value
       computed from old_price) rather than letting a stray DB value win. */
    if (!isFinite(n) || n < 1 || n > 99) return NaN;
    return n;
  }

  function percent(p) {
    if (!p) return null;
    var manual = manualPercentOf(p);
    var op = oldPriceOf(p);
    var cp = parseFloat(p.price);
    if (!isFinite(op) || !isFinite(cp) || op <= cp) {
      if (isFinite(manual) && manual > 0) return Math.round(manual);
      return null;
    }
    if (isFinite(manual) && manual > 0) return Math.round(manual);
    return Math.round(((op - cp) / op) * 100);
  }

  function isPromo(p) { return percent(p) != null; }

  function badgeHtml(p) {
    var pct = percent(p);
    if (pct == null) return '';
    /* Inline background so a cold/failed settings fetch can never leave the badge
       at the CSS-default green; repaint() keeps it correct after settings load. */
    return '<span class="rp-badge rp-badge--' + shape() + '" style="background:' + bg() + '">-' + pct + '%</span>';
  }

  function badge(p) {
    if (!isPromo(p)) return '';
    return badgeHtml(p);
  }

  function priceHtml(p, fmt) {
    var f = typeof fmt === 'function' ? fmt : function (v) { return String(v); };
    var pct = percent(p);
    var op = oldPriceOf(p);
    var cp = parseFloat(p.price);
    if (pct != null && isFinite(op) && op > cp) {
      return '<s class="rp-old-price" style="opacity:.5;font-weight:300;font-size:.8em;margin-inline-end:7px;">' + f(op) + '</s>' +
        '<span class="rp-price--promo">' + f(cp) + '</span>';
    }
    if (pct != null && isFinite(cp)) {
      return '<span class="rp-price--promo">' + f(cp) + '</span>';
    }
    return f(p.price);
  }

  window.StePromo = {
    DEFAULTS: DEFAULTS,
    COLORS: COLORS,
    ICONS: ICONS,
    setSettings: setSettings,
    settings: function () { return S; },
    percent: percent,
    isPromo: isPromo,
    badge: badge,
    badgeHtml: badgeHtml,
    priceHtml: priceHtml,
    bg: bg,
    priceColor: priceColor,
    shape: shape,
    buyIcon: buyIcon,
    publish: publish,
    repaint: repaint,
    injectCss: injectCss
  };

  injectCss();
})();