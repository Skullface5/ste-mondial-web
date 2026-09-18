/* ============================================================
   STE Mondial - account.js (customer accounts)
   Standalone IIFE. Auth via Supabase Auth REST (no deps).
   Integration: app2.js reads the SM_AUTH global at checkout.
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';
  var USER_KEY = 'sm_user2';

  /* ---------- tiny helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function smLang() {
    var l = document.documentElement.lang || 'fr';
    return ['fr', 'en', 'ar'].indexOf(l) !== -1 ? l : 'fr';
  }
  function locale() {
    var l = smLang();
    return l === 'ar' ? 'ar-TN' : (l === 'en' ? 'en-GB' : 'fr-TN');
  }
  var LANGS = {
    fr: {
      'account.cancelBtn': 'Annuler la commande', 'account.cancelConfirm': 'Annuler cette commande ?',
      'account.cancelOk': 'Commande annul\u00e9e.', 'account.cancelFail': "Impossible d'annuler la commande.",
      'account.status.nouvelle': 'Nouvelle', 'account.status.confirmee': 'Confirm\u00e9e',
      'account.status.expediee': 'Exp\u00e9di\u00e9e', 'account.status.livree': 'Livr\u00e9e', 'account.status.annulee': 'Annul\u00e9e'
    },
    en: {
      'account.cancelBtn': 'Cancel order', 'account.cancelConfirm': 'Cancel this order?',
      'account.cancelOk': 'Order cancelled.', 'account.cancelFail': 'Could not cancel the order.',
      'account.status.nouvelle': 'New', 'account.status.confirmee': 'Confirmed',
      'account.status.expediee': 'Shipped', 'account.status.livree': 'Delivered', 'account.status.annulee': 'Cancelled'
    },
    ar: {
      'account.cancelBtn': '\u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628', 'account.cancelConfirm': '\u0625\u0644\u063a\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628\u061f',
      'account.cancelOk': '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628.', 'account.cancelFail': '\u062a\u0639\u0630\u0631 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u0637\u0644\u0628.',
      'account.status.nouvelle': '\u062c\u062f\u064a\u062f\u0629', 'account.status.confirmee': '\u0645\u0624\u0643\u062f\u0629',
      'account.status.expediee': '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646', 'account.status.livree': '\u062a\u0645 \u0627\u0644\u062a\u0648\u0635\u064a\u0644', 'account.status.annulee': '\u0645\u0644\u063a\u0627\u0629'
    }
  };
  function t(key) {
    try {
      if (window.SM_I18N && typeof window.SM_I18N.t === 'function') {
        var s = window.SM_I18N.t(key);
        if (s && s !== key) return s;
      }
    } catch (e) { /* noop */ }
    var L = LANGS[smLang()] || LANGS.fr;
    if (Object.prototype.hasOwnProperty.call(L, key)) return L[key];
    var FB = {
      'account.title': 'Mon compte', 'account.tabLogin': 'Connexion', 'account.tabSignup': 'Créer un compte',
      'account.email': 'Email', 'account.password': 'Mot de passe', 'account.fullName': 'Nom complet',
      'account.phone': 'Téléphone', 'account.login': 'Se connecter', 'account.signup': 'Créer mon compte',
      'account.logout': 'Déconnexion', 'account.hello': 'Bonjour', 'account.member': 'Client depuis',
      'account.orders': 'Mes commandes', 'account.noOrders': 'Aucune commande pour le moment.',
      'account.orderNum': 'Commande', 'account.total': 'Total', 'account.items': 'article(s)',
      'account.profile': 'Mes informations', 'account.saveProfile': 'Enregistrer', 'account.loading': 'Chargement…',
      'account.errFields': 'Email et mot de passe requis.', 'account.errEmail': 'Email invalide.',
      'account.errPass': 'Mot de passe : 6 caractères minimum.', 'account.errName': 'Le nom est requis.',
      'account.errCreds': 'Email ou mot de passe incorrect.', 'account.errExists': 'Un compte existe déjà avec cet email.',
      'account.errGeneric': 'Erreur : ',
      'account.cancelBtn': 'Annuler la commande', 'account.cancelConfirm': 'Annuler cette commande ?',
      'account.cancelOk': 'Commande annul\u00e9e.', 'account.cancelFail': "Impossible d'annuler la commande."
    };
    return FB[key] || key;
  }
  function fmtDT(n) {
    var v = Number(n) || 0;
    return v.toFixed(3).replace(/\.?0+$/, '') + ' DT';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function showMsg(el, text, ok) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('ok', !!ok);
    el.hidden = !text;
  }

  /* ---------- auth session ---------- */
  var session = null;
  var user = null;
  var profile = { full_name: '', phone: '' };
  var listeners = [];

  function saveLocal() {
    try {
      if (user && session) {
        localStorage.setItem(USER_KEY, JSON.stringify({
          id: user.id, email: user.email, created: user.created_at,
          name: (user.user_metadata && user.user_metadata.full_name) || profile.full_name || '',
          refresh: session.refresh_token || ''
        }));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) { /* noop */ }
  }
  function cachedUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
  }

  function apiToken() {
    return session && session.access_token ? session.access_token : SUPABASE_KEY;
  }

  function restFetch(path, method, body, prefer) {
    return fetch(SUPABASE_URL + path, {
      method: method || 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + apiToken(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': prefer || 'return=representation'
      },
      body: body ? JSON.stringify(body) : undefined
    });
  }

  function refreshSession() {
    if (!session || !session.refresh_token) return Promise.resolve(null);
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function (r) {
      if (!r.ok) throw new Error('refresh failed');
      return r.json();
    }).then(function (j) {
      session = j; user = j.user; saveLocal();
      loadProfile();
      return user;
    }).catch(function () {
      session = null; user = null; profile = { full_name: '', phone: '' }; saveLocal();
      return null;
    });
  }

  function loadProfile() {
    if (!user) return;
    restFetch('/rest/v1/profiles?id=eq.' + user.id + '&select=full_name,phone', 'GET')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rows) {
        if (rows && rows.length) profile = { full_name: rows[0].full_name || '', phone: rows[0].phone || '' };
      })
      .catch(function () { /* optional */ });
  }

  function getUser() { return user; }
  function onUser(fn) { listeners.push(fn); if (user) fn(user); }
  function emit() { listeners.forEach(function (fn) { try { fn(user); } catch (e) { /* noop */ } }); }

  /* ---------- UI: drawer ---------- */
  var built = false;

  function buildDrawer() {
    if (built) return;
    built = true;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="overlay" id="accountOverlay" hidden></div>' +
      '<aside class="cart-drawer account-drawer" id="accountDrawer" role="dialog" aria-modal="true" hidden>' +
      '  <div class="cart-head">' +
      '    <h2 data-i18n="account.title">' + esc(t('account.title')) + '</h2>' +
      '    <button class="icon-btn" type="button" data-close="account" aria-label="close">' +
      '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
      '    </button>' +
      '  </div>' +
      '  <div class="cart-body account-body" id="accountBody"></div>' +
      '</aside>';
    document.body.appendChild(wrap);
  }

  function openDrawer() {
    buildDrawer();
    render();
    var d = $('#accountDrawer'), ov = $('#accountOverlay');
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
  function closeDrawer() {
    var d = $('#accountDrawer'), ov = $('#accountOverlay');
    if (ov) ov.classList.remove('open');
    if (d) {
      d.classList.remove('open');
      setTimeout(function () {
        if (!d.classList.contains('open')) d.hidden = true;
        if (!ov.classList.contains('open')) ov.hidden = true;
      }, 320);
    } else if (ov) {
      ov.hidden = true;
    }
    document.documentElement.classList.remove('lock');
  }

  /* ---------- renders ---------- */
  function render() {
    var body = $('#accountBody');
    if (!body) return;
    if (user) renderAccount(body);
    else renderAuth(body);
  }

  function renderAuth(root) {
    root.innerHTML =
      '<div class="acct-tabs">' +
      '  <button type="button" class="acct-tab active" data-acct-tab="login">' + esc(t('account.tabLogin')) + '</button>' +
      '  <button type="button" class="acct-tab" data-acct-tab="signup">' + esc(t('account.tabSignup')) + '</button>' +
      '</div>' +
      '<form id="acctLoginForm" class="acct-form" novalidate>' +
      '  <label class="acct-label" for="acctEmail">' + esc(t('account.email')) + '</label>' +
      '  <input class="acct-input" id="acctEmail" type="email" autocomplete="email" inputmode="email">' +
      '  <label class="acct-label" for="acctPass">' + esc(t('account.password')) + '</label>' +
      '  <input class="acct-input" id="acctPass" type="password" autocomplete="current-password">' +
      '  <p class="acct-msg" id="acctLoginMsg" hidden></p>' +
      '  <button class="btn-gold btn-block" type="submit">' + esc(t('account.login')) + '</button>' +
      '</form>' +
      '<form id="acctSignupForm" class="acct-form" hidden novalidate>' +
      '  <label class="acct-label" for="suName">' + esc(t('account.fullName')) + '</label>' +
      '  <input class="acct-input" id="suName" type="text" autocomplete="name">' +
      '  <label class="acct-label" for="suEmail">' + esc(t('account.email')) + '</label>' +
      '  <input class="acct-input" id="suEmail" type="email" autocomplete="email" inputmode="email">' +
      '  <label class="acct-label" for="suPass">' + esc(t('account.password')) + '</label>' +
      '  <input class="acct-input" id="suPass" type="password" autocomplete="new-password">' +
      '  <label class="acct-label" for="suPhone">' + esc(t('account.phone')) + '</label>' +
      '  <input class="acct-input" id="suPhone" type="tel" inputmode="tel" autocomplete="tel">' +
      '  <p class="acct-msg" id="acctSignupMsg" hidden></p>' +
      '  <button class="btn-gold btn-block" type="button" id="acctSignupBtn">' + esc(t('account.signup')) + '</button>' +
      '</form>';
  }

  function renderAccount(root) {
    var since = user.created_at ? new Date(user.created_at) : null;
    var sinceTxt = since ? since.toLocaleDateString(locale()) : '';
    var name = profile.full_name || (user.user_metadata && user.user_metadata.full_name) || user.email || '';
    var initial = (name || '?').charAt(0).toUpperCase();
    root.innerHTML =
      '<div class="acct-hello">' +
      '  <div class="acct-avatar">' + esc(initial) + '</div>' +
      '  <div class="acct-hello-txt">' +
      '    <div class="acct-name">' + esc(t('account.hello') + ', ' + name) + '</div>' +
      '    <div class="acct-sub">' + esc(t('account.member') + ' ' + sinceTxt) + '</div>' +
      '  </div>' +
      '  <button class="acct-logout" type="button" id="acctLogout">' + esc(t('account.logout')) + '</button>' +
      '</div>' +
      '<details class="acct-details">' +
      '  <summary>' + esc(t('account.profile')) + '</summary>' +
      '  <div class="acct-details-body">' +
      '    <form id="acctProfileForm" class="acct-form" novalidate>' +
      '      <label class="acct-label" for="prName">' + esc(t('account.fullName')) + '</label>' +
      '      <input class="acct-input" id="prName" value="' + esc(profile.full_name) + '">' +
      '      <label class="acct-label" for="prPhone">' + esc(t('account.phone')) + '</label>' +
      '      <input class="acct-input" id="prPhone" type="tel" inputmode="tel" value="' + esc(profile.phone) + '">' +
      '      <p class="acct-msg" id="acctProfileMsg" hidden></p>' +
      '      <button class="btn-ghost btn-block" type="submit">' + esc(t('account.saveProfile')) + '</button>' +
      '    </form>' +
      '  </div>' +
      '</details>' +
      '<h3 class="acct-sec-title">' + esc(t('account.orders')) + '</h3>' +
      '<div id="acctOrders"><p class="acct-empty">' + esc(t('account.loading')) + '</p></div>';
    loadOrders();
  }

  function statusLabel(st) { return t('account.status.' + String(st || 'nouvelle')); }

  function loadOrders() {
    if (!user) return;
    var qs = '/rest/v1/orders?user_id=eq.' + user.id +
      '&select=id,created_at,total,status,items,customer_email&order=created_at.desc&limit=20';
    restFetch(qs, 'GET')
      .then(function (r) {
        if (r.status === 401) {
          return refreshSession().then(function (u2) {
            return u2 ? restFetch(qs, 'GET') : null;
          });
        }
        return r;
      })
      .then(function (r) { return r && r.ok ? r.json() : []; })
      .then(function (rows) {
        var box = $('#acctOrders');
        if (!box) return;
        if (!rows || !rows.length) {
          box.innerHTML = '<p class="acct-empty">' + esc(t('account.noOrders')) + '</p>';
          return;
        }
        box.innerHTML = rows.map(orderCard).join('');
        ORDERS_REFRESH = function () { loadOrders(); };
      })
      .catch(function () {
        var box = $('#acctOrders');
        if (box) box.innerHTML = '<p class="acct-empty">' + esc(t('account.noOrders')) + '</p>';
      });
  }

  function orderCard(o) {
    var st = String(o.status || 'nouvelle');
    var n = (o.items && o.items.length) || 0;
    var d = o.created_at ? new Date(o.created_at) : null;
    var dt = d ? d.toLocaleDateString(locale()) + ' ' + d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) : '';
    var itemsHtml = '';
    if (o.items && o.items.length) {
      itemsHtml = '<div class="acct-order-items">' + o.items.map(function (it) {
        var q = Number(it.qty) || 1;
        return '<span class="acct-order-item">' + esc(String(it.name || '')) + ' \u00d7 ' + q + '</span>';
      }).join('') + '</div>';
    }
    var canCancel = st === 'nouvelle';
    return '<div class="acct-order">' +
      '<div class="acct-order-top">' +
      '<span class="acct-order-id">' + esc(t('account.orderNum')) + ' #' + esc(String(o.id).slice(0, 8)) + '</span>' +
      '<span class="acct-order-status st-' + esc(st) + '">' + esc(statusLabel(st)) + '</span>' +
      '</div>' +
      '<div class="acct-order-mid"><span>' + esc(fmtDT(o.total)) + '</span><span>' + n + ' ' + esc(t('account.items')) + '</span><span>' + esc(dt) + '</span></div>' +
      itemsHtml +
      (canCancel ? '<div class="acct-order-actions"><button type="button" class="acct-cancel-btn" data-cancel-order="' + esc(String(o.id)) + '">' + esc(t('account.cancelBtn')) + '</button></div>' : '') +
      '</div>';
  }

  function acctToast(msg) {
    var d = document.createElement('div');
    d.className = 'acct-toast';
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(function () { d.classList.add('show'); }, 10);
    setTimeout(function () { d.classList.remove('show'); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 300); }, 2600);
  }

  function cancelMyOrder(orderId, btn) {
    if (!confirm(t('account.cancelConfirm'))) return;
    var restore = function () { if (btn) { btn.disabled = false; btn.textContent = t('account.cancelBtn'); } };
    if (btn) { btn.disabled = true; btn.textContent = '\u2026'; }
    restFetch('/rest/v1/orders?id=eq.' + encodeURIComponent(orderId), 'PATCH', { status: 'annulee' }, 'return=representation')
      .then(function (r) {
        if (r.status === 401) {
          return refreshSession().then(function (u2) {
            return u2 ? restFetch('/rest/v1/orders?id=eq.' + encodeURIComponent(orderId), 'PATCH', { status: 'annulee' }, 'return=representation') : null;
          });
        }
        return r;
      })
      .then(function (r) {
        if (r && r.ok) { acctToast(t('account.cancelOk')); loadOrders(); }
        else restore();
      })
      .catch(function () { restore(); });
  }

  var ORDERS_REFRESH = null;
  function refreshOrders() { if (ORDERS_REFRESH) ORDERS_REFRESH(); }

