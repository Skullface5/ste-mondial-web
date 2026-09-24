/* ============================================================
   STE Mondial Parfums — app2.js (shop logic)
   Plain fetch to Supabase REST (no build step, no dependencies).
   Views: shop / product modal / cart drawer / checkout / confirm
   i18n: FR (default) / EN / AR (rtl) via i18n/<lang>.json
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Config ---------- */
  var SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';
  var CART_KEY = 'sm_cart2';
  var LANG_KEY = 'sm_lang2';
  var ORDER_KEY = 'sm_last_order2';
  var AUDIENCES = ['homme', 'femme', 'enfants', 'unisexe'];

  /* ---------- State ---------- */
  var state = {
    lang: 'fr',
    dicts: {},          // lang -> flat key/value
    products: [],       // normalized products
    offline: false,     // true when DB fetch failed -> fallback products
    loaded: false,
    cart: [],           // [{id, productId, nameFr, nameEn, nameAr, price, image, qty}]
    audience: 'all',
    search: '',
    modalId: null,
    modalQty: 1,
    orderId: null,
    submitting: false
  };

  /* ---------- Tiny helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtPrice(n) {
    var v = Number(n) || 0;
    return v.toFixed(3) + ' ' + t('misc.currency');
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ---------- i18n ---------- */
  /* Core FR strings used in JS-rendered content. Seeded so the page degrades
     gracefully on file:// (where fetch of i18n/*.json is CORS-blocked).
     On http(s) the fetched JSON overrides these (same keys). */
  var CORE_FR = {
    'misc.currency': 'DT',
    'misc.offline': 'Hors ligne — catalogue de démonstration',
    'products.tabAll': 'Tout',
    'products.added': 'Ajouté ✓',
    'products.empty': 'Aucun produit dans cette catégorie.',
    'product.addToCart': 'Ajouter au panier',
    'audience.all': 'Tous',
    'audience.homme': 'Homme',
    'audience.femme': 'Femme',
    'audience.enfants': 'Enfants',
    'audience.unisexe': 'Unisexe',
    'review.title': 'Avis clients',
    'review.loading': 'Chargement des avis…',
    'review.empty': 'Aucun avis pour le moment. Soyez le premier !',
    'review.cta': 'Donnez votre note',
    'review.yours': 'Votre avis',
    'review.submit': 'Envoyer mon avis',
    'review.update': 'Mettre à jour mon avis',
    'review.loginCta': 'Connectez-vous pour laisser un avis',
    'review.placeholder': 'Votre avis…',
    'review.errStars': 'Choisissez une note',
    'review.errFail': 'Erreur — réessayez',
    'product.reviews': 'avis',
    'product.stockIn': 'En stock',
    'product.stockOut': 'Rupture de stock',
    'cart.items': '{n} article(s)',
    'cart.empty': 'Votre panier est vide.',
    'cart.emptyCta': 'Découvrir nos parfums',
    'cart.remove': 'Retirer',
    'cart.decrease': 'Diminuer la quantité',
    'cart.increase': 'Augmenter la quantité',
    'cart.subtotal': 'Sous-total',
    'products.searchPlaceholder': 'Rechercher un parfum…',
    'cart.delivery': 'Livraison',
    'cart.free': 'Gratuite',
    'checkout.delivery': 'Livraison',
    'checkout.free': 'Gratuite',
    'checkout.free_hint': "Paiement à la livraison",
    'checkout.total_due': 'Total à payer',
    'checkout.submitting': 'Envoi en cours…',
    'checkout.submit': 'Confirmer la commande',
    'orders.copy': 'Copier le numéro',
    'pm.prev': 'Précédent',
    'pm.next': 'Suivant',
    'review.stars': '{n} étoiles'
  };

  function has(key) {
    var d = state.dicts[state.lang];
    return !!(d && typeof d[key] === 'string');
  }

  function t(key, vars) {
    var d = state.dicts[state.lang] || {};
    var s = d[key];
    if (typeof s !== 'string') s = CORE_FR[key] || (state.dicts.fr || {})[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  // Bridge for sibling modules (account.js drawer): they reuse the live
  // dictionary so their strings follow the site language (fr/en/ar).
  window.SM_I18N = {
    t: function (key) { return t(key); },
    has: has,
    lang: function () { return state.lang; }
  };

  function fetchLocale(lang) {
    if (state.dicts[lang]) return Promise.resolve(state.dicts[lang]);
    return fetch('i18n/' + lang + '.json?v=18', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('i18n HTTP ' + r.status); return r.json(); })
      .then(function (json) { state.dicts[lang] = json; return json; })
      .catch(function () { state.dicts[lang] = state.dicts[lang] || {}; return state.dicts[lang]; });
  }

  function applyStatic() {
    $all('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (has(k)) el.textContent = t(k, { year: new Date().getFullYear() });
    });
    $all('[data-i18n-aria]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-aria');
      if (has(k)) el.setAttribute('aria-label', t(k));
    });
    $all('[data-ph]').forEach(function (el) {
      var k = el.getAttribute('data-ph');
      if (has(k)) el.setAttribute('placeholder', t(k));
    });
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    if (has('meta.title')) document.title = t('meta.title');
    $all('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === state.lang);
    });
    var si = document.getElementById('shopSearch');
    if (si && has('products.searchPlaceholder')) si.setAttribute('placeholder', t('products.searchPlaceholder'));
  }

  var langSeq = 0;
  function setLang(lang) {
    if (['fr', 'en', 'ar'].indexOf(lang) === -1) lang = 'fr';
    var seq = ++langSeq;
    state.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }
    return fetchLocale(lang).then(function () {
      if (seq !== langSeq) return; // a newer switch happened — drop this stale render
      if (state.lang !== lang) return; // double guard: lang moved on while fetching
      applyStatic();
      applySettings();
      renderGrid();
      renderCart();
      renderSummary();
      renderModalTexts();
      updateBadges();
    });
  }

  /* ---------- Product helpers ---------- */
  function pName(p) { return p['name' + cap(state.lang)] || p.nameFr || p.sku || '—'; }
  function pDesc(p) { return p['desc' + cap(state.lang)] || p.descFr || ''; }

  function normalizeRow(r) {
    return {
      id: r.id,
      sku: r.sku || '',
      nameFr: r.name_fr || r.sku || 'Produit',
      nameEn: r.name_en || r.name_fr || 'Product',
      nameAr: r.name_ar || r.name_fr || 'منتج',
      descFr: r.desc_fr || '',
      descEn: r.desc_en || '',
      descAr: r.desc_ar || '',
      audience: AUDIENCES.indexOf(r.audience) !== -1 ? r.audience : 'unisexe',
      price: Number(r.price) || 0,
      oldPrice: r.old_price != null ? Number(r.old_price) : null,
      imageUrl: r.image_url || (r.images && r.images[0]) || '',
      images: Array.isArray(r.images) ? r.images.filter(Boolean) : [],
      stock: r.stock == null ? 10 : Number(r.stock),
      rating: r.rating != null ? Number(r.rating) : 5,
      reviewCount: r.review_count != null ? Number(r.review_count) : 0
    };
  }

  var FALLBACK_PRODUCTS = [];

  var loadEpoch = 0, lastLoadAt = 0;
  function loadProducts(force) {
    // throttle auto-refreshes; force skips the throttle (boot)
    if (!force && state.loaded && Date.now() - lastLoadAt < 15000) return;
    lastLoadAt = Date.now();
    var myEpoch = ++loadEpoch;
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
    var headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
    return fetch(SUPABASE_URL + '/rest/v1/products?active=eq.true&order=featured.desc,created_at.desc&select=*', {
      headers: headers,
      cache: 'no-store',
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error('products HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (timer) clearTimeout(timer);
        if (myEpoch !== loadEpoch) return; // a newer fetch superseded this one
        if (!Array.isArray(rows) || rows.length === 0) throw new Error('empty products');
        state.products = rows.map(normalizeRow);
        state.offline = false;
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        if (myEpoch !== loadEpoch) return; // stale/aborted attempt: never clobber good data
        // keep whatever catalog we already had; just surface the offline badge
        state.offline = !state.products.length;
      })
      .then(function () {
        if (myEpoch !== loadEpoch) return;
        state.loaded = true;
        if (!document.getElementById('view-all').hidden) renderAllPage();
        renderGrid();
      });
  }

  // refresh the catalog when the user comes back to a stale tab (admin added products meanwhile)
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      loadProducts(true);
    }
  });

  function findProduct(id) {
    for (var i = 0; i < state.products.length; i++) {
      if (state.products[i].id === id) return state.products[i];
    }
    return null;
  }

  /* ---------- Media (image / fallback initial) ---------- */
  function mediaHtml(p, cls) {
    var initial = esc((pName(p) || '?').trim().charAt(0).toUpperCase());
    var fallback = '<div class="media-fallback" aria-hidden="true">' + initial + '</div>';
    if (!p.imageUrl) return fallback;
    var imgTag = function (u, extra) {
      return '<img src="' + esc(u) + '" alt="' + esc(pName(p)) + '" loading="lazy" ' +
        'onerror="this.outerHTML=\'<div class=&quot;media-fallback&quot; aria-hidden=&quot;true&quot;>' + initial + '</div>\'">';
    };
    var imgs = (p.images && p.images.length > 1) ? p.images : [p.imageUrl];
    if (p.images && p.images.length > 1 && cls !== 'grid-thumb') {
      var slides = '', dots = '';
      for (var i = 0; i < p.images.length; i++) {
        slides += '<div class="pm-slide">' + imgTag(p.images[i]) + '</div>';
        dots += '<span class="pm-dot' + (i === 0 ? ' active' : '') + '" data-dot="' + i + '"></span>';
      }
      return '<div class="pm-gallery" data-gallery>' +
        '<div class="pm-track" data-track>' + slides + '</div>' +
        '<button type="button" class="pm-nav pm-prev" data-prev aria-label="' + esc(t('pm.prev')) + '">‹</button>' +
        '<button type="button" class="pm-nav pm-next" data-next aria-label="' + esc(t('pm.next')) + '">›</button>' +
        '<div class="pm-dots" data-dots>' + dots + '</div>' +
        '</div>';
    }
    return imgTag(p.imageUrl);
  }

  /* ---------- Grid ---------- */
  function visibleProducts() {
    var list = state.products;
    if (state.audience !== 'all') {
      list = list.filter(function (p) { return p.audience === state.audience; });
    }
    if (state.search) {
      var q = state.search.toLowerCase();
      return list.filter(function (p) { return productMatch(p, q); });
    }
    return list;
  }

  /* ---------- Trust bar entrance (same pattern as card reveal) ---------- */
  var trustObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        var batch = 0;
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.style.setProperty('--td', Math.min(batch * 90, 360) + 'ms');
            en.target.classList.add('trust-in');
            trustObserver.unobserve(en.target);
            batch++;
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 })
    : null;

  function initTrustBar() {
    var items = $all('.trust-item');
    if (!items.length) return;
    if (!trustObserver) return; // no observer support: badges stay visible, static
    items.forEach(function (it) { it.classList.add('trust-anim'); trustObserver.observe(it); });
  }


  var cardObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        var batch = 0;
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.style.setProperty('--d', Math.min(batch * 55, 330) + 'ms');
            en.target.classList.add('in-view');
            cardObserver.unobserve(en.target);
            batch++;
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    : null;

  function animateGrid(grid) {
    if (!grid) return;
    if (!cardObserver) { grid.classList.remove('anim-grid'); return; }
    cardObserver.disconnect();
    grid.classList.add('anim-grid');
    Array.prototype.forEach.call(grid.querySelectorAll('.product-card'), function (c) {
      if (!c.classList.contains('sk-card')) cardObserver.observe(c);
    });
  }

  function renderGrid() {
    var grid = $('#productGrid');
    if (!grid) return;

    if (!state.loaded) {
      var sk = '';
      for (var i = 0; i < 4; i++) {
        sk += '<article class="product-card sk-card"><div class="sk-media"></div>' +
          '<div class="sk-line w60"></div><div class="sk-line w40"></div></article>';
      }
      grid.classList.remove('anim-grid');
      grid.innerHTML = sk;
      return;
    }

    var list = visibleProducts();
    if (!list.length) {
      grid.innerHTML = '<p class="grid-empty">' + esc(t('products.empty')) + '</p>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var old = p.oldPrice && p.oldPrice > p.price ? '<s class="old-price">' + esc(fmtPrice(p.oldPrice)) + '</s>' : '';
      return '<article class="product-card" data-id="' + esc(p.id) + '">' +
        '<div class="product-media" data-open="' + esc(p.id) + '" role="button" tabindex="0" aria-label="' + esc(pName(p)) + '">' +
        mediaHtml(p, 'grid-thumb') +
        '</div>' +
        '<div class="product-info">' +
        '<h3 class="product-name">' + esc(pName(p)) + '</h3>' +
        '<p class="product-sub">' + esc(t('audience.' + p.audience)) + '</p>' +
        '<p class="product-price">' + old + esc(fmtPrice(p.price)) + '</p>' +
        '<button class="add-btn" type="button" data-add="' + esc(p.id) + '">' + esc(t('product.addToCart')) + '</button>' +
        '</div></article>';
    }).join('');
    animateGrid(grid);
  }

  function productCardHtml(p) {
    var old = p.oldPrice && p.oldPrice > p.price ? '<s class="old-price">' + esc(fmtPrice(p.oldPrice)) + '</s>' : '';
    return '<article class="product-card" data-id="' + esc(p.id) + '">' +
      '<div class="product-media" data-open="' + esc(p.id) + '" role="button" tabindex="0" aria-label="' + esc(pName(p)) + '">' +
      mediaHtml(p, 'grid-thumb') +
      '</div>' +
      '<div class="product-info">' +
      '<h3 class="product-name">' + esc(pName(p)) + '</h3>' +
      '<p class="product-sub">' + esc(t('audience.' + p.audience)) + '</p>' +
      '<p class="product-price">' + old + esc(fmtPrice(p.price)) + '</p>' +
      '<button class="add-btn" type="button" data-add="' + esc(p.id) + '">' + esc(t('product.addToCart')) + '</button>' +
      '</div></article>';
  }

  /* ---------- Category page ---------- */
  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function productMatch(p, q) {
    // NOTE: shop rows are camelCase (normalizeRow): nameFr/nameEn/nameAr, descFr/...
    var names = [p.nameFr, p.nameEn, p.nameAr].filter(Boolean).map(function (s) { return s.toLowerCase(); });
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (n.indexOf(q) !== -1) return true;                       // direct substring
      var compact = n.replace(/[\s'\-]/g, '');
      if (compact.indexOf(q.replace(/[\s'\-]/g, '')) !== -1) return true;  // ignore spaces/apostrophes
      var initials = n.split(/[\s'\-]+/).map(function (w) { return w.charAt(0); }).join('');
      if (q.length >= 2 && initials.indexOf(q) !== -1) return true;        // "cc" -> Coco Mademoiselle
    }
    if ((p.sku || '').toLowerCase().indexOf(q) !== -1) return true;
    var descs = [p.descFr, p.descEn, p.descAr].filter(Boolean).map(function (s) { return s.toLowerCase(); });
    return descs.some(function (d) { return d.indexOf(q) !== -1; });
  }

    /* ---------- Full catalog page ---------- */
  function renderAllPage() {
    var grid = $('#allGrid');
    if (!grid) return;
    var list = state.products.slice();
    if (state.audience !== 'all') list = list.filter(function (p) { return p.audience === state.audience; });
    if (allPage.q) {
      var q = allPage.q.toLowerCase();
      list = list.filter(function (p) { return productMatch(p, q); });
    }
    if (allPage.sort === 'asc') list.sort(function (a, b) { return a.price - b.price; });
    else if (allPage.sort === 'desc') list.sort(function (a, b) { return b.price - a.price; });
    var pages = Math.max(1, Math.ceil(list.length / ALLPAGE_MAX));
    if (allPage.page > pages) allPage.page = pages;
    var slice = list.slice((allPage.page - 1) * ALLPAGE_MAX, allPage.page * ALLPAGE_MAX);
    grid.innerHTML = slice.map(productCardHtml).join('');
    animateGrid(grid);
    var rc = $('#allResults');
    if (rc) rc.textContent = list.length > 0 ? list.length + ' ' + t('all.results') : '';
    var ae = $('#allEmpty');
    if (ae) ae.hidden = list.length > 0;
    var tabs = $('#allTabs');
    if (tabs) {
      if (pages > 1) {
        tabs.hidden = false;
        tabs.innerHTML = Array.prototype.slice.call({ length: pages }, function (_, i) {
          return '<button type="button" class="cat-tab' + (i + 1 === allPage.page ? ' active' : '') + '" data-allpage="' + (i + 1) + '">' + (i + 1) + '</button>';
        }).join('');
      } else { tabs.hidden = true; tabs.innerHTML = ''; }
    }
  }

  function openAllPage() {
    allPage.page = 1;
    allPage.q = '';
    allPage.sort = 'new';
    var si = $('#allSearch'); if (si) si.value = '';
    var ss = $('#allSort'); if (ss) ss.value = 'new';
    renderAllPage();
    showView('all');
  }

    /* ---------- Cart ---------- */
  function loadCart() {
    try { state.cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch (e) { state.cart = []; }
    if (!Array.isArray(state.cart)) state.cart = [];
    state.cart = state.cart.filter(function (it) {
      return it && it.id && it.qty > 0 && typeof it.price === 'number';
    });
  }

  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (e) { /* noop */ }
  }

  function cartCount() {
    return state.cart.reduce(function (n, it) { return n + it.qty; }, 0);
  }

  function cartTotal() {
    return state.cart.reduce(function (n, it) { return n + it.qty * it.price; }, 0);
  }
  var DELIVERY_FEE = 8.0;
  function deliveryFee(total) {
    return total > 0 ? DELIVERY_FEE : 0;
  }

  /* ---------- Site settings (admin-controlled) ---------- */
  function applySettings() {
    fetch(SUPABASE_URL + '/rest/v1/site_settings?select=key,value', { cache: 'no-store',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
    })
      .then(function (r) { if (!r.ok) throw new Error('settings HTTP ' + r.status); return r.json(); })
      .then(function (rows) {
        var map = {};
        (rows || []).forEach(function (row) { map[row.key] = row.value; });
        var df = Number(map.delivery_fee);
        if (df >= 0) DELIVERY_FEE = df;
        // hero image (multi + autoplay)
        var heroList = Array.isArray(map.hero_images) ? map.hero_images.filter(function (u) { return typeof u === 'string' && u; }) : [];
        if (!heroList.length && map.hero_image && typeof map.hero_image === 'string' && map.hero_image) heroList = [map.hero_image];
        buildHero(heroList, map.hero_autoplay !== false);
        // promo banner ("under the products") — multi-image slider with legacy fallback
        var bannerList = Array.isArray(map.banner_images) ? map.banner_images.filter(function (u) { return typeof u === 'string' && u; }) : [];
        if (!bannerList.length && map.banner_image && typeof map.banner_image === 'string' && map.banner_image) bannerList = [map.banner_image];
        buildBanner(bannerList, map.banner_autoplay !== false);
        // logo (header + footer)
        if (map.logo_image && typeof map.logo_image === 'string') {
          var logo = document.querySelector('img.brand-logo');
          if (logo && logo.getAttribute('src') !== map.logo_image) {
            document.querySelectorAll('img.brand-logo').forEach(function (el) { el.src = map.logo_image; });
          }
        }
        // announcement bar (created on demand, localized)
        var langMap = { fr: 'announcement_fr', en: 'announcement_en', ar: 'announcement_ar' };
        var key = langMap[state.lang] || 'announcement_fr';
        var text = map[key] || map.announcement_fr || '';
        var bar = document.getElementById('smAnnounce');
        if (text) {
          if (!bar) {
            bar = document.createElement('div');
            bar.id = 'smAnnounce';
            bar.className = 'sm-announce';
            var host = document.querySelector('.utility-bar');
            if (host && host.parentElement) host.parentElement.insertBefore(bar, host);
            else document.body.prepend(bar);
          }
          bar.textContent = text;
          bar.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
          bar.hidden = false;
        } else if (bar) {
          bar.hidden = true;
        }
      })
      .then(function () {
        if (state.loaded) { renderCart(); renderSummary(); }
      })
      .catch(function () { /* settings are optional — shop keeps defaults */ });
  }

  function addToCart(p, qty) {
    qty = Math.max(1, Math.min(99, qty || 1));
    var line = null;
    for (var i = 0; i < state.cart.length; i++) {
      if (state.cart[i].id === p.id) { line = state.cart[i]; break; }
    }
    if (line) {
      line.qty = Math.min(99, line.qty + qty);
    } else {
      state.cart.push({
        id: p.id,
        productId: p.id,
        nameFr: p.nameFr, nameEn: p.nameEn, nameAr: p.nameAr,
        price: p.price, image: p.imageUrl || '', qty: qty
      });
    }
    saveCart();
    updateBadges();
    renderCart();
    renderSummary();
  }

  function setQty(id, delta) {
    for (var i = 0; i < state.cart.length; i++) {
      if (state.cart[i].id === id) {
        state.cart[i].qty += delta;
        if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
        break;
      }
    }
    saveCart();
    updateBadges();
    renderCart();
    renderSummary();
  }

  function removeLine(id) {
    state.cart = state.cart.filter(function (it) { return it.id !== id; });
    saveCart();
    updateBadges();
    renderCart();
    renderSummary();
  }

  function updateBadges() {
    var n = cartCount();
    ['cartCount'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }

  function cartItemName(it) {
    return it['name' + cap(state.lang)] || it.nameFr || '—';
  }

  var lastCartCount = -1;

  function renderCart() {
    var wrap = $('#cartItems');
    var foot = $('#cartFoot');
    var countEl = $('#cartDrawerCount');
    if (!wrap) return;

    var n = cartCount();
    if (countEl) {
      countEl.textContent = n > 0 ? t('cart.items', { n: n }) : '';
      if (n > 0 && n !== lastCartCount) {
        countEl.classList.remove('pop');
        void countEl.offsetWidth;
        countEl.classList.add('pop');
      }
      lastCartCount = n;
    }

    if (!state.cart.length) {
      wrap.innerHTML = '<div class="cart-empty"><p>' + esc(t('cart.empty')) + '</p>' +
        '<button class="btn-gold" type="button" data-close-goto="shop"><span>' + esc(t('cart.emptyCta')) + '</span></button></div>';
      if (foot) foot.hidden = true;
      return;
    }

    wrap.innerHTML = state.cart.map(function (it) {
      var initial = esc((cartItemName(it) || '?').trim().charAt(0).toUpperCase());
      var img = it.image
        ? '<img src="' + esc(it.image) + '" alt="' + esc(cartItemName(it)) + '" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<div class="media-fallback" aria-hidden="true">' + initial + '</div>';
      return '<div class="cart-item">' +
        '<div class="cart-item-img">' + img + '</div>' +
        '<div><p class="cart-item-name">' + esc(cartItemName(it)) + '</p>' +
        '<p class="cart-item-price">' + esc(fmtPrice(it.price)) + '</p>' +
        '<div class="qty-stepper">' +
        '<button type="button" class="qty-btn" data-dec="' + esc(it.id) + '" aria-label="' + esc(t('cart.decrease')) + '">−</button>' +
        '<span class="qty-val">' + it.qty + '</span>' +
        '<button type="button" class="qty-btn" data-inc="' + esc(it.id) + '" aria-label="' + esc(t('cart.increase')) + '">+</button>' +
        '</div></div>' +
        '<div class="cart-item-tools">' +
        '<button type="button" class="cart-remove" data-remove="' + esc(it.id) + '">' + esc(t('cart.remove')) + '</button>' +
        '</div></div>';
    }).join('');

    var sub = $('#cartSubtotal');
    if (sub) sub.textContent = fmtPrice(cartTotal());
    var fee = deliveryFee(cartTotal());
    var dRow = $('#cartDeliveryRow');
    if (!dRow) {
      dRow = document.createElement('div');
      dRow.className = 'summary-row';
      dRow.id = 'cartDeliveryRow';
      dRow.innerHTML = '<span data-i18n="cart.delivery">' + t('cart.delivery') + '</span><strong id="cartDelivery"></strong>';
      if (sub && sub.parentElement) sub.parentElement.insertAdjacentElement('afterend', dRow);
    }
    var dEl = $('#cartDelivery');
    if (dEl) dEl.textContent = fee > 0 ? fmtPrice(fee) : t('cart.free');
    var tt = $('#cartTotalDue');
    if (!tt) {
      tt = document.createElement('div');
      tt.className = 'summary-row summary-total';
      tt.id = 'cartTotalDue';
      tt.innerHTML = '<span data-i18n="checkout.total_due">' + t('checkout.total_due') + '</span><strong id="cartTotalVal"></strong>';
      if (dRow) dRow.insertAdjacentElement('afterend', tt);
    }
    var tv = $('#cartTotalVal');
    if (tv) tv.textContent = fmtPrice(cartTotal() + fee);
    if (foot) foot.hidden = false;
  }

  /* ---------- Animated close (let the CSS transition finish, then hide) ---------- */
  function closeAnimated(panel, ov, done) {
    if (!panel || panel.hidden) { if (ov) ov.hidden = true; if (done) done(); return; }
    var finished = false;
    var fin = function () {
      if (finished) return;
      if (panel.classList.contains('open')) return; /* reopened mid-close */
      finished = true;
      panel.hidden = true;
      if (ov) ov.hidden = true;
      if (done) done();
    };
    var t = setTimeout(fin, 380);
    panel.addEventListener('transitionend', function h(e) {
      if (e.target !== panel) return;
      panel.removeEventListener('transitionend', h);
      clearTimeout(t);
      fin();
    });
  }

  /* ---------- Product modal ---------- */
  function openModal(id) {
    var p = findProduct(id);
    if (!p) return;
    state.modalId = id;
    state.modalQty = 1;
    renderModalTexts();
    var m = $('#productModal'), ov = $('#modalOverlay');
    if (m) {
      m.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (state.modalId === id) {
            m.classList.add('open');
            if (ov) ov.classList.add('open');
          }
        });
      });
    }
    if (ov) ov.hidden = false;
    document.documentElement.classList.add('lock');
  }

  function renderModalTexts() {
    if (!state.modalId) return;
    var p = findProduct(state.modalId);
    var m = $('#productModal');
    if (!p || !m) { closeModal(); return; }
    var media = $('#pmMedia');
    if (media) {
      media.innerHTML = mediaHtml(p);
      initGallery(media);
    }
    var set = function (id2, val) { var el = document.getElementById(id2); if (el) el.textContent = val; };
    set('pmCat', t('audience.' + p.audience));
    set('pmName', pName(p));
    set('pmPrice', fmtPrice(p.price));
    var old = $('#pmOldPrice');
    if (old) {
      if (p.oldPrice && p.oldPrice > p.price) { old.textContent = fmtPrice(p.oldPrice); old.hidden = false; }
      else old.hidden = true;
    }
    set('pmQty', String(state.modalQty));
    var desc = $('#pmDesc');
    if (desc) {
      desc.textContent = pDesc(p);
      if (!pDesc(p)) desc.hidden = true; else desc.hidden = false;
    }
    var stock = $('#pmStock');
    if (stock) {
      var out = p.stock <= 0;
      stock.textContent = out ? t('product.stockOut') : t('product.stockIn') + ' (' + p.stock + ')';
      stock.classList.toggle('out', out);
    }
    var add = $('#pmAdd');
    if (add) {
      var span = add.querySelector('span');
      if (span) span.textContent = t('product.addToCart');
    }
  }

  function closeModal() {
    state.modalId = null;
    var m = $('#productModal'), ov = $('#modalOverlay');
    if (ov) ov.classList.remove('open');
    if (m) m.classList.remove('open');
    closeAnimated(m, ov, function () {
      if (!drawerOpen()) document.documentElement.classList.remove('lock');
    });
  }

  /* ---------- Product gallery (modal) ---------- */
  function initGallery(media) {
    var g = media.querySelector('[data-gallery]');
    if (!g) return;
    var track = g.querySelector('[data-track]');
    var dots = Array.prototype.slice.call(g.querySelectorAll('[data-dot]'));
    if (!track || !dots.length) return;
    var i = 0;
    var go = function (n) {
      i = (n + dots.length) % dots.length;
      /* RTL: flex track lays slides right-to-left, so advancing moves the track +, not - */
      var rtl = document.documentElement.dir === 'rtl';
      track.style.transform = 'translateX(' + (rtl ? i * 100 : -i * 100) + '%)';
      dots.forEach(function (d, k) { d.classList.toggle('active', k === i); });
    };
    g.querySelector('[data-prev]').addEventListener('click', function () { go(i - 1); });
    g.querySelector('[data-next]').addEventListener('click', function () { go(i + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { go(k); }); });
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) {
        /* RTL: next slide sits to the left, so swiping right advances */
        var swRtl = document.documentElement.dir === 'rtl';
        go(swRtl ? (dx > 0 ? i + 1 : i - 1) : (dx < 0 ? i + 1 : i - 1));
      }
      x0 = null;
    }, { passive: true });
  }

  /* ---------- Hero slider (admin-controlled) ---------- */
  var heroTimer = null;
  var ALLPAGE_MAX = 24;
  var allPage = { page: 1, q: '', sort: 'new' };
  var bannerTimer = null;
  function buildHero(images, autoplay) {
    var host = document.querySelector('.hero-media');
    if (!host) return;
    if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
    var first = host.querySelector('img');
    if (images.length >= 2) {
      var idx = 0, slides = [];
      var mk = function (src, on) {
        var im = document.createElement('img');
        im.src = src;
        im.alt = '';
        im.decoding = 'async';
        im.className = 'hero-slide' + (on ? ' on' : '');
        return im;
      };
      // keep the preloaded first image as slide 1 (idempotent on re-run)
      if (first) {
        first.className = 'hero-slide on';
        first.style.display = ''; // clear template onerror hide
        if (first.getAttribute('src') !== images[0]) first.src = images[0];
      } else {
        first = mk(images[0], true);
        host.appendChild(first);
      }
      // rebuild secondary slides fresh every call (no dupes)
      Array.prototype.slice.call(host.querySelectorAll('img.hero-slide')).forEach(function (im) {
        if (im !== first) im.remove();
      });
      for (var s = 1; s < images.length; s++) host.appendChild(mk(images[s], false));
      slides = host.querySelectorAll('img.hero-slide');
      if (autoplay) {
        heroTimer = setInterval(function () {
          if (document.hidden) return;
          var all = host.querySelectorAll('img.hero-slide');
          if (all.length < 2) return;
          all[idx].classList.remove('on');
          idx = (idx + 1) % all.length;
          all[idx].classList.add('on');
        }, 5000);
      }
    } else if (images.length === 1) {
      Array.prototype.slice.call(host.querySelectorAll('img.hero-slide')).forEach(function (im) { if (im !== first) im.remove(); });
      if (first) { first.className = ''; first.src = images[0]; }
      else { host.innerHTML = '<img src="' + images[0] + '" alt="">'; }
    }
  }

  function buildBanner(images, autoplay) {
    var host = document.querySelector('.promo-media');
    if (!host) return;
    if (bannerTimer) { clearInterval(bannerTimer); bannerTimer = null; }
    var first = host.querySelector('img');
    if (images.length >= 2) {
      var idx = 0;
      var mk = function (src, on) {
        var im = document.createElement('img');
        im.src = src;
        im.alt = '';
        im.loading = 'lazy';
        im.decoding = 'async';
        im.className = 'promo-slide' + (on ? ' on' : '');
        return im;
      };
      if (first) {
        first.className = 'promo-slide on';
        first.style.display = '';
        if (first.getAttribute('src') !== images[0]) first.src = images[0];
      } else {
        first = mk(images[0], true);
        host.appendChild(first);
      }
      Array.prototype.slice.call(host.querySelectorAll('img.promo-slide')).forEach(function (im) {
        if (im !== first) im.remove();
      });
      for (var s = 1; s < images.length; s++) host.appendChild(mk(images[s], false));
      if (autoplay) {
        bannerTimer = setInterval(function () {
          if (document.hidden) return;
          var all = host.querySelectorAll('img.promo-slide');
          if (all.length < 2) return;
          var cur = all[idx], nxt = all[(idx + 1) % all.length];
          cur.classList.remove('on');
          cur.classList.add('out');
          nxt.classList.add('on');
          setTimeout(function () { cur.classList.remove('out'); }, 1300);
          idx = (idx + 1) % all.length;
        }, 5000);
      }
    } else if (images.length === 1) {
      Array.prototype.slice.call(host.querySelectorAll('img.promo-slide')).forEach(function (im) { if (im !== first) im.remove(); });
      if (first) { first.className = ''; first.src = images[0]; }
      else { host.innerHTML = '<img loading="lazy" src="' + images[0] + '" alt="">'; }
    }
  }

  /* ---------- Cart drawer ---------- */
  function drawerOpen() {
    var d = $('#cartDrawer');
    return !!(d && d.classList.contains('open'));
  }

  function openCart() {
    var d = $('#cartDrawer'), ov = $('#cartOverlay');
    if (d) {
      d.hidden = false;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          d.classList.add('open');
          if (ov) ov.classList.add('open');
        });
      });
    }
    if (ov) ov.hidden = false;
    document.documentElement.classList.add('lock');
  }

  function closeCart() {
    var d = $('#cartDrawer'), ov = $('#cartOverlay');
    if (ov) ov.classList.remove('open');
    if (d) d.classList.remove('open');
    closeAnimated(d, ov, function () {
      if (!state.modalId) document.documentElement.classList.remove('lock');
    });
  }

  /* ---------- Views / routing ---------- */
  function showView(name) {
    var views = { shop: 'view-shop', all: 'view-all', checkout: 'view-checkout', confirm: 'view-confirm' };
    Object.keys(views).forEach(function (k) {
      var el = document.getElementById(views[k]);
      if (el) el.hidden = k !== name;
    });
    closeCart();
    closeModal();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function route() {
    var h = location.hash || '#/shop';
    if (h.indexOf('#/checkout') === 0) {
      if (!state.cart.length) { location.hash = '#/shop'; return; }
      showView('checkout');
      renderSummary();
      // prefill checkout from the customer's account when available
      var au = window.SM_AUTH ? window.SM_AUTH.getUser() : null;
      if (au) {
        var pr = window.SM_AUTH._profileRef ? window.SM_AUTH._profileRef() : {};
        var nEl = $('#coName'), pEl = $('#coPhone'), eEl = $('#coEmail');
        if (nEl && !nEl.value.trim() && (pr.full_name || au.user_metadata && au.user_metadata.full_name)) {
          nEl.value = pr.full_name || au.user_metadata.full_name;
        }
        if (pEl && !pEl.value.trim() && pr.phone) pEl.value = pr.phone;
        if (eEl && !eEl.value.trim() && au.email) eEl.value = au.email;
      }
    } else if (h.indexOf('#/confirm') === 0) {
      if (!state.orderId) {
        try { state.orderId = sessionStorage.getItem(ORDER_KEY); } catch (e) { /* noop */ }
      }
      if (!state.orderId) { location.hash = '#/shop'; return; }
      showView('confirm');
      var el = $('#orderId');
      if (el) el.textContent = state.orderId;
    } else {
      showView('shop');
    }
  }

  /* ---------- Checkout ---------- */
  function renderSummary() {
    var box = $('#summaryItems');
    if (!box) return;
    box.innerHTML = state.cart.map(function (it) {
      var initial = esc((cartItemName(it) || '?').trim().charAt(0).toUpperCase());
      var img = it.image
        ? '<img src="' + esc(it.image) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<div class="media-fallback" aria-hidden="true">' + initial + '</div>';
      return '<div class="summary-item">' +
        '<div class="summary-item-img">' + img + '</div>' +
        '<div><p class="summary-item-name">' + esc(cartItemName(it)) + '</p>' +
        '<p class="summary-item-qty">× ' + it.qty + '</p></div>' +
        '<p class="summary-item-price">' + esc(fmtPrice(it.qty * it.price)) + '</p>' +
        '</div>';
    }).join('');
    var fee = deliveryFee(cartTotal());
    var sRow = $('#summaryDeliveryRow');
    if (!sRow) {
      sRow = document.createElement('div');
      sRow.className = 'summary-row';
      sRow.id = 'summaryDeliveryRow';
      sRow.innerHTML = '<span data-i18n="checkout.delivery">' + t('checkout.delivery') + '</span><strong id="summaryDelivery"></strong>';
      var totalEl0 = $('#summaryTotal');
      if (totalEl0 && totalEl0.parentElement) totalEl0.parentElement.insertAdjacentElement('beforebegin', sRow);
    }
    var sEl = $('#summaryDelivery');
    if (sEl) sEl.textContent = fee > 0 ? fmtPrice(fee) : t('checkout.free');
    var total = $('#summaryTotal');
    if (total) total.textContent = fmtPrice(cartTotal() + fee);
    var hint = $('#summaryHint');
    if (!hint && total && total.parentElement) {
      hint = document.createElement('p');
      hint.className = 'summary-hint';
      hint.id = 'summaryHint';
      total.parentElement.insertAdjacentElement('afterend', hint);
    }
    if (hint) hint.textContent = fee > 0 ? t('checkout.free_hint') : '';
  }

  function setFieldError(inputId, errId, on) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(errId);
    if (input) input.classList.toggle('invalid', on);
    if (err) err.hidden = !on;
  }

  function submitOrder(e) {
    e.preventDefault();
    if (state.submitting) return;
    var nameEl = $('#coName'), phoneEl = $('#coPhone');
    var name = nameEl ? nameEl.value.trim() : '';
    var phone = phoneEl ? phoneEl.value.trim() : '';
    var email = ($('#coEmail') && $('#coEmail').value.trim()) || '';
    var address = ($('#coAddress') && $('#coAddress').value.trim()) || '';
    var city = ($('#coCity') && $('#coCity').value.trim()) || '';
    var notes = ($('#coNotes') && $('#coNotes').value.trim()) || '';

    var nameBad = !name;
    var phoneDigits = phone.replace(/[^0-9]/g, '').replace(/^(?:00216|216)/, '');
    var phoneBad = !/^[2459][0-9]{7}$/.test(phoneDigits);
    setFieldError('coName', 'coNameErr', nameBad);
    var phoneErrEl = document.getElementById('coPhoneErr');
    if (phoneErrEl) phoneErrEl.textContent = t('checkout.errPhone');
    setFieldError('coPhone', 'coPhoneErr', phoneBad);
    if (nameBad) { if (nameEl) nameEl.focus(); return; }
    if (phoneBad) { if (phoneEl) phoneEl.focus(); return; }

    var errBox = $('#coError');
    if (errBox) errBox.hidden = true;

    var items = state.cart.map(function (it) {
      return { product_id: it.productId || it.id, name: cartItemName(it), qty: it.qty, price: it.price };
    });
    var total = Math.round((cartTotal() + deliveryFee(cartTotal())) * 1000) / 1000;

    var btn = $('#coSubmit');
    if (btn) {
      btn.disabled = true;
      var span = btn.querySelector('span');
      if (span) { span.setAttribute('data-i18n', 'checkout.submit'); span.textContent = t('checkout.submitting'); }
    }
    state.submitting = true;

    var auth = window.SM_AUTH || null;
    var authUser = auth ? auth.getUser() : null;
    fetch(SUPABASE_URL + '/rest/v1/orders', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + (auth && authUser ? auth.token() : SUPABASE_KEY),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        customer_email: email || (authUser ? authUser.email : null),
        address: address || null,
        city: city || null,
        notes: notes || null,
        items: items,
        total: total,
        user_id: authUser ? authUser.id : null
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('order HTTP ' + r.status);
        return r.json().catch(function () { return []; });
      })
      .then(function (created) {
        /* RLS: anon INSERT cannot RETURNING (SELECT policy) — minimal returns
           no body, so generate a display reference when no DB id comes back. */
        var id = (Array.isArray(created) && created[0] && created[0].id) || null;
        if (!id) id = 'SM-' + Date.now().toString(36).toUpperCase().slice(-6);
        try {
          fetch(SUPABASE_URL + '/functions/v1/send-order-email', {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: name, customer_phone: phone,
              customer_email: email || (authUser ? authUser.email : null),
              address: address || null, city: city || null,
              items: items, total: total, ref: id, lang: state.lang || 'fr'
            })
          }).catch(function () { /* fire-and-forget */ });
        } catch (eMail) { /* noop */ }
        state.orderId = id;
        try { sessionStorage.setItem(ORDER_KEY, id); } catch (e) { /* noop */ }
        state.cart = [];
        saveCart();
        updateBadges();
        renderCart();
        renderSummary();
        var form = $('#checkoutForm');
        if (form) form.reset();
        location.hash = '#/confirm';
      })
      .catch(function () {
        if (errBox) errBox.hidden = false;
      })
      .then(function () {
        state.submitting = false;
        if (btn) {
          btn.disabled = false;
          var sp = btn.querySelector('span');
          if (sp) sp.textContent = t('checkout.submit');
        }
      });
  }

  /* ---------- Scroll targets ---------- */
  function scrollToId(id) {
    if (document.getElementById('view-shop').hidden) showView('shop');
    var el = document.getElementById(id);
    if (!el) return;
    // sticky header offset
    var y = el.getBoundingClientRect().top + window.pageYOffset - 74;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }

  function setAud(aud) {
    state.audience = aud;
    $all('#audTabs .cat-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-audtab') === aud);
    });
    renderGrid();
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    // Language buttons (header + mobile menu)
    $all('.lang-btn').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });

    // Account buttons (header + mobile menu)
    var openAcct = function () {
      if (menu) { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
      if (window.SM_AUTH) window.SM_AUTH.openDrawer();
    };
    var ab = $('#accountBtn'), abm = $('#accountBtnMobile');
    if (ab) ab.addEventListener('click', openAcct);
    if (abm) abm.addEventListener('click', openAcct);

    // Hamburger
    var burger = $('#hamburgerBtn'), menu = $('#mobileMenu');
    if (burger && menu) {
      burger.addEventListener('click', function () {
        var open = menu.hidden;
        menu.hidden = !open;
        burger.setAttribute('aria-expanded', String(open));
      });
    }

    // Scroll links (nav + footer + tabbar collections)
    document.addEventListener('click', function (e) {
      var sc = e.target.closest('[data-scroll]');
      if (sc) {
        e.preventDefault();
        if (menu) { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
        scrollToId(sc.getAttribute('data-scroll'));
        return;
      }
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        e.preventDefault();
        var k = nav.getAttribute('data-nav');
        if (k === 'home') { showView('shop'); location.hash = '#/shop'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
        if (k === 'cart') openCart();
        if (k === 'cart-view') { showView('shop'); openCart(); }
        if (menu) { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
        return;
      }
      var close = e.target.closest('[data-close]');
      if (close) {
        if (close.getAttribute('data-close') === 'cart') closeCart(); else closeModal();
        return;
      }
      var cg = e.target.closest('[data-close-goto]');
      if (cg) {
        closeCart();
        showView('shop');
        scrollToId('parfums');
        return;
      }
      var atab = e.target.closest('[data-audtab]');
      if (atab) { setAud(atab.getAttribute('data-audtab')); return; }

      var aud = e.target.closest('[data-aud]');
      if (aud) {
        if (menu) { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); }
        showView('shop');
        setAud(aud.getAttribute('data-aud'));
        scrollToId('parfums');
        return;
      }

      var add = e.target.closest('[data-add]');
      if (add) {
        var p = findProduct(add.getAttribute('data-add'));
        if (p) {
          addToCart(p, 1);
          var old = add.textContent;
          add.textContent = t('products.added');
          add.disabled = true;
          setTimeout(function () {
            add.textContent = t('product.addToCart');
            add.disabled = false;
          }, 1100);
          void old;
        }
        return;
      }

      var open = e.target.closest('[data-open]');
      if (open) { openModal(open.getAttribute('data-open')); return; }

      var dec = e.target.closest('[data-dec]');
      if (dec) { setQty(dec.getAttribute('data-dec'), -1); return; }
      var inc = e.target.closest('[data-inc]');
      if (inc) { setQty(inc.getAttribute('data-inc'), 1); return; }
      var rem = e.target.closest('[data-remove]');
      if (rem) { removeLine(rem.getAttribute('data-remove')); return; }
    });

    // Navbar Collections dropdown (click toggle for touch; hover works via CSS on desktop)
    $all('.nav-drop-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var li = btn.closest('.has-drop');
        var open = li.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.has-drop')) {
        $all('.has-drop.open').forEach(function (li) {
          li.classList.remove('open');
          var b = li.querySelector('.nav-drop-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Full catalog page controls
    var allTabs = $('#allTabs');
    if (allTabs) allTabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-allpage]');
      if (b) { allPage.page = Number(b.getAttribute('data-allpage')) || 1; renderAllPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    });
    var allSearch = $('#allSearch');
    if (allSearch) {
      var onAllSearch = debounce(function () {
        allPage.q = allSearch.value.trim();
        allPage.page = 1;
        renderAllPage();
      }, 180);
      allSearch.addEventListener('input', onAllSearch);
      allSearch.addEventListener('compositionend', onAllSearch);
    }
    var allSort = $('#allSort');
    if (allSort) allSort.addEventListener('change', function () {
      allPage.sort = allSort.value;
      allPage.page = 1;
      renderAllPage();
    });
    var allBack = $('#allBackBtn');
    if (allBack) allBack.addEventListener('click', function () { showView('shop'); });
    var allReset = $('#allReset');
    if (allReset) allReset.addEventListener('click', function () {
      allPage.page = 1; allPage.q = ''; allPage.sort = 'new';
      var s1 = $('#allSearch'); if (s1) s1.value = '';
      var s2 = $('#allSort'); if (s2) s2.value = 'new';
      renderAllPage();
    });
    // See all
    var seeAll = $('#seeAllBtn');
    if (seeAll) seeAll.addEventListener('click', function () { openAllPage(); });

    // Product media keyboard access
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        var open2 = e.target.closest && e.target.closest('[data-open]');
        if (open2) { e.preventDefault(); openModal(open2.getAttribute('data-open')); }
      }
      if (e.key === 'Escape') { closeModal(); closeCart(); }
    });

    // Modal qty + add
    var minus = $('#pmMinus'), plus = $('#pmPlus'), pmAdd = $('#pmAdd');
    if (minus) minus.addEventListener('click', function () {
      state.modalQty = Math.max(1, state.modalQty - 1);
      var q = $('#pmQty'); if (q) q.textContent = String(state.modalQty);
    });
    if (plus) plus.addEventListener('click', function () {
      state.modalQty = Math.min(99, state.modalQty + 1);
      var q = $('#pmQty'); if (q) q.textContent = String(state.modalQty);
    });
    if (pmAdd) pmAdd.addEventListener('click', function () {
      var p = findProduct(state.modalId);
      if (!p) return;
      addToCart(p, state.modalQty);
      closeModal();
      openCart();
    });

    // Overlays
    var mo = $('#modalOverlay');
    if (mo) mo.addEventListener('click', closeModal);
    var co = $('#cartOverlay');
    if (co) co.addEventListener('click', closeCart);

    // Search
    var searchInput = $('#shopSearch');
    if (searchInput) {
      var onMainSearch = debounce(function () {
        state.search = searchInput.value.trim();
        renderGrid();
      }, 180);
      searchInput.addEventListener('input', onMainSearch);
      searchInput.addEventListener('compositionend', onMainSearch);
    }

    // Cart checkout button
    var ckb = $('#cartCheckoutBtn');
    if (ckb) ckb.addEventListener('click', function () { closeCart(); });

    // Checkout form
    var form = $('#checkoutForm');
    if (form) form.addEventListener('submit', submitOrder);

    // Copy order id
    var copy = $('#copyOrderId');
    if (copy) copy.addEventListener('click', function () {
      var id = state.orderId || ($('#orderId') && $('#orderId').textContent) || '';
      if (!id) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(function () {
          copy.textContent = t('orders.id');
          setTimeout(function () { copy.textContent = t('orders.copy'); }, 1200);
        }).catch(function () { /* clipboard denied */ });
      }
    });

    // Router
    window.addEventListener('hashchange', route);
  }

  /* ---------- Boot ---------- */
  function boot() {
    /* NOTE: do NOT seed state.dicts.fr with CORE_FR here — that poisons the
       fetchLocale cache (early-return sees a truthy dict and never fetches the
       full fr.json), so switching back to FR only restored the 22 stub keys
       and the page stayed Arabic/English. CORE_FR now lives only as the
       last-resort fallback inside t(). */
    try { state.lang = localStorage.getItem(LANG_KEY) || 'fr'; } catch (e) { state.lang = 'fr'; }
    if (['fr', 'en', 'ar'].indexOf(state.lang) === -1) state.lang = 'fr';

    loadCart();
    updateBadges();

    applySettings();
    initTrustBar();
    fetchLocale(state.lang)
      .then(function () {
        applyStatic();
        bindEvents();
        route();
        renderGrid();
        renderCart();
        renderSummary();
        return loadProducts();
      })
      .then(function () {
        // products may change the grid + drawer contents
        renderGrid();
        renderCart();
        renderSummary();
        route();
      })
      .catch(function () {
        // last resort: never leave the page broken — but no fatate.loaded = true;
        state.offline = true;
        renderGrid();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
