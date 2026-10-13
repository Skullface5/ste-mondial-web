/* ============================================================
   STE — admin variant editor
   Ported from rosa-admin-variants.js for ste palette + bucket.
   Storage bucket: products (ste's bucket, not rosa's product-images)
   ============================================================ */
(function () {
  'use strict';

  var CSS = [
    '.variants-admin{display:flex;flex-direction:column;gap:.5rem;}',
    '.variants-admin .var-row{display:flex;flex-direction:column;gap:.4rem;padding:.6rem;border:1px solid rgba(176,141,74,.12);border-radius:14px;background:#FAF6EE;}',
    '.variants-admin .var-line{display:grid;grid-template-columns:1.1fr .7fr .7fr .55fr 34px;gap:.4rem;align-items:center;}',
    '.variants-admin .var-line input{width:100%;padding:.55rem .7rem;border:1px solid rgba(176,141,74,.2);border-radius:12px;background:#fff;color:var(--charcoal,#2B1D12);font-size:.82rem;font-family:inherit;}',
    '.variants-admin .var-line input:focus{outline:none;border-color:var(--gold,#B08D4A);}',
    '.variants-admin .var-line input::placeholder{color:var(--text-mid,#8A7A66);font-size:.72rem;}',
    '.variants-admin .var-imgs{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;min-height:44px;padding:.35rem;border:1px dashed rgba(176,141,74,.4);border-radius:12px;}',
    '.variants-admin .var-img-item{position:relative;width:44px;height:44px;flex:0 0 auto;}',
    '.variants-admin .var-img-thumb{width:44px;height:44px;object-fit:cover;border-radius:9px;border:1px solid rgba(176,141,74,.2);display:block;}',
    '.variants-admin .var-img-x{position:absolute;top:-6px;inset-inline-end:-6px;width:18px;height:18px;border-radius:50%;background:#b34545;color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.55rem;line-height:1;}',
    '.variants-admin .var-img-btn{width:44px;height:44px;border:1px dashed rgba(176,141,74,.4);border-radius:9px;background:none;color:var(--text-mid,#8A7A66);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.9rem;transition:color .2s,border-color .2s;}',
    '.variants-admin .var-img-btn:hover{color:var(--gold,#B08D4A);border-color:var(--gold,#B08D4A);}',
    '.variants-admin .var-del{width:34px;height:34px;border:1px solid rgba(176,141,74,.2);border-radius:12px;background:none;color:var(--text-mid,#8A7A66);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s,border-color .2s;}',
    '.variants-admin .var-del:hover{color:#b34545;border-color:#b34545;}',
    '.variants-add{margin-top:.5rem;background:none;border:1px dashed rgba(176,141,74,.4);border-radius:12px;padding:.5rem .9rem;color:var(--gold,#B08D4A);font-size:.78rem;cursor:pointer;font-family:inherit;transition:border-color .2s,background-color .2s;}',
    '.variants-add:hover{border-color:var(--gold,#B08D4A);background:rgba(176,141,74,.06);}',
    '.variants-admin .var-empty{font-size:.75rem;color:var(--text-mid,#8A7A66);font-style:italic;}',
    '@media (max-width:560px){.variants-admin .var-line{grid-template-columns:1fr 1fr;grid-auto-rows:auto;}.variants-admin .var-line .var-del{grid-column:2;justify-self:end;}}'
  ].join('');

  function inject() {
    if (document.getElementById('steAdminVariantCss')) return;
    var s = document.createElement('style');
    s.id = 'steAdminVariantCss';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function esc(v) { return v == null ? '' : String(v).replace(/[&<>\"]/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]; }); }

  function normalizeImages(v) {
    if (window.SteVariants && window.SteVariants.normalizeImages) return window.SteVariants.normalizeImages(v);
    if (v == null || v === '') return [];
    var arr = v;
    if (typeof arr === 'string') {
      var s = arr.trim();
      if (s.charAt(0) === '[') { try { arr = JSON.parse(s); } catch (e) { arr = [s]; } } else arr = [s];
    }
    if (!Array.isArray(arr)) return [];
    var out = [];
    arr.forEach(function (u) { if (u != null && String(u).trim()) out.push(String(u).trim()); });
    return out;
  }

  function rowHtml(v) {
    v = v || {};
    var price = (v.price == null || v.price === '') ? '' : v.price;
    var qty = (v.quantity == null || v.quantity === '') ? '' : v.quantity;
    var oldPrice = (v.old_price == null || v.old_price === '') ? '' : v.old_price;
    var imgs = normalizeImages(v.images != null ? v.images : v.image);
    var thumbs = imgs.map(function (u) {
      return '<span class="var-img-item">' +
        '<img class="var-img-thumb" src="' + esc(u) + '" alt="">' +
        '<input type="hidden" class="var-img-url" value="' + esc(u) + '">' +
        '<button type="button" class="var-img-x var-img-remove" title="Retirer"><i class="fas fa-times"></i></button>' +
        '</span>';
    }).join('');
    return '<div class="var-row">' +
      '<div class="var-line">' +
      '<input type="text" class="var-label" placeholder="100ml" autocomplete="off" value="' + esc(v.label) + '">' +
      '<input type="number" class="var-price" step="0.001" min="0" placeholder="Prix" value="' + esc(price) + '">' +
      '<input type="number" class="var-oldprice" step="0.001" min="0" placeholder="Ancien prix" value="' + esc(oldPrice) + '">' +
      '<input type="number" class="var-qty" step="1" min="0" placeholder="Stock" value="' + esc(qty) + '">' +
      '<button type="button" class="var-del" title="Supprimer"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div class="var-imgs">' +
      thumbs +
      '<button type="button" class="var-img-btn var-img-pick" title="Ajouter des photos"><i class="fas fa-plus"></i></button>' +
      '<input type="file" class="var-img-input" accept="image/*" multiple hidden>' +
      '</div>' +
      '</div>';
  }

  function ensureEmpty(listEl) {
    if (!listEl) return;
    var rows = listEl.querySelectorAll('.var-row');
    var empty = listEl.querySelector('.var-empty');
    if (rows.length === 0 && !empty) {
      listEl.insertAdjacentHTML('beforeend', '<div class="var-empty">—</div>');
    } else if (rows.length > 0 && empty) {
      empty.remove();
    }
  }

  function bindDelegates(listEl) {
    if (!listEl || listEl.__steBound) return;
    listEl.__steBound = true;
    listEl.addEventListener('click', function (e) {
      var del = e.target.closest('.var-del');
      if (del) {
        var row = del.closest('.var-row');
        if (row) row.remove();
        ensureEmpty(listEl);
        return;
      }
      var pick = e.target.closest('.var-img-pick');
      if (pick) {
        var inp = pick.parentNode.querySelector('.var-img-input');
        if (inp) { inp.dataset.picked = '1'; inp.click(); }
        return;
      }
      var rm = e.target.closest('.var-img-remove');
      if (rm) {
        var item = rm.closest('.var-img-item');
        if (item) item.remove();
        return;
      }
    });
    listEl.addEventListener('change', function (e) {
      var inp = e.target;
      if (!inp.classList || !inp.classList.contains('var-img-input')) return;
      if (!inp.dataset.picked) return;
      inp.dataset.picked = '';
      var files = inp.files;
      if (!files || !files.length) return;
      Array.prototype.forEach.call(files, function (f) { uploadVariantImage(inp, f); });
      inp.value = '';
    });
  }

  function uploadVariantImage(inputEl, file) {
    var row = inputEl.closest('.var-row');
    var strip = row ? row.querySelector('.var-imgs') : null;
    var sb = window.__steSupabase || window.supabase;
    if (!sb) { alert('Supabase non initialisé'); return; }

    compress(file, function (blob, ext) {
      var slug = 'variant';
      var labelInput = row ? row.querySelector('.var-label') : null;
      if (labelInput && labelInput.value) slug = labelInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20) || 'variant';
      var path = 'admin/variants/' + slug + '-' + Date.now() + '-' + Math.floor(Math.random() * 1e4) + '.' + ext;
      sb.storage.from('products').upload(path, blob, { contentType: 'image/' + ext, upsert: true })
        .then(function (r) {
          if (r && r.error) { alert('Upload échoué: ' + r.error.message); return; }
          var pub = sb.storage.from('products').getPublicUrl(path);
          appendThumb(strip, pub.data.publicUrl);
        })
        .catch(function (err) { alert('Upload échoué: ' + err); });
    });
  }

  function appendThumb(strip, url) {
    if (!strip) return;
    var btn = strip.querySelector('.var-img-pick');
    var html = '<span class="var-img-item">' +
      '<img class="var-img-thumb" src="' + esc(url) + '" alt="">' +
      '<input type="hidden" class="var-img-url" value="' + esc(url) + '">' +
      '<button type="button" class="var-img-x var-img-remove" title="Retirer"><i class="fas fa-times"></i></button>' +
      '</span>';
    if (btn) btn.insertAdjacentHTML('beforebegin', html);
    else strip.insertAdjacentHTML('beforeend', html);
  }

  function compress(file, done) {
    try {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        try {
          var w = img.width, h = img.height;
          if (Math.max(w, h) > 1000) { var k = 1000 / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          c.toBlob(function (b) {
            if (b && b.type === 'image/webp') done(b, 'webp');
            else done(file, (file.name.split('.').pop() || 'jpg').toLowerCase());
          }, 'image/webp', 0.82);
        } catch (e) { done(file, (file.name.split('.').pop() || 'jpg').toLowerCase()); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); done(file, (file.name.split('.').pop() || 'jpg').toLowerCase()); };
      img.src = url;
    } catch (e) { done(file, (file.name.split('.').pop() || 'jpg').toLowerCase()); }
  }

  var API = {
    inject: inject,

    mount: function (listEl, addBtn) {
      inject();
      if (!listEl) return;
      bindDelegates(listEl);
      if (addBtn && !addBtn.__steBound) {
        addBtn.__steBound = true;
        addBtn.addEventListener('click', function () { API.addRow(listEl); });
      }
      listEl.__steMounted = true;
      ensureEmpty(listEl);
    },

    addRow: function (listEl, v) {
      if (!listEl) return;
      var empty = listEl.querySelector('.var-empty');
      if (empty) empty.remove();
      listEl.insertAdjacentHTML('beforeend', rowHtml(v));
      var rows = listEl.querySelectorAll('.var-row');
      var last = rows[rows.length - 1];
      var inp = last && last.querySelector('.var-label');
      if (inp) inp.focus();
    },

    setRows: function (listEl, variants) {
      if (!listEl) return;
      inject();
      listEl.innerHTML = '';
      (variants || []).forEach(function (v) { listEl.insertAdjacentHTML('beforeend', rowHtml(v)); });
      ensureEmpty(listEl);
    },

    readRows: function (listEl) {
      if (!listEl) return [];
      var out = [];
      listEl.querySelectorAll('.var-row').forEach(function (row) {
        var label = (row.querySelector('.var-label').value || '').trim();
        if (!label) return;
        var pRaw = row.querySelector('.var-price').value;
        var qRaw = row.querySelector('.var-qty').value;
        var opRaw = row.querySelector('.var-oldprice') ? row.querySelector('.var-oldprice').value : '';
        var imgs = [];
        row.querySelectorAll('.var-img-url').forEach(function (u) {
          var val = (u.value || '').trim();
          if (val) imgs.push(val);
        });
        var price = (pRaw === '' || pRaw == null) ? null : parseFloat(pRaw);
        var qty = (qRaw === '' || qRaw == null) ? null : parseInt(qRaw, 10);
        var oldPrice = (opRaw === '' || opRaw == null) ? null : parseFloat(opRaw);
        if (oldPrice != null && (!isFinite(oldPrice) || (price != null && oldPrice <= price))) oldPrice = null;
        out.push({
          label: label,
          price: (price != null && isFinite(price)) ? price : null,
          quantity: (qty != null && isFinite(qty)) ? qty : null,
          old_price: oldPrice,
          images: imgs.length ? imgs : null
        });
      });
      return out;
    }
  };

  inject();
  window.SteAdminVariants = API;

  function autoMount() {
    var pairs = [
      ['eVariantsList', 'eAddVariantBtn'],
      ['variantsList', 'addVariantBtn']
    ];
    pairs.forEach(function (ids) {
      var list = document.getElementById(ids[0]);
      if (!list) return;
      var btn = document.getElementById(ids[1]);
      API.mount(list, btn);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
    else autoMount();
    window.addEventListener('load', autoMount);
    var __t = setInterval(autoMount, 500);
    setTimeout(function () { clearInterval(__t); }, 30000);
  }
})();