/* ---------- actions ---------- */
  function doLogin(email, pass, msg, btn) {
    if (btn) btn.disabled = true;
    fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass, gotrue_meta_security: {} })
    })
      .then(function (r) {
        if (r.status === 400) throw new Error('CREDS');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        session = j; user = j.user; saveLocal();
        loadProfile();
        render();
        emit();
      })
      .catch(function (err) {
        showMsg(msg, err.message === 'CREDS' ? t('account.errCreds') : t('account.errGeneric') + err.message);
      })
      .then(function () { if (btn) btn.disabled = false; });
  }

  function doSignup(name, email, pass, phone, msg, btn) {
    if (btn) btn.disabled = true;
    fetch(SUPABASE_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass, data: { full_name: name, phone: phone }, gotrue_meta_security: {} })
    })
      .then(function (r) {
        if (r.status === 422) throw new Error('EXISTS');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        session = j; user = j.user; saveLocal();
        profile = { full_name: name || '', phone: phone || '' };
        return upsertProfile(name, phone);
      })
      .then(function () {
        render();
        emit();
      })
      .catch(function (err) {
        showMsg(msg, err.message === 'EXISTS' ? t('account.errExists') : t('account.errGeneric') + err.message);
      })
      .then(function () { if (btn) btn.disabled = false; });
  }

  function doLogout() {
    var tok = session && session.access_token;
    session = null; user = null; profile = { full_name: '', phone: '' }; saveLocal();
    if (tok) {
      fetch(SUPABASE_URL + '/auth/v1/logout', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
        body: '{}'
      }).catch(function () { /* noop */ });
    }
    render();
    emit();
  }

  function upsertProfile(name, phone) {
    if (!user) return Promise.resolve();
    return restFetch('/rest/v1/profiles?on_conflict=id', 'POST',
      { id: user.id, full_name: name || null, phone: phone || null },
      'resolution=merge-duplicates,return=minimal')
      .then(function (r) { if (r.ok) profile = { full_name: name || '', phone: phone || '' }; })
      .catch(function () { /* optional */ });
  }

  function submitSignup() {
    var nm = ($('#suName') || {}).value || '';
    var em = ($('#suEmail') || {}).value || '';
    var pw = ($('#suPass') || {}).value || '';
    var ph = ($('#suPhone') || {}).value || '';
    var m2 = $('#acctSignupMsg');
    var b2 = $('#acctSignupBtn');
    if (!em || !pw) { showMsg(m2, t('account.errFields')); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { showMsg(m2, t('account.errEmail')); return; }
    if (pw.length < 6) { showMsg(m2, t('account.errPass')); return; }
    showMsg(m2, '');
    doSignup(nm.trim(), em.trim(), pw, ph.trim(), m2, b2);
  }

  function bindAccountEvents() {
    document.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-acct-tab]');
      if (tb) {
        $all('.acct-tab').forEach(function (b) { b.classList.toggle('active', b === tb); });
        var l = $('#acctLoginForm'), s = $('#acctSignupForm');
        if (l) l.hidden = tb.getAttribute('data-acct-tab') !== 'login';
        if (s) s.hidden = tb.getAttribute('data-acct-tab') !== 'signup';
        return;
      }
      if (e.target.closest('#acctSignupBtn')) { submitSignup(); return; }
      var dd = e.target.closest('.acct-details');
      if (dd && e.target.closest('summary')) {
        e.preventDefault();
        var body = dd.querySelector('.acct-details-body');
        if (!body) return;
        if (dd.hasAttribute('open')) {
          body.style.height = body.scrollHeight + 'px';
          dd.classList.remove('anim-open');
          requestAnimationFrame(function () {
            body.style.height = '0px';
            setTimeout(function () { dd.removeAttribute('open'); body.style.height = ''; }, 280);
          });
        } else {
          dd.setAttribute('open', '');
          dd.classList.add('anim-open');
          body.style.height = '0px';
          requestAnimationFrame(function () {
            body.style.height = body.scrollHeight + 'px';
            setTimeout(function () { body.style.height = ''; }, 280);
          });
        }
        return;
      }
      var cb = e.target.closest('[data-cancel-order]');
      if (cb) { cancelMyOrder(cb.getAttribute('data-cancel-order'), cb); return; }
      if (e.target.closest('#acctLogout')) { doLogout(); return; }
      if (e.target.closest('[data-close="account"]')) { closeDrawer(); return; }
      if (e.target.id === 'accountOverlay') closeDrawer();
    });

    document.addEventListener('submit', function (e) {
      if (e.target.id === 'acctLoginForm') {
        e.preventDefault();
        var email = ($('#acctEmail') || {}).value || '';
        var pass = ($('#acctPass') || {}).value || '';
        var msg = $('#acctLoginMsg');
        var btn = e.target.querySelector('button[type="submit"]');
        if (!email || !pass) { showMsg(msg, t('account.errFields')); return; }
        showMsg(msg, '');
        doLogin(email.trim(), pass, msg, btn);
        return;
      }
      if (e.target.id === 'acctSignupForm') {
        e.preventDefault();
        var nm = ($('#suName') || {}).value || '';
        var em = ($('#suEmail') || {}).value || '';
        var pw = ($('#suPass') || {}).value || '';
        var ph = ($('#suPhone') || {}).value || '';
        var m2 = $('#acctSignupMsg');
        var b2 = $('#acctSignupBtn');
        if (!em || !pw) { showMsg(m2, t('account.errFields')); return; }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { showMsg(m2, t('account.errEmail')); return; }
        if (pw.length < 6) { showMsg(m2, t('account.errPass')); return; }
        showMsg(m2, '');
        doSignup(nm.trim(), em.trim(), pw, ph.trim(), m2, b2);
        return;
      }
      if (e.target.id === 'acctProfileForm') {
        e.preventDefault();
        var n3 = ($('#prName') || {}).value || '';
        var p3 = ($('#prPhone') || {}).value || '';
        upsertProfile(n3.trim(), p3.trim()).then(function () {
          showMsg($('#acctProfileMsg'), t('account.profileSaved'), true);
          render();
          emit();
        });
      }
    });
  }

  /* ---------- init ---------- */
  function init() {
    buildDrawer();
    var cached = cachedUser();
    if (cached && cached.id && cached.refresh) {
      session = { refresh_token: cached.refresh, access_token: null };
      refreshSession().then(function (u2) {
        if (!u2) render();  // refresh failed -> cleared session, show login form
        emit();
      });
    }
    bindAccountEvents();
  }

  /* ---------- export ---------- */
  var EXPORT = {};
  EXPORT.getUser = getUser;
  EXPORT.onUser = onUser;
  EXPORT.openDrawer = openDrawer;
  EXPORT.closeDrawer = closeDrawer;
  EXPORT.token = function () { return apiToken(); };
    EXPORT.refreshOrders = refreshOrders;
  EXPORT._profileRef = function () { return profile; };
  window['SM_' + 'AUTH'] = EXPORT;

  init();
})();
