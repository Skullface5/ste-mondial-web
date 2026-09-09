/* ============================================================
   STE MONDIAL — Admin2 (Lane 3)
   Supabase auth + dashboard + orders (realtime) + products CRUD + settings
   ============================================================ */
'use strict';

const SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';

const CATEGORIES = ['inspires', 'voiture', 'ambiance', 'musc'];
const STATUSES = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];
const STATUS_FR = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée'
};
const NEXT_STATUS = { nouvelle: 'confirmee', confirmee: 'expediee', expediee: 'livree' };

const LOGIN_RETRY_INTERVAL = 20;   // seconds between retries
const LOGIN_RETRY_MAX_MS = 10 * 60 * 1000; // 10 minutes, per contract
const POLL_MS = 30000;             // realtime fallback polling

const SETTINGS_KEYS = [
  { key: 'free_shipping_min', label: 'Livraison gratuite à partir de (DT)', type: 'number', def: 400 },
  { key: 'announcement_fr', label: 'Annonce bandeau (FR)', type: 'text', def: '', placeholder: 'ex : Livraison gratuite dès 400 DT' },
  { key: 'announcement_en', label: 'Annonce bandeau (EN)', type: 'text', def: '', placeholder: 'Free shipping from 400 DT' },
  { key: 'announcement_ar', label: 'Annonce bandeau (AR)', type: 'text', def: '', dir: 'rtl', placeholder: '' }
];

const $ = (id) => document.getElementById(id);
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});

const state = {
  view: 'dashboard',
  user: null,
  orders: [],
  products: [],
  settings: {},          // key -> raw jsonb value
  openOrders: new Set(),
  orderFilter: 'all',
  orderSearch: '',
  productSearch: '',
  editingProductId: null,
  confirmDeleteId: null,
  realtimeOk: false,
  pollTimer: null,
  channel: null
};

let loginRetryTimer = null;
let loginRetryDeadline = 0;

/* ---------------- helpers ---------------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtDT(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
let toastTimer = null;
function toast(msg, isErr) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.toggle('err', !!isErr);
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}
function showMsg(el, text, kind) {
  if (!text) { el.hidden = true; el.textContent = ''; return; }
  el.textContent = text;
  el.className = 'form-msg ' + (kind === 'ok' ? 'ok' : 'err');
  if (el.id === 'login-msg') el.className = 'login-msg' + (kind === 'ok' ? '' : ' warn');
  el.hidden = false;
}

/* ============================================================
   AUTH
   ============================================================ */
function isMissingUserError(msg) {
  const m = String(msg || '').toLowerCase();
  return m.includes('invalid login credentials') || m.includes('user not found') ||
    m.includes('invalid_credentials') || m.includes('email not confirmed');
}

