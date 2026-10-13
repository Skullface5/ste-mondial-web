/* ============================================================
   STE — product variants (storefront)
   Ported from rosa-variants.js for ste palette:
     espresso #2B1D12, cream #F5F0E6, gold #B08D4A, muted #8A7A66
   ============================================================ */
(function () {
  'use strict';

  var CSS = [
    '.variant-block{margin:1.1rem 0 0.2rem;}',
    '.variant-title{font-size:.7rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted,#8A7A66);margin-bottom:.55rem;font-weight:500;}',
    '.variant-options{display:flex;flex-wrap:wrap;gap:.55rem;}',
    '.variant-opt{display:inline-flex;align-items:center;gap:.5rem;min-width:104px;padding:.6rem .95rem;border:1px solid rgba(176,141,74,.28);border-radius:14px;background:#FAF6EE;color:var(--espresso,#2B1D12);cursor:pointer;text-align:start;font-family:inherit;line-height:1.25;transition:border-color .25s,background-color .25s,box-shadow .25s,transform .25s;}',
    '.variant-opt:hover{border-color:var(--gold,#B08D4A);}',
    '.variant-opt.is-active{border-color:var(--gold,#B08D4A);background:#EFE7D7;box-shadow:0 0 0 1px var(--gold,#B08D4A) inset;}',
    '.variant-radio{width:15px;height:15px;border-radius:50%;border:1.5px solid rgba(176,141,74,.4);flex:0 0 auto;position:relative;}',
    '.variant-opt.is-active .variant-radio{border-color:var(--gold,#B08D4A);}',
    '.variant-opt.is-active .variant-radio:after{content:"";position:absolute;inset:3px;border-radius:50%;background:var(--gold,#B08D4A);}',
    '.variant-opt-txt{display:flex;flex-direction:column;}',
    '.variant-label{font-size:.82rem;font-weight:500;}',
    '.variant-price{font-size:.7rem;color:var(--gold,#B08D4A);}',
    '.variant-opt.is-out{opacity:.45;cursor:not-allowed;text-decoration:line-through;}',
    '.cart-item-sub{font-size:.68rem;color:var(--gold,#B08D4A);text-transform:uppercase;letter-spacing:.1em;margin-top:.15rem;}',
    '.variant-chip{display:inline-block;font-size:.58rem;letter-spacing:.12em;text-transform:uppercase;color:var(--gold,#B08D4A);border:1px solid rgba(176,141,74,.4);border-radius:20px;padding:.12rem .45rem;margin-top:.35rem;}'
  ].join('');

  function injectCss() {
    if (document.getElementById('steVariantCss')) return;
    var s = document.createElement('style');
    s.id = 'steVariantCss';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function esc(str) { return str == null ? '' : String(str).replace(/[&<>\"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function parse(v) {
    if (v == null || v === '' || v === 'null') return [];
    var arr = v;
    if (typeof v === 'string') { try { arr = JSON.parse(v); } catch (e) { return []; } }
    if (!Array.isArray(arr)) return [];
    var out = [];
    arr.forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var label = r.label != null ? String(r.label).trim() : '';
      if (!label) return;
      var price = r.price == null || r.price === '' ? null : parseFloat(r.price);
      if (!isFinite(price)) price = null;
      var qty = r.quantity == null || r.quantity === '' ? null : parseInt(r.quantity, 10);
      if (!isFinite(qty)) qty = null;
      var images = normalizeImages(r.images != null ? r.images : r.image);
      var oldPrice = r.old_price == null || r.old_price === '' ? null : parseFloat(r.old_price);
      if (!isFinite(oldPrice) || (price != null && oldPrice <= price)) oldPrice = null;
      out.push({ label: label, price: price, quantity: qty, images: images, old_price: oldPrice });
    });
    return out;
  }

  function normalizeImages(v) {
    if (v == null || v === '') return [];
    var arr = v;
    if (typeof arr === 'string') {
      var s = arr.trim();
      if (s.charAt(0) === '[') { try { arr = JSON.parse(s); } catch (e) { arr = [s]; } }
      else arr = [s];
    }
    if (!Array.isArray(arr)) return [];
    var out = [];
    arr.forEach(function (u) { if (u != null && String(u).trim()) out.push(String(u).trim()); });
    return out;
  }

  function variantImage(variant) {
    return (variant && variant.images && variant.images.length) ? variant.images[0] : null;
  }

  function variantPercent(variant) {
    if (!variant || variant.old_price == null || variant.price == null) return null;
    if (variant.old_price <= variant.price) return null;
    return Math.round(((variant.old_price - variant.price) / variant.old_price) * 100);
  }

  function variantOnSale(variant) { return variantPercent(variant) != null; }

  function priceFor(product, variant) {
    if (variant && variant.price != null) return variant.price;
    var p = parseFloat(product && product.price);
    return isFinite(p) ? p : 0;
  }

  function inStock(product, variant) {
    var q = variant && variant.quantity != null ? variant.quantity : (product ? product.stock : null);
    return q == null ? true : Number(q) > 0;
  }

  function stockOf(product, variant) {
    if (variant && variant.quantity != null) return Number(variant.quantity);
    if (product && product.stock != null) return Number(product.stock);
    return null;
  }

  injectCss();

  window.SteVariants = {
    parse: parse,
    normalizeImages: normalizeImages,
    variantImage: variantImage,
    variantPercent: variantPercent,
    variantOnSale: variantOnSale,
    priceFor: priceFor,
    inStock: inStock,
    stockOf: stockOf,
    esc: esc,
    injectCss: injectCss
  };
})();