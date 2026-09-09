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
  var FAVS_KEY = 'sm_favs2';
  var LANG_KEY = 'sm_lang2';
  var ORDER_KEY = 'sm_last_order2';
  var CATEGORIES = ['inspires', 'voiture', 'ambiance', 'musc'];

  /* ---------- State ---------- */
  var state = {
    lang: 'fr',
    dicts: {},          // lang -> flat key/value
    products: [],       // normalized products
    offline: false,     // true when DB fetch failed -> fallback products
    loaded: false,
    cart: [],           // [{id, productId, nameFr, nameEn, nameAr, price, image, qty}]
    favs: [],           // [product id]
    activeCat: 'all',
    search: '',
    favsOnly: false,
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
    'categories.inspires': 'Parfums Inspirés',
    'categories.voiture': 'Parfums pour Voiture',
    'categories.ambiance': "Parfums d'Ambiance",
    'categories.musc': 'Musc & Accessoires',
    'checkout.submitting': 'Envoi en cours…',
    'checkout.submit': 'Confirmer la commande',
    'orders.copy': 'Copier le numéro'
  };

  function has(key) {
    var d = state.dicts[state.lang];
    return !!(d && typeof d[key] === 'string');
  }

  function t(key, vars) {
    var d = state.dicts[state.lang] || {};
    var s = d[key];
    if (typeof s !== 'string') s = (state.dicts.fr || {})[key] || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
    }
    return s;
  }

  function fetchLocale(lang) {
    if (state.dicts[lang]) return Promise.resolve(state.dicts[lang]);
    return fetch('i18n/' + lang + '.json', { cache: 'force-cache' })
      .then(function (r) { if (!r.ok) throw new Error('i18n HTTP ' + r.status); return r.json(); })
      .then(function (json) { state.dicts[lang] = json; return json; })
      .catch(function () { state.dicts[lang] = state.dicts[lang] || {}; return state.dicts[lang]; });
  }

  function applyStatic() {
    $all('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (has(k)) el.textContent = t(k);
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
    if (si) si.setAttribute('placeholder', t('products.searchPlaceholder'));
  }

  function setLang(lang) {
    if (['fr', 'en', 'ar'].indexOf(lang) === -1) lang = 'fr';
    state.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }
    return fetchLocale(lang).then(function () {
      applyStatic();
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
      category: CATEGORIES.indexOf(r.category) !== -1 ? r.category : 'inspires',
      price: Number(r.price) || 0,
      oldPrice: r.old_price != null ? Number(r.old_price) : null,
      imageUrl: r.image_url || (r.images && r.images[0]) || '',
      stock: r.stock == null ? 10 : Number(r.stock),
      rating: r.rating != null ? Number(r.rating) : 5,
      reviewCount: r.review_count != null ? Number(r.review_count) : 0
    };
  }

  var FALLBACK_PRODUCTS = [
    {
      id: 'demo-oud-wood', sku: 'DEMO-001',
      nameFr: 'Oud Wood', nameEn: 'Oud Wood', nameAr: 'عود وود',
      descFr: 'Un oud riche et velouté, rehaussé d\'épices chaudes et de bois précieux.',
      descEn: 'Rich, velvety oud lifted by warm spices and precious woods.',
      descAr: 'عود غني ومخملي معلم بالتوابل الدافئة والأخشاب الفاخرة.',
      category: 'inspires', price: 49.9, oldPrice: null,
      imageUrl: 'i/new/p1.jpg',
      stock: 12, rating: 5, reviewCount: 104
    },
    {
      id: 'demo-jadore', sku: 'DEMO-002',
      nameFr: "J'adore", nameEn: "J'adore", nameAr: 'جادور',
      descFr: 'Bouquet floral lumineux : ylang-ylang, rose de mai et jasmin.',
      descEn: 'A luminous floral bouquet: ylang-ylang, May rose and jasmine.',
      descAr: 'باقة زهرية مشرقة: إيلانغ إيلانغ، وردة مايو وياسمين.',
      category: 'inspires', price: 49.9, oldPrice: null,
      imageUrl: 'i/new/p2.jpg',
      stock: 8, rating: 5, reviewCount: 83
    },
    {
      id: 'demo-bleu-chanel', sku: 'DEMO-003',
      nameFr: 'Bleu de Chanel', nameEn: 'Bleu de Chanel', nameAr: 'بلو دي شانيل',
      descFr: 'Aromatique et frais, entre agrumes, menthe et bois de cèdre.',
      descEn: 'Aromatic and fresh, built on citrus, mint and cedarwood.',
      descAr: 'عطري ومنعش بين الحمضيات والنعناع وخشب الأرز.',
      category: 'inspires', price: 49.9, oldPrice: null,
      imageUrl: 'i/new/p3.jpg',
      stock: 15, rating: 5, reviewCount: 75
    },
    {
      id: 'demo-bois-santal', sku: 'DEMO-004',
      nameFr: 'Bois de Santal', nameEn: 'Bois de Santal', nameAr: 'بوا دي سانتال',
      descFr: 'Santal crémeux et enveloppant, adouci de vanille et d\'ambre.',
      descEn: 'Creamy, enveloping sandalwood softened by vanilla and amber.',
      descAr: 'خشب الصندل الكريمي الدافئ مع الفانيليا والعنبر.',
      category: 'inspires', price: 49.9, oldPrice: null,
      imageUrl: 'i/new/p4.jpg',
      stock: 10, rating: 5, reviewCount: 77
    }
  ];

  function loadProducts() {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 9000) : null;
    var headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
    return fetch(SUPABASE_URL + '/rest/v1/products?active=eq.true&order=featured.desc,created_at.desc&select=*', {
      headers: headers,
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error('products HTTP ' + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (timer) clearTimeout(timer);
        if (!Array.isArray(rows) || rows.length === 0) throw new Error('empty products');
        state.products = rows.map(normalizeRow);
        state.offline = false;
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        state.products = FALLBACK_PRODUCTS.slice();
        state.offline = true;
      })
      .then(function () {
        state.loaded = true;
        var badge = $('#offlineBadge');
        if (badge) badge.hidden = !state.offline;
        renderGrid();
      });
  }

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
    return '<img src="' + esc(p.imageUrl) + '" alt="' + esc(pName(p)) + '" loading="lazy" ' +
      'onerror="this.outerHTML=\'<div class=&quot;media-fallback&quot; aria-hidden=&quot;true&quot;>' + initial + '</div>\'">';
  }

  /* ---------- Grid ---------- */
  function visibleProducts() {
    var list = state.products;
    if (state.favsOnly) {
      return list.filter(function (p) { return state.favs.indexOf(p.id) !== -1; });
    }
    if (state.activeCat !== 'all') {
      list = list.filter(function (p) { return p.category === state.activeCat; });
    }
    if (state.search) {
      var q = state.search.toLowerCase();
      list = list.filter(function (p) {
        return ['name_fr', 'name_en', 'name_ar', 'desc_fr', 'desc_en', 'desc_ar'].some(function (k) {
          return (p[k] || '').toLowerCase().indexOf(q) !== -1;
        }) || (p.sku || '').toLowerCase().indexOf(q) !== -1;
      });
    }
    return list;
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
      grid.innerHTML = sk;
      return;
    }

    var list = visibleProducts();
    if (!list.length) {
      grid.innerHTML = '<p class="grid-empty">' + esc(t('products.empty')) + '</p>';
      return;
    }

    grid.innerHTML = list.map(function (p) {
      var fav = state.favs.indexOf(p.id) !== -1;
      var old = p.oldPrice && p.oldPrice > p.price ? '<s class="old-price">' + esc(fmtPrice(p.oldPrice)) + '</s>' : '';
      return '<article class="product-card" data-id="' + esc(p.id) + '">' +
        '<div class="product-media" data-open="' + esc(p.id) + '" role="button" tabindex="0" aria-label="' + esc(pName(p)) + '">' +
        mediaHtml(p) +
        '<button class="wish-btn' + (fav ? ' active' : '') + '" type="button" data-fav="' + esc(p.id) + '" aria-pressed="' + fav + '">' +
        '<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21C7 16.5 3 13.3 3 9.5 3 7 5 5 7.5 5c1.7 0 3.2.9 4.5 2.6C13.3 5.9 14.8 5 16.5 5 19 5 21 7 21 9.5c0 3.8-4 7-9 11.5z"/></svg>' +
        '</button></div>' +
        '<div class="product-info">' +
        '<h3 class="product-name">' + esc(pName(p)) + '</h3>' +
        '<p class="product-sub">' + esc(t('categories.' + p.category)) + '</p>' +
        '<p class="product-price">' + old + esc(fmtPrice(p.price)) + '</p>' +
        '<p class="product-rating"><span class="stars">★★★★★</span> <span>(' + p.reviewCount + ')</span></p>' +
        '<button class="add-btn" type="button" data-add="' + esc(p.id) + '">' + esc(t('product.addToCart')) + '</button>' +
        '</div></article>';
    }).join('');
  }

  /* ---------- Wishlist ---------- */
  function loadFavs() {
    try { state.favs = JSON.parse(localStorage.getItem(FAVS_KEY) || '[]'); }
    catch (e) { state.favs = []; }
    if (!Array.isArray(state.favs)) state.favs = [];
  }

  function saveFavs() {
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(state.favs)); } catch (e) { /* noop */ }
  }

  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    if (i === -1) state.favs.push(id); else state.favs.splice(i, 1);
    saveFavs();
    renderGrid();
    $all('[data-fav="' + id.replace(/"/g, '\\"') + '"]').forEach(function (b) {
      var on = state.favs.indexOf(id) !== -1;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
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
  var DELIVERY_FEE = 8.0, FREE_SHIPPING_MIN = 80.0;
  function deliveryFee(total) {
    return total > 0 && total < FREE_SHIPPING_MIN ? DELIVERY_FEE : 0;
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
    ['cartCount', 'tabCartCount'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }

  function cartItemName(it) {
    return it['name' + cap(state.lang)] || it.nameFr || '—';
  }

  function renderCart() {
    var wrap = $('#cartItems');
    var foot = $('#cartFoot');
    var countEl = $('#cartDrawerCount');
    if (!wrap) return;

    var n = cartCount();
    if (countEl) countEl.textContent = n > 0 ? t('cart.items', { n: n }) : '';

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

  /* ---------- Product modal ---------- */
  function openModal(id) {
    var p = findProduct(id);
    if (!p) return;
    state.modalId = id;
    state.modalQty = 1;
    renderModalTexts();
    var m = $('#productModal'), ov = $('#modalOverlay');
    if (m) { m.hidden = false; m.classList.add('open'); }
    if (ov) ov.hidden = false;
    document.documentElement.classList.add('lock');
  }

  function renderModalTexts() {
    if (!state.modalId) return;
    var p = findProduct(state.modalId);
    var m = $('#productModal');
    if (!p || !m) { closeModal(); return; }
    var media = $('#pmMedia');
    if (media) media.innerHTML = mediaHtml(p);
    var set = function (id2, val) { var el = document.getElementById(id2); if (el) el.textContent = val; };
    set('pmCat', t('categories.' + p.category));
    set('pmName', pName(p));
    set('pmPrice', fmtPrice(p.price));
    var old = $('#pmOldPrice');
    if (old) {
      if (p.oldPrice && p.oldPrice > p.price) { old.textContent = fmtPrice(p.oldPrice); old.hidden = false; }
      else old.hidden = true;
    }
    set('pmQty', String(state.modalQty));
    var rating = $('#pmRating');
    if (rating) rating.innerHTML = '<span class="stars">★★★★★</span> <span>(' + p.reviewCount + ' ' + esc(t('product.reviews')) + ')</span>';
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
    if (m) { m.classList.remove('open'); m.hidden = true; }
    if (ov) ov.hidden = true;
    if (!drawerOpen()) document.documentElement.classList.remove('lock');
  }

  /* ---------- Cart drawer ---------- */
  function drawerOpen() {
    var d = $('#cartDrawer');
    return !!(d && d.classList.contains('open'));
  }

  function openCart() {
    var d = $('#cartDrawer'), ov = $('#cartOverlay');
    if (d) { d.hidden = false; d.classList.add('open'); }
    if (ov) ov.hidden = false;
    document.documentElement.classList.add('lock');
  }

  function closeCart() {
    var d = $('#cartDrawer'), ov = $('#cartOverlay');
    if (d) { d.classList.remove('open'); d.hidden = true; }
    if (ov) ov.hidden = true;
    if (!state.modalId) document.documentElement.classList.remove('lock');
  }

  /* ---------- Views / routing ---------- */
  function showView(name) {
    var views = { shop: 'view-shop', checkout: 'view-checkout', confirm: 'view-confirm' };
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

    fetch(SUPABASE_URL + '/rest/v1/orders', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        address: address || null,
        city: city || null,
        notes: notes || null,
        items: items,
        total: total
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

  function setTab(cat) {
    state.favsOnly = false;
    state.activeCat = cat;
    $all('.cat-tab').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === cat);
    });
    renderGrid();
  }

  function setTabbarActive(key) {
    $all('.tab-item').forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-tabnav') === key);
    });
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    // Language buttons (header + mobile menu)
    $all('.lang-btn').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });

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
        if (k === 'home') { showView('shop'); setTabbarActive('home'); location.hash = '#/shop'; window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
      var tab = e.target.closest('.cat-tab');
      if (tab) { setTab(tab.getAttribute('data-tab')); return; }

      var fav = e.target.closest('[data-fav]');
      if (fav) { e.stopPropagation(); toggleFav(fav.getAttribute('data-fav')); return; }

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

    // Category strip items
    $all('.category-item').forEach(function (item) {
      item.addEventListener('click', function () {
        setTab(item.getAttribute('data-cat'));
        scrollToId('parfums');
      });
    });

    // See all
    var seeAll = $('#seeAllBtn');
    if (seeAll) seeAll.addEventListener('click', function () { setTab('all'); scrollToId('parfums'); });

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

    // Tabbar
    $all('.tab-item').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var k = a.getAttribute('data-tabnav');
        if (k === 'cart') { e.preventDefault(); openCart(); return; }
        if (k === 'favs') {
          e.preventDefault();
          showView('shop');
          state.favsOnly = true;
          $all('.cat-tab').forEach(function (b) { b.classList.remove('active'); });
          renderGrid();
          setTabbarActive('favs');
          scrollToId('parfums');
          return;
        }
        if (k === 'collections') { e.preventDefault(); setTabbarActive('collections'); scrollToId('collections'); return; }
        setTabbarActive('home');
      });
    });

    // Search
    var searchInput = $('#shopSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.search = searchInput.value.trim();
        renderGrid();
      });
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

    // Newsletter (no backend — just prevent default)
    var nl = $('#newsletterForm');
    if (nl) nl.addEventListener('submit', function (e) { e.preventDefault(); nl.reset(); });

    // Router
    window.addEventListener('hashchange', route);
  }

  /* ---------- Boot ---------- */
  function boot() {
    state.dicts.fr = Object.assign({}, CORE_FR);
    try { state.lang = localStorage.getItem(LANG_KEY) || 'fr'; } catch (e) { state.lang = 'fr'; }
    if (['fr', 'en', 'ar'].indexOf(state.lang) === -1) state.lang = 'fr';

    loadCart();
    loadFavs();
    updateBadges();

    fetchLocale(state.lang)
      .then(function () {
        applyStatic();
        bindEvents();
        setTabbarActive('home');
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
        // last resort: never leave the page broken
        state.products = FALLBACK_PRODUCTS.slice();
        state.offline = true;
        state.loaded = true;
        var badge = $('#offlineBadge');
        if (badge) badge.hidden = false;
        renderGrid();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