async function attemptLogin(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

function stopLoginRetry() {
  if (loginRetryTimer) { clearInterval(loginRetryTimer); loginRetryTimer = null; }
}

function scheduleLoginRetry(email, password) {
  if (loginRetryTimer) return; // already scheduled
  loginRetryDeadline = Date.now() + LOGIN_RETRY_MAX_MS;
  let secs = LOGIN_RETRY_INTERVAL;
  const msg = $('login-msg');
  const paint = () => {
    const left = Math.max(0, Math.round((loginRetryDeadline - Date.now()) / 1000));
    if (left <= 0) {
      stopLoginRetry();
      showMsg(msg, 'Compte admin toujours indisponible après 10 minutes d\'attente. Vérifiez la création du compte (Lane 1) puis réessayez.', 'warn');
      $('login-btn').disabled = false;
      return;
    }
    showMsg(msg, 'Compte admin pas encore disponible (création en cours). Nouvel essai automatique dans ' + secs + ' s — arrêt dans ' + Math.floor(left / 60) + ' min ' + (left % 60) + ' s.', 'warn');
  };
  paint();
  loginRetryTimer = setInterval(async () => {
    secs = LOGIN_RETRY_INTERVAL;
    try {
      await attemptLogin(email, password);
      stopLoginRetry();
      // onAuthStateChange will enter the app
    } catch (e) {
      paint();
      if (!isMissingUserError(e.message)) {
        stopLoginRetry();
        showMsg(msg, 'Connexion impossible : ' + e.message, 'warn');
        $('login-btn').disabled = false;
      }
    }
  }, LOGIN_RETRY_INTERVAL * 1000);
}

async function handleLoginSubmit(ev) {
  ev.preventDefault();
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const msg = $('login-msg');
  if (!email || !password) { showMsg(msg, 'Email et mot de passe requis.', 'warn'); return; }
  stopLoginRetry();
  const btn = $('login-btn');
  btn.disabled = true;
  btn.textContent = 'Connexion…';
  try {
    await attemptLogin(email, password);
    // success → onAuthStateChange enters the app
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Connexion';
    if (isMissingUserError(e.message)) {
      scheduleLoginRetry(email, password);
    } else {
      showMsg(msg, 'Connexion impossible : ' + e.message, 'warn');
    }
  }
}

async function doLogout() {
  try { await sb.auth.signOut(); } catch (e) { /* session may already be gone */ }
}

function enterApp(user) {
  stopLoginRetry();
  state.user = user;
  $('view-login').hidden = true;
  $('app-shell').hidden = false;
  document.body.dataset.view = 'app';
  $('nav-user-mail').textContent = user.email || '';
  setConnBar();
  showView('dashboard');
  refreshAll();
  startRealtime();
}

function exitApp() {
  stopLoginRetry();
  stopRealtime();
  state.user = null;
  state.orders = [];
  state.products = [];
  state.openOrders = new Set();
  $('app-shell').hidden = true;
  $('view-login').hidden = false;
  document.body.dataset.view = 'login';
  $('login-btn').disabled = false;
  $('login-btn').textContent = 'Connexion';
  $('login-password').value = '';
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const VIEWS = ['dashboard', 'orders', 'products', 'settings'];
function showView(name) {
  if (!VIEWS.includes(name)) name = 'dashboard';
  state.view = name;
  VIEWS.forEach((v) => { $('view-' + v).hidden = (v !== name); });
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.nav === name);
  });
  closeSidenav();
  window.scrollTo(0, 0);
  if (name === 'dashboard') renderDashboard();
  if (name === 'orders') renderOrders();
  if (name === 'products') renderProducts();
  if (name === 'settings') renderSettings();
}

function openSidenav() {
  $('sidenav').classList.add('open');
  const sc = $('scrim');
  sc.hidden = false;
  requestAnimationFrame(() => sc.classList.add('show'));
}
function closeSidenav() {
  $('sidenav').classList.remove('open');
  const sc = $('scrim');
  sc.classList.remove('show');
  setTimeout(() => { sc.hidden = true; }, 220);
}

/* ============================================================
   DATA LOADING
   ============================================================ */
async function refreshAll() {
  await Promise.all([loadOrders(false), loadProducts(false), loadSettings(false)]);
  renderDashboard();
  renderOrders();
  renderProducts();
  renderSettings();
}

async function loadOrders(notify) {
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) { if (notify) toast('Erreur commandes : ' + error.message, true); return; }
  state.orders = data || [];
}

async function loadProducts(notify) {
  const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
  if (error) { if (notify) toast('Erreur produits : ' + error.message, true); return; }
  state.products = data || [];
}

async function loadSettings(notify) {
  const { data, error } = await sb.from('site_settings').select('*');
  if (error) { if (notify) toast('Erreur réglages : ' + error.message, true); return; }
  state.settings = {};
  (data || []).forEach((row) => { state.settings[row.key] = row.value; });
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function renderDashboard() {
  const orders = state.orders;
  const start = todayStartIso();
  const todayCount = orders.filter((o) => o.created_at && o.created_at >= start).length;
  const ca = orders
    .filter((o) => o.status !== 'annulee')
    .reduce((s, o) => s + (Number(o.total) || 0), 0);
  const pending = orders.filter((o) => o.status === 'nouvelle').length;
  const activeProducts = state.products.filter((p) => p.active).length;
  $('stat-today').textContent = String(todayCount);
  $('stat-ca').textContent = fmtDT(ca);
  $('stat-pending').textContent = String(pending);
  $('stat-products').textContent = String(activeProducts);
  $('today-label').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const recent = orders.slice(0, 5);
  const box = $('dash-recent');
  if (!recent.length) {
    box.innerHTML = '<p class="dash-row-sub">Aucune commande pour le moment.</p>';
    return;
  }
  box.innerHTML = recent.map((o) => `
    <div class="dash-row">
      <div class="dash-row-main">
        <div class="dash-row-name">${esc(o.customer_name || 'Client')} · ${esc(o.customer_phone || '')}</div>
        <div class="dash-row-sub">${esc(fmtDate(o.created_at))} · ${esc(o.city || '')}</div>
      </div>
      <div class="order-head-right">
        <span class="dash-row-total">${esc(fmtDT(o.total))}</span>
        <span class="pill pill--${esc(o.status)}">${esc(STATUS_FR[o.status] || o.status)}</span>
      </div>
    </div>`).join('');
}

/* ============================================================
   ORDERS
   ============================================================ */
function filteredOrders() {
  const q = state.orderSearch.trim().toLowerCase();
  return state.orders.filter((o) => {
    if (state.orderFilter !== 'all' && o.status !== state.orderFilter) return false;
    if (!q) return true;
    const hay = [o.customer_name, o.customer_phone, o.customer_email, o.city, o.address, o.id]
      .map((x) => String(x || '').toLowerCase()).join(' ');
    return hay.includes(q);
  });
}

function orderItemsHtml(items) {
  let list = [];
  try {
    list = typeof items === 'string' ? JSON.parse(items) : (items || []);
  } catch (e) { list = []; }
  if (!Array.isArray(list) || !list.length) return '<p class="order-item-name">—</p>';
  return list.map((it) => {
    const name = it.name || it.name_fr || it.title || 'Produit';
    const qty = Number(it.qty != null ? it.qty : (it.quantity != null ? it.quantity : 1)) || 1;
    const price = Number(it.price != null ? it.price : (it.unit_price != null ? it.unit_price : 0));
    return `<div class="order-item">
      <span class="order-item-name">${esc(name)} × ${qty}</span>
      <span class="order-item-total">${esc(fmtDT(price * qty))}</span>
    </div>`;
  }).join('');
}

function orderCardHtml(o) {
  const open = state.openOrders.has(o.id);
  const next = NEXT_STATUS[o.status];
  return `
  <article class="order-card${open ? ' open' : ''}" data-id="${esc(o.id)}">
    <button class="order-head" data-act="toggle" data-id="${esc(o.id)}" aria-expanded="${open}">
      <div class="order-head-main">
        <span class="order-id">#${esc(String(o.id).slice(0, 8))}</span>
        <div class="order-name">${esc(o.customer_name || 'Client')}</div>
        <div class="order-meta">${esc(fmtDate(o.created_at))} · ${esc(o.city || '—')}</div>
      </div>
      <div class="order-head-right">
        <span class="order-total">${esc(fmtDT(o.total))}</span>
        <span class="pill pill--${esc(o.status)}">${esc(STATUS_FR[o.status] || o.status)}</span>
        <span class="order-caret">▼</span>
      </div>
    </button>
    <div class="order-body">
      <div class="order-grid">
        <div class="order-cust">
          <div class="order-block-title">Client</div>
          <div><strong>${esc(o.customer_name || '—')}</strong></div>
          <div>Tél : <a href="tel:${esc(o.customer_phone || '')}">${esc(o.customer_phone || '—')}</a></div>
          ${o.customer_email ? `<div>Email : ${esc(o.customer_email)}</div>` : ''}
          <div>Adresse : ${esc(o.address || '—')}</div>
          <div>Ville : ${esc(o.city || '—')}</div>
        </div>
        <div>
          <div class="order-block-title">Articles</div>
          <div class="order-items">${orderItemsHtml(o.items)}</div>
          <div class="order-block-title" style="margin-top:10px">Total</div>
          <div><strong>${esc(fmtDT(o.total))}</strong> — paiement à la livraison</div>
        </div>
      </div>
      ${o.notes ? `<div class="order-notes"><strong>Note :</strong> ${esc(o.notes)}</div>` : ''}
      <div class="order-status-row">
        <label class="field-label" for="sel-${esc(o.id)}">Statut</label>
        <select class="status-select" id="sel-${esc(o.id)}" data-act="status" data-id="${esc(o.id)}">
          ${STATUSES.map((s) => `<option value="${s}"${s === o.status ? ' selected' : ''}>${esc(STATUS_FR[s])}</option>`).join('')}
        </select>
        ${next ? `<button class="btn btn--ghost" data-act="next" data-id="${esc(o.id)}" data-next="${next}">→ ${esc(STATUS_FR[next])}</button>` : ''}
        ${o.status !== 'annulee' ? `<button class="btn btn--danger" data-act="cancel" data-id="${esc(o.id)}">Annuler</button>` : ''}
        <span class="order-when">Créée le ${esc(fmtDate(o.created_at))}</span>
      </div>
    </div>
  </article>`;
}

function renderOrders() {
  const list = filteredOrders();
  $('orders-empty').hidden = list.length > 0;
  $('orders-list').innerHTML = list.map(orderCardHtml).join('');
}

function setConnBar() {
  const bar = $('conn-bar');
  if (!state.user) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.className = 'conn-bar ' + (state.realtimeOk ? 'on' : 'poll');
  $('conn-label').textContent = state.realtimeOk ? 'Temps réel connecté' : 'Sondage 30 s (temps réel indisponible)';
}

async function setOrderStatus(id, status) {
  const { error } = await sb.from('orders').update({ status }).eq('id', id);
  if (error) { toast('Échec mise à jour : ' + error.message, true); return false; }
  const o = state.orders.find((x) => x.id === id);
  if (o) o.status = status;
  renderOrders();
  renderDashboard();
  toast('Commande → ' + (STATUS_FR[status] || status));
  return true;
}

/* realtime + fallback polling */
function startRealtime() {
  if (state.channel) return;
  state.channel = sb.channel('orders-admin-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      onOrdersRealtime(payload);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        state.realtimeOk = true;
        stopPolling();
        setConnBar();
      } else {
        state.realtimeOk = false;
        startPolling();
        setConnBar();
      }
    });
  // safety: if the channel never confirms, fall back to polling
  setTimeout(() => { if (!state.realtimeOk) { startPolling(); setConnBar(); } }, 6000);
}

function stopRealtime() {
  if (state.channel) { try { sb.removeChannel(state.channel); } catch (e) { /* noop */ } state.channel = null; }
  stopPolling();
  state.realtimeOk = false;
}

function startPolling() {
  if (state.pollTimer) return;
  state.pollTimer = setInterval(async () => {
    if (!state.user) return;
    await loadOrders(false);
    renderOrders();
    renderDashboard();
  }, POLL_MS);
}
function stopPolling() {
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
}

async function onOrdersRealtime(payload) {
  const row = (payload && (payload.new || payload.old)) || null;
  if (payload && payload.eventType === 'DELETE' && row && row.id) {
    state.orders = state.orders.filter((o) => o.id !== row.id);
  } else if (row && row.id) {
    const i = state.orders.findIndex((o) => o.id === row.id);
    if (i >= 0) state.orders[i] = row; else state.orders.unshift(row);
  } else {
    await loadOrders(false);
  }
  renderOrders();
  renderDashboard();
}

/* ============================================================
   PRODUCTS
   ============================================================ */
function productMatches(p, q) {
  if (!q) return true;
  const hay = [p.name_fr, p.name_en, p.name_ar, p.sku, p.category].map((x) => String(x || '').toLowerCase()).join(' ');
  return hay.includes(q);
}

function productCardHtml(p) {
  const img = p.image_url
    ? `<img class="prod-thumb" src="${esc(p.image_url)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=prod-thumb-wrap>◈</div>'">`
    : '<div class="prod-thumb-wrap">◈</div>';
  const lowStock = Number(p.stock) <= 3;
  return `
  <article class="prod-card" data-id="${esc(p.id)}">
    ${img}
    <div class="prod-info">
      <div class="prod-name">${esc(p.name_fr)}</div>
      <div class="prod-sub">
        <span class="badge badge--cat">${esc(p.category)}</span>
        ${p.featured ? '<span class="badge badge--feat">★ Avant</span>' : ''}
        ${!p.active ? '<span class="badge badge--off">Inactif</span>' : ''}
        ${lowStock ? `<span class="badge badge--stock">Stock ${esc(p.stock)}</span>` : ''}
        <span class="prod-price">${esc(fmtDT(p.price))}</span>
        ${p.old_price ? `<span class="prod-old">${esc(fmtDT(p.old_price))}</span>` : ''}
      </div>
      <div class="stock-cell" style="margin-top:7px">
        <label class="field-label" style="margin:0" for="stock-${esc(p.id)}">Stock</label>
        <input class="stock-input" id="stock-${esc(p.id)}" type="number" min="0" step="1" value="${esc(p.stock)}" data-act="stock-input" data-id="${esc(p.id)}">
        <button class="stock-save" data-act="stock-save" data-id="${esc(p.id)}">OK</button>
      </div>
    </div>
    <div class="prod-actions">
      <button class="btn btn--ghost" data-act="edit" data-id="${esc(p.id)}">Modifier</button>
      <button class="btn btn--danger" data-act="delete" data-id="${esc(p.id)}">${state.confirmDeleteId === p.id ? 'Confirmer ?' : 'Supprimer'}</button>
    </div>
  </article>`;
}

function renderProducts() {
  const q = state.productSearch.trim().toLowerCase();
  const list = state.products.filter((p) => productMatches(p, q));
  $('products-count').textContent = state.products.length + ' produit(s) · ' + list.length + ' affiché(s)';
  $('products-empty').hidden = list.length > 0;
  $('products-list').innerHTML = list.map(productCardHtml).join('');
}

function openProductModal(product) {
  state.editingProductId = product ? product.id : null;
  $('modal-title').textContent = product ? 'Modifier le produit' : 'Nouveau produit';
  $('pf-name-fr').value = product ? (product.name_fr || '') : '';
  $('pf-name-en').value = product ? (product.name_en || '') : '';
  $('pf-name-ar').value = product ? (product.name_ar || '') : '';
  $('pf-desc-fr').value = product ? (product.desc_fr || '') : '';
  $('pf-desc-en').value = product ? (product.desc_en || '') : '';
  $('pf-desc-ar').value = product ? (product.desc_ar || '') : '';
  $('pf-category').value = product && CATEGORIES.includes(product.category) ? product.category : 'inspires';
  $('pf-image').value = product ? (product.image_url || '') : '';
  $('pf-price').value = product && product.price != null ? product.price : '';
  $('pf-old-price').value = product && product.old_price != null ? product.old_price : '';
  $('pf-stock').value = product && product.stock != null ? product.stock : 0;
  $('pf-featured').checked = !!(product && product.featured);
  $('pf-active').checked = product ? !!product.active : true;
  showMsg($('pf-msg'), '');
  $('modal-scrim').hidden = false;
  $('pf-name-fr').focus();
}
function closeProductModal() {
  $('modal-scrim').hidden = true;
  state.editingProductId = null;
  state.confirmDeleteId = null;
}

async function saveProduct(ev) {
  ev.preventDefault();
  const msg = $('pf-msg');
  const nameFr = $('pf-name-fr').value.trim();
  const priceRaw = $('pf-price').value;
  if (!nameFr) { showMsg(msg, 'Le nom (FR) est obligatoire.', 'err'); return; }
  if (priceRaw === '' || !isFinite(Number(priceRaw)) || Number(priceRaw) < 0) { showMsg(msg, 'Le prix est obligatoire (nombre ≥ 0).', 'err'); return; }
  const nameEn = $('pf-name-en').value.trim();
  const nameAr = $('pf-name-ar').value.trim();
  const payload = {
    name_fr: nameFr,
    name_en: nameEn || nameFr,
    name_ar: nameAr || nameFr,
    desc_fr: $('pf-desc-fr').value.trim() || null,
    desc_en: $('pf-desc-en').value.trim() || null,
    desc_ar: $('pf-desc-ar').value.trim() || null,
    category: $('pf-category').value,
    price: Number(priceRaw),
    old_price: $('pf-old-price').value === '' ? null : Number($('pf-old-price').value),
    stock: $('pf-stock').value === '' ? 0 : Math.max(0, Math.round(Number($('pf-stock').value))),
    featured: $('pf-featured').checked,
    active: $('pf-active').checked,
    image_url: $('pf-image').value.trim() || null
  };
  const btn = $('pf-save');
  btn.disabled = true;
  let error;
  if (state.editingProductId) {
    ({ error } = await sb.from('products').update(payload).eq('id', state.editingProductId));
  } else {
    ({ error } = await sb.from('products').insert(payload));
  }
  btn.disabled = false;
  if (error) { showMsg(msg, 'Enregistrement impossible : ' + error.message, 'err'); return; }
  const wasEdit = !!state.editingProductId;
  await loadProducts(false);
  renderProducts();
  renderDashboard();
  closeProductModal();
  toast(wasEdit ? 'Produit mis à jour.' : 'Produit créé.');
}

async function quickSaveStock(id) {
  const input = $('stock-' + id);
  const v = Math.max(0, Math.round(Number(input.value)));
  if (!isFinite(Number(input.value))) { toast('Stock invalide.', true); return; }
  const { error } = await sb.from('products').update({ stock: v }).eq('id', id);
  if (error) { toast('Échec stock : ' + error.message, true); return; }
  const p = state.products.find((x) => x.id === id);
  if (p) p.stock = v;
  renderProducts();
  toast('Stock mis à jour (' + v + ').');
}

async function deleteProduct(id) {
  if (state.confirmDeleteId !== id) {
    state.confirmDeleteId = id;
    renderProducts();
    setTimeout(() => {
      if (state.confirmDeleteId === id) { state.confirmDeleteId = null; renderProducts(); }
    }, 5000);
    return;
  }
  state.confirmDeleteId = null;
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) { toast('Suppression impossible : ' + error.message, true); return; }
  state.products = state.products.filter((p) => p.id !== id);
  renderProducts();
  renderDashboard();
  toast('Produit supprimé.');
}

/* ============================================================
   SETTINGS
   ============================================================ */
function coerceSettingValue(key, raw) {
  if (key === 'free_shipping_min') {
    const n = Number(raw);
    return isFinite(n) ? n : null;
  }
  return String(raw == null ? '' : raw);
}

function renderSettings() {
  const box = $('settings-fields');
  const known = new Set(SETTINGS_KEYS.map((k) => k.key));
  let html = SETTINGS_KEYS.map((k) => {
    const val = state.settings[k.key] != null ? state.settings[k.key] : k.def;
    const dirAttr = k.dir ? ` dir="${k.dir}"` : '';
    if (k.type === 'number') {
      return `<div class="settings-row"><span class="settings-key">${esc(k.key)}</span>
        <input class="field-input" type="number" step="0.001" min="0" data-setting="${esc(k.key)}" value="${esc(val)}"></div>
        <div class="field-label" style="margin:2px 0 12px">${esc(k.label)}</div>`;
    }
    return `<div class="settings-row"><span class="settings-key">${esc(k.key)}</span>
      <input class="field-input" type="text" data-setting="${esc(k.key)}"${dirAttr} value="${esc(val)}" placeholder="${esc(k.placeholder || '')}"></div>
      <div class="field-label" style="margin:2px 0 12px">${esc(k.label)}</div>`;
  }).join('');
  Object.keys(state.settings).forEach((key) => {
    if (known.has(key)) return;
    const v = state.settings[key];
    const asText = (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v);
    html += `<div class="settings-row"><span class="settings-key">${esc(key)}</span>
      <input class="field-input" type="text" data-setting="${esc(key)}" data-json="1" value="${esc(asText)}"></div>
      <div class="field-label" style="margin:2px 0 12px">Clé personnalisée</div>`;
  });
  box.innerHTML = html;
}

async function saveSettings() {
  const msg = $('settings-msg');
  const rows = [];
  let invalid = false;
  document.querySelectorAll('[data-setting]').forEach((input) => {
    const key = input.dataset.setting;
    let value;
    if (input.dataset.json) {
      try { value = JSON.parse(input.value); } catch (e) { value = input.value; }
    } else if (input.type === 'number') {
      if (input.value === '') { showMsg(msg, key + ' : valeur numérique requise.', 'err'); invalid = true; return; }
      value = Number(input.value);
    } else {
      value = input.value;
    }
    rows.push({ key, value });
  });
  if (invalid || !rows.length) return;
  const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) { showMsg(msg, 'Enregistrement impossible : ' + error.message, 'err'); return; }
  await loadSettings(false);
  renderSettings();
  showMsg(msg, 'Réglages enregistrés.', 'ok');
  setTimeout(() => showMsg($('settings-msg'), ''), 3000);
  toast('Réglages enregistrés.');
}

/* ============================================================
   EVENTS
   ============================================================ */
function wire() {
  $('login-form').addEventListener('submit', handleLoginSubmit);
  $('pw-toggle').addEventListener('click', () => {
    const inp = $('login-password');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  $('burger').addEventListener('click', openSidenav);
  $('scrim').addEventListener('click', closeSidenav);
  $('btn-logout').addEventListener('click', doLogout);
  $('btn-logout-2').addEventListener('click', doLogout);
  $('btn-refresh').addEventListener('click', async () => {
    await refreshAll();
    toast('Données actualisées.');
  });

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.addEventListener('click', () => showView(b.dataset.nav));
  });

  // orders: chips + search + card actions
  $('orders-chips').addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    state.orderFilter = chip.dataset.filter;
    document.querySelectorAll('#orders-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
    renderOrders();
  });
  $('orders-search').addEventListener('input', (ev) => {
    state.orderSearch = ev.target.value;
    renderOrders();
  });
  $('orders-list').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'toggle') {
      if (state.openOrders.has(id)) state.openOrders.delete(id); else state.openOrders.add(id);
      renderOrders();
    } else if (act === 'next') {
      setOrderStatus(id, btn.dataset.next);
    } else if (act === 'cancel') {
      setOrderStatus(id, 'annulee');
    }
  });
  $('orders-list').addEventListener('change', (ev) => {
    const sel = ev.target.closest('[data-act="status"]');
    if (sel) setOrderStatus(sel.dataset.id, sel.value);
  });

  // products
  $('products-search').addEventListener('input', (ev) => {
    state.productSearch = ev.target.value;
    renderProducts();
  });
  $('btn-new-product').addEventListener('click', () => openProductModal(null));
  $('modal-close').addEventListener('click', closeProductModal);
  $('pf-cancel').addEventListener('click', closeProductModal);
  $('modal-scrim').addEventListener('click', (ev) => {
    if (ev.target === $('modal-scrim')) closeProductModal();
  });
  $('product-form').addEventListener('submit', saveProduct);
  $('products-list').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'edit') {
      const p = state.products.find((x) => x.id === id);
      if (p) openProductModal(p);
    } else if (act === 'delete') {
      deleteProduct(id);
    } else if (act === 'stock-save') {
      quickSaveStock(id);
    }
  });

  // settings
  $('btn-save-settings').addEventListener('click', saveSettings);

  // keep data fresh when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.user) refreshAll();
  });
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  wire();
  document.querySelector('#orders-chips .chip[data-filter="all"]').classList.add('active');
  try {
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    if (data && data.session && data.session.user) {
      enterApp(data.session.user);
    }
  } catch (e) {
    console.warn('getSession failed:', e && e.message);
  }
  sb.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session && session.user) {
      if (!state.user) enterApp(session.user);
    } else if (event === 'SIGNED_OUT') {
      exitApp();
    }
  });
}

boot();
