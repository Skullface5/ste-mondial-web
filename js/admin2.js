/* ============================================================
   STE MONDIAL — Admin2 (Lane 3, craft pass)
   Supabase auth + dashboard + orders (realtime + drawer) +
   products CRUD (inline edit) + settings editor. Vanilla JS.
   ============================================================ */
'use strict';

const SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';

const CATEGORIES = ['inspires', 'voiture', 'ambiance', 'musc'];
const CATEGORY_FR = { inspires: 'Inspires', voiture: 'Voiture', ambiance: 'Ambiance', musc: 'Musc' };
const STATUSES = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];
const STATUS_FR = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée'
};
const NEXT_STATUS = { nouvelle: 'confirmee', confirmee: 'expediee', expediee: 'livree' };
const CHIPS = [['all', 'Toutes'], ['nouvelle', 'Nouvelle'], ['confirmee', 'Confirmée'], ['expediee', 'Expédiée'], ['livree', 'Livrée'], ['annulee', 'Annulée']];

const LOW_STOCK_MAX = 5;
const POLL_MS = 30000; // realtime fallback polling

const SETTINGS_FIELDS = [
  { key: 'delivery_fee', label: 'Frais de livraison (DT)', type: 'number', def: 8, required: true },
  { key: 'free_shipping_min', label: 'Livraison gratuite à partir de (DT)', type: 'number', def: 80, required: true },
  { key: 'shop_name', label: 'Nom de la boutique', type: 'text', def: 'STE MONDIAL' },
  { key: 'whatsapp', label: 'WhatsApp (format international, sans « + »)', type: 'text', def: '', placeholder: 'ex : 21699000000' },
  { key: 'hero_image', label: 'Image héro (URL)', type: 'url', def: '', placeholder: 'https://…' },
  { key: 'announcement_fr', label: 'Bandeau annonce (FR)', type: 'textarea', def: '' },
  { key: 'announcement_en', label: 'Bandeau annonce (EN)', type: 'textarea', def: '' },
  { key: 'announcement_ar', label: 'Bandeau annonce (AR)', type: 'textarea', def: '', dir: 'rtl' }
];
const SETTINGS_KNOWN = new Set(SETTINGS_FIELDS.map((f) => f.key));

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
  orderFilter: 'all',
  orderSearch: '',
  productSearch: '',
  drawerOrderId: null,
  editingProductId: null,
  confirmResolve: null,
  realtimeOk: false,
  pollTimer: null,
  channel: null
};

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
function pad2(n) { return String(n).padStart(2, '0'); }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() +
    ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function fmtTimeAgo(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
  return fmtDate(iso);
}
function todayStartIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function parseItems(items) {
  try {
    const list = typeof items === 'string' ? JSON.parse(items) : (items || []);
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}
function itemsSum(items) {
  return parseItems(items).reduce((s, it) => {
    const qty = Number(it.qty != null ? it.qty : (it.quantity != null ? it.quantity : 1)) || 1;
    const price = Number(it.price != null ? it.price : (it.unit_price != null ? it.unit_price : 0));
    return s + qty * price;
  }, 0);
}
function toast(msg, isErr) {
  const box = $('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .25s ease';
    el.style.opacity = '0';
    setTimeout(() => { el.remove(); }, 260);
  }, 3200);
}
function showMsg(el, text, kind) {
  if (!el) return;
  if (!text) { el.hidden = true; el.textContent = ''; return; }
  el.textContent = text;
  el.className = (el.id === 'login-msg' ? 'login-msg' : 'form-msg') + (kind === 'ok' ? ' ok' : (kind === 'warn' ? ' warn' : ' err'));
  el.hidden = false;
}

/* ---------------- auth token + REST ---------------- */
async function getToken() {
  const { data, error } = await sb.auth.getSession();
  if (error) throw error;
  const tok = data && data.session && data.session.access_token;
  if (!tok) throw new Error('Session admin absente — reconnectez-vous.');
  return tok;
}
async function api(method, path, body, prefer) {
  const token = await getToken();
  const headers = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(SUPABASE_URL + path, {
    method, headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return res;
}

/* ============================================================
   AUTH
   ============================================================ */
async function handleLoginSubmit(ev) {
  ev.preventDefault();
  const email = $('login-email').value.trim();
  const password = $('login-password').value;
  const msg = $('login-msg');
  if (!email || !password) { showMsg(msg, 'Email et mot de passe requis.', 'err'); return; }
  const btn = $('login-btn');
  btn.disabled = true;
  btn.textContent = 'Connexion…';
  try {
    await sb.auth.signInWithPassword({ email, password });
    // success → onAuthStateChange enters the app
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Connexion';
    showMsg(msg, 'Connexion impossible : ' + (e.message || 'erreur inconnue'), 'err');
  }
}

async function doLogout() {
  try { await sb.auth.signOut(); } catch (e) { /* session may already be gone */ }
}

function enterApp(user) {
  state.user = user;
  $('view-login').hidden = true;
  $('app-shell').hidden = false;
  document.body.dataset.view = 'app';
  $('nav-user-mail').textContent = user.email || '';
  setConnBar();
  showView('dashboard');
  refreshAll(true);
  startRealtime();
}

function exitApp() {
  stopRealtime();
  state.user = null;
  state.orders = [];
  state.products = [];
  state.drawerOrderId = null;
  closeProductModal();
  closeConfirm(false);
  closeOrderDrawer(true);
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
  VIEWS.forEach((v) => { const el = $('view-' + v); if (el) el.hidden = (v !== name); });
  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.nav === name);
  });
  closeSidenav();
  window.scrollTo(0, 0);
  if (name === 'dashboard') renderDashboard();
  if (name === 'orders') { renderOrderChips(); renderOrders(); }
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
async function refreshAll(notify) {
  await Promise.all([loadOrders(notify), loadProducts(notify), loadSettings(notify)]);
  renderDashboard();
  renderOrderChips();
  if (state.view === 'orders') renderOrders();
  if (state.view === 'products') renderProducts();
  if (state.view === 'settings') renderSettings();
}

async function loadOrders(notify) {
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) { if (notify) toast('Erreur commandes : ' + error.message, true); return; }
  state.orders = data || [];
  if (state.view === 'orders') { renderOrderChips(); renderOrders(); }
}

async function loadProducts(notify) {
  const { data, error } = await sb.from('products').select('*').order('created_at', { ascending: false });
  if (error) { if (notify) toast('Erreur produits : ' + error.message, true); return; }
  state.products = data || [];
}

async function loadSettings(notify) {
  const { data, error } = await sb.from('site_settings').select('key,value');
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
  const todayOrders = orders.filter((o) => o.created_at && o.created_at >= start);
  const revenueToday = todayOrders
    .filter((o) => o.status !== 'annulee')
    .reduce((s, o) => s + (Number(o.total) || 0), 0);
  const pending = orders.filter((o) => o.status === 'nouvelle' || o.status === 'confirmee').length;
  const low = state.products.filter((p) => p.active !== false && Number(p.stock) <= LOW_STOCK_MAX)
    .sort((a, b) => Number(a.stock) - Number(b.stock));

  $('stat-today').textContent = String(todayOrders.length);
  $('stat-ca-today').textContent = fmtDT(revenueToday);
  $('stat-pending').textContent = String(pending);
  $('stat-lowstock').textContent = String(low.length);
  $('stat-lowstock').closest('.stat-card').classList.toggle('stat-card--alert', low.length > 0);
  $('today-label').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // latest 5 orders mini-list
  const recent = orders.slice(0, 5);
  const box = $('dash-recent');
  if (!recent.length) {
    box.innerHTML = '<p class="dash-row-sub">Aucune commande pour le moment.</p>';
  } else {
    box.innerHTML = recent.map((o) => `
      <button type="button" class="dash-row" data-open-order="${esc(o.id)}">
        <div class="dash-row-main">
          <div class="dash-row-name">${esc(o.customer_name || 'Client')}</div>
          <div class="dash-row-sub">${esc(fmtDate(o.created_at))} · ${esc(fmtTimeAgo(o.created_at))}</div>
        </div>
        <div class="dash-row-right">
          <span class="dash-row-total">${esc(fmtDT(o.total))}</span>
          <span class="pill pill--${esc(o.status)}">${esc(STATUS_FR[o.status] || o.status)}</span>
        </div>
      </button>`).join('');
  }

  // low stock list
  const lowBox = $('dash-lowstock');
  if (!low.length) {
    lowBox.innerHTML = '<p class="dash-row-sub">Tous les stocks sont corrects ✓</p>';
  } else {
    lowBox.innerHTML = low.map((p) => `
      <div class="low-row">
        <div class="low-row-main">
          <div class="low-name">${esc(p.name_fr || 'Produit')}</div>
          <div class="low-cat">${esc(CATEGORY_FR[p.category] || p.category || '')}${p.sku ? ' · ' + esc(p.sku) : ''}</div>
        </div>
        <span class="low-badge${Number(p.stock) === 0 ? '' : ' low-badge--warn'}">${esc(p.stock)}</span>
      </div>`).join('');
  }
}

/* ============================================================
   ORDERS
   ============================================================ */
function renderOrderChips() {
  const counts = { all: state.orders.length };
  STATUSES.forEach((s) => { counts[s] = state.orders.filter((o) => o.status === s).length; });
  const box = $('orders-chips');
  if (!box) return;
  box.innerHTML = CHIPS.map(([key, label]) =>
    `<button class="chip${key === state.orderFilter ? ' active' : ''}" data-filter="${key}">${label}<span class="chip-count">${counts[key] ?? 0}</span></button>`
  ).join('');
}

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

function orderCardHtml(o) {
  const open = state.drawerOrderId === o.id;
  return `
  <article class="order-card${open ? ' open' : ''}" data-id="${esc(o.id)}">
    <button class="order-head" data-act="drawer" data-id="${esc(o.id)}" aria-expanded="${open}">
      <div class="order-head-main">
        <span class="order-id">#${esc(String(o.id).slice(0, 8))} · ${esc(fmtDate(o.created_at))}</span>
        <div class="order-name">${esc(o.customer_name || 'Client')} — ${esc(o.customer_phone || '—')}</div>
        <div class="order-meta">${esc(o.city || '—')} · ${esc(fmtTimeAgo(o.created_at))}</div>
      </div>
      <div class="order-head-right">
        <span class="order-total">${esc(fmtDT(o.total))}</span>
        <span class="pill pill--${esc(o.status)}">${esc(STATUS_FR[o.status] || o.status)}</span>
        <span class="order-caret">▾</span>
      </div>
    </button>
    <div class="order-body">
      <div class="order-status-row">
        <label class="field-label" for="sel-${esc(o.id)}">Statut</label>
        <select class="status-select" id="sel-${esc(o.id)}" data-act="status" data-id="${esc(o.id)}">
          ${STATUSES.map((s) => `<option value="${s}"${s === o.status ? ' selected' : ''}>${esc(STATUS_FR[s])}</option>`).join('')}
        </select>
        ${NEXT_STATUS[o.status] ? `<button class="btn btn--ghost" data-act="next" data-id="${esc(o.id)}" data-next="${NEXT_STATUS[o.status]}">→ ${esc(STATUS_FR[NEXT_STATUS[o.status]])}</button>` : ''}
        <span class="order-when">Créée ${esc(fmtTimeAgo(o.created_at))}</span>
      </div>
      <button class="btn btn--ghost" data-act="drawer" data-id="${esc(o.id)}">Voir le détail</button>
    </div>
  </article>`;
}

function renderOrders() {
  const listEl = $('orders-list');
  if (!listEl) return;
  const list = filteredOrders();
  $('orders-empty').hidden = list.length > 0;
  listEl.innerHTML = list.map(orderCardHtml).join('');
}

function setConnBar() {
  const bar = $('conn-bar');
  if (!state.user) { bar.hidden = true; return; }
  bar.hidden = false;
  bar.className = 'conn-bar ' + (state.realtimeOk ? 'on' : 'poll');
  $('conn-label').textContent = state.realtimeOk ? 'Temps réel connecté' : 'Sondage 30 s (temps réel indisponible)';
}

/* optimistic status change; revert + toast on failure; verified via follow-up GET */
async function setOrderStatus(id, status) {
  const o = state.orders.find((x) => x.id === id);
  if (!o || o.status === status) return;
  const prev = o.status;
  o.status = status;                    // optimistic
  renderOrderChips(); renderOrders(); renderDashboard();

  const sel = $('sel-' + id);
  if (sel) { sel.classList.add('busy'); sel.disabled = true; }
  try {
    const res = await api('PATCH', `/rest/v1/orders?id=eq.${id}`, { status }, 'return=representation');
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status} ${t.slice(0, 140)}`);
    }
    const rows = await res.json().catch(() => []);
    const persisted = (Array.isArray(rows) && rows[0] && rows[0].status) || status;
    // follow-up GET to verify persistence
    const ver = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${id}&select=status`, {
      headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + (await getToken()) }
    });
    const verRows = ver.ok ? (await ver.json().catch(() => [])) : [];
    const confirmed = Array.isArray(verRows) && verRows[0] && verRows[0].status === status;
    if (!confirmed) throw new Error('vérification GET: statut non persisté');
    o.status = persisted === status ? status : persisted;
    toast(`Commande → ${STATUS_FR[status] || status}`);
  } catch (e) {
    o.status = prev;                  // revert
    toast('Échec mise à jour : ' + e.message, true);
  }
  if (sel) { sel.classList.remove('busy'); sel.disabled = false; }
  if (state.drawerOrderId === id) renderOrderDrawer();
  renderOrderChips(); renderOrders(); renderDashboard();
}

/* ---------------- order drawer ---------------- */
function drawerItemsHtml(o) {
  const list = parseItems(o.items);
  const sum = itemsSum(o.items);
  const total = Number(o.total) || 0;
  const diff = Math.round((total - sum) * 1000) / 1000;
  const rows = list.length ? list.map((it) => {
    const name = it.name || it.nameFr || it.name_fr || it.title || 'Produit';
    const qty = Number(it.qty != null ? it.qty : (it.quantity != null ? it.quantity : 1)) || 1;
    const price = Number(it.price != null ? it.price : (it.unit_price != null ? it.unit_price : 0));
    return `<div class="d-item">
      <span class="d-item-name">${esc(name)} <span class="d-item-line">× ${qty} · ${esc(fmtDT(price))}</span></span>
      <span class="d-item-total">${esc(fmtDT(price * qty))}</span>
    </div>`;
  }).join('') : '<p class="d-item-name">—</p>';
  const deliveryNote = diff > 0
    ? `<div class="d-item"><span class="d-item-name">Livraison</span><span class="d-item-total">${esc(fmtDT(diff))}</span></div>`
    : (diff < 0 ? `<div class="d-item"><span class="d-item-name">Remise</span><span class="d-item-total">${esc(fmtDT(diff))}</span></div>` : '');
  return rows + deliveryNote + `
    <div class="d-total-row"><span>Total (paiement à la livraison)</span><strong>${esc(fmtDT(total))}</strong></div>`;
}

function renderOrderDrawer() {
  const o = state.orders.find((x) => x.id === state.drawerOrderId);
  const drawer = $('drawer');
  if (!o) { closeOrderDrawer(true); return; }
  $('drawer-title').textContent = '#' + String(o.id).slice(0, 8);
  $('drawer-body').innerHTML = `
    <div class="drawer-status-row">
      <label class="field-label" for="dsel-${esc(o.id)}">Statut</label>
      <select class="status-select" id="dsel-${esc(o.id)}" data-act="status" data-id="${esc(o.id)}">
        ${STATUSES.map((s) => `<option value="${s}"${s === o.status ? ' selected' : ''}>${esc(STATUS_FR[s])}</option>`).join('')}
      </select>
      ${NEXT_STATUS[o.status] ? `<button class="btn btn--ghost" data-act="next" data-id="${esc(o.id)}" data-next="${NEXT_STATUS[o.status]}">→ ${esc(STATUS_FR[NEXT_STATUS[o.status]])}</button>` : ''}
    </div>
    <div class="d-sec">
      <div class="d-sec-title">Client</div>
      <div class="d-cust">
        <div><strong>${esc(o.customer_name || '—')}</strong></div>
        <div>Tél : <a href="tel:${esc(o.customer_phone || '')}">${esc(o.customer_phone || '—')}</a></div>
        ${o.customer_email ? `<div>Email : <a href="mailto:${esc(o.customer_email)}">${esc(o.customer_email)}</a></div>` : '<div class="d-meta">Pas d\'email</div>'}
        <div>Adresse : ${esc(o.address || '—')}</div>
        <div>Ville : ${esc(o.city || '—')}</div>
      </div>
    </div>
    <div class="d-sec">
      <div class="d-sec-title">Articles</div>
      ${drawerItemsHtml(o)}
    </div>
    ${o.notes ? `<div class="d-sec"><div class="d-sec-title">Note du client</div><div class="d-notes">${esc(o.notes)}</div></div>` : ''}
    <div class="d-meta">Créée le ${esc(fmtDate(o.created_at))}</div>`;
  drawer.hidden = false;
  requestAnimationFrame(() => drawer.classList.add('open'));
}

function openOrderDrawer(id) {
  state.drawerOrderId = id;
  renderOrderDrawer();
  $('drawer-scrim').hidden = false;
  requestAnimationFrame(() => $('drawer-scrim').classList.add('show'));
}
function closeOrderDrawer(instant) {
  state.drawerOrderId = null;
  const d = $('drawer'), sc = $('drawer-scrim');
  if (!d) return;
  d.classList.remove('open');
  sc.classList.remove('show');
  const hide = () => { d.hidden = true; sc.hidden = true; };
  if (instant) hide(); else setTimeout(hide, 240);
}

/* ---------------- CSV export ---------------- */
function exportOrdersCsv() {
  const rows = [['id', 'date', 'client', 'telephone', 'email', 'ville', 'adresse', 'articles', 'total_dt', 'statut']];
  state.orders.forEach((o) => {
    const items = parseItems(o.items).map((it) => {
      const name = it.name || it.nameFr || it.name_fr || it.title || '?';
      const qty = Number(it.qty != null ? it.qty : (it.quantity != null ? it.quantity : 1)) || 1;
      return `${name} x${qty}`;
    }).join(' | ');
    rows.push([o.id, fmtDate(o.created_at), o.customer_name || '', o.customer_phone || '', o.customer_email || '',
      o.city || '', o.address || '', items, String(Number(o.total) || 0), o.status || '']);
  });
  const csv = '\uFEFF' + rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'commandes-ste-mondial-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast(rows.length - 1 + ' commande(s) exportée(s).');
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
  const thumb = p.image_url
    ? `<img class="prod-thumb" src="${esc(p.image_url)}" alt="" loading="lazy"
         onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<div class=&quot;prod-thumb-wrap&quot;>◈</div>')">`
    : '<div class="prod-thumb-wrap">◈</div>';
  const lowStock = Number(p.stock) <= LOW_STOCK_MAX;
  return `
  <article class="prod-card" data-id="${esc(p.id)}">
    ${thumb}
    <div class="prod-info">
      <div class="prod-name">${esc(p.name_fr || 'Produit')}</div>
      <div class="prod-sku">${esc(p.sku || 'sans SKU')}</div>
      <div class="prod-sub">
        <span class="badge badge--cat">${esc(CATEGORY_FR[p.category] || p.category || '—')}</span>
        ${p.featured ? '<span class="badge badge--feat">★ Avant</span>' : ''}
        ${!p.active ? '<span class="badge badge--off">Inactif</span>' : ''}
        ${lowStock ? `<span class="badge badge--stock">Stock ${esc(p.stock)}</span>` : ''}
        ${p.old_price ? `<span class="prod-old">${esc(fmtDT(p.old_price))}</span>` : ''}
      </div>
      <div class="inline-cell">
        <label class="field-label" style="margin:0" for="price-${esc(p.id)}">Prix</label>
        <input class="inline-input" id="price-${esc(p.id)}" type="number" step="0.001" min="0" value="${esc(p.price)}" data-act="price-input" data-id="${esc(p.id)}">
        <button class="inline-save" data-act="inline-save" data-field="price" data-id="${esc(p.id)}">OK</button>
        <label class="field-label" style="margin:0 0 0 10px" for="stock-${esc(p.id)}">Stock</label>
        <input class="inline-input num" id="stock-${esc(p.id)}" type="number" step="1" min="0" value="${esc(p.stock)}" data-act="stock-input" data-id="${esc(p.id)}">
        <button class="inline-save" data-act="inline-save" data-field="stock" data-id="${esc(p.id)}">OK</button>
      </div>
      <div class="toggle-row prod-toggles">
        <label class="toggle"><input type="checkbox" data-act="feat-toggle" data-id="${esc(p.id)}"${p.featured ? ' checked' : ''}><span class="toggle-track"></span><span class="toggle-label">Mis en avant</span></label>
        <label class="toggle"><input type="checkbox" data-act="active-toggle" data-id="${esc(p.id)}"${p.active !== false ? ' checked' : ''}><span class="toggle-track"></span><span class="toggle-label">Actif</span></label>
      </div>
    </div>
    <div class="prod-actions">
      <button class="btn btn--ghost" data-act="edit" data-id="${esc(p.id)}">Modifier</button>
      <button class="btn btn--danger" data-act="delete" data-id="${esc(p.id)}">Supprimer</button>
    </div>
  </article>`;
}

function renderProducts() {
  const listEl = $('products-list');
  if (!listEl) return;
  const q = state.productSearch.trim().toLowerCase();
  const list = state.products.filter((p) => productMatches(p, q));
  $('products-count').textContent = state.products.length + ' produit(s) · ' + list.length + ' affiché(s)';
  $('products-empty').hidden = list.length > 0;
  listEl.innerHTML = list.map(productCardHtml).join('');
}

/* featured / active instant toggles */
async function patchProduct(id, patch, okMsg) {
  const res = await api('PATCH', `/rest/v1/products?id=eq.${id}`, patch, 'return=representation');
  if (!res.ok) {
    const t = await res.text();
    toast('Échec : ' + t.slice(0, 120), true);
    return false;
  }
  const rows = await res.json().catch(() => []);
  if (Array.isArray(rows) && rows[0]) {
    const i = state.products.findIndex((p) => p.id === id);
    if (i >= 0) state.products[i] = rows[0];
  }
  renderProducts(); renderDashboard();
  if (okMsg) toast(okMsg);
  return true;
}

/* inline price / stock (OK button or Enter) */
async function inlineSaveProduct(id, field) {
  const input = $(field + '-' + id);
  if (!input) return;
  const p = state.products.find((x) => x.id === id);
  const raw = input.value;
  const v = Number(raw);
  if (raw === '' || !isFinite(v) || v < 0) { toast(field === 'price' ? 'Prix invalide.' : 'Stock invalide.', true); return; }
  const value = field === 'stock' ? Math.max(0, Math.round(v)) : Math.round(v * 1000) / 1000;
  if (p && Number(p[field]) === value) return;
  input.disabled = true;
  const done = await patchProduct(id, { [field]: value }, field === 'price' ? 'Prix mis à jour.' : 'Stock mis à jour (' + value + ').');
  input.disabled = false;
  if (!done && p) input.value = p[field];  // revert UI
}

/* ---------------- product modal ---------------- */
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
  const m = $('modal-scrim');
  if (m) { m.hidden = true; }
  state.editingProductId = null;
}

async function saveProduct(ev) {
  ev.preventDefault();
  const msg = $('pf-msg');
  const nameFr = $('pf-name-fr').value.trim();
  const priceRaw = $('pf-price').value;
  if (!nameFr) { showMsg(msg, 'Le nom (FR) est obligatoire.', 'err'); return; }
  if (priceRaw === '' || !isFinite(Number(priceRaw)) || Number(priceRaw) < 0) { showMsg(msg, 'Le prix est obligatoire (nombre ≥ 0).', 'err'); return; }
  const payload = {
    name_fr: nameFr,
    name_en: $('pf-name-en').value.trim() || nameFr,
    name_ar: $('pf-name-ar').value.trim() || nameFr,
    desc_fr: $('pf-desc-fr').value.trim() || null,
    desc_en: $('pf-desc-en').value.trim() || null,
    desc_ar: $('pf-desc-ar').value.trim() || null,
    category: $('pf-category').value,
    price: Math.round(Number(priceRaw) * 1000) / 1000,
    old_price: $('pf-old-price').value === '' ? null : Math.round(Number($('pf-old-price').value) * 1000) / 1000,
    stock: $('pf-stock').value === '' ? 0 : Math.max(0, Math.round(Number($('pf-stock').value))),
    featured: $('pf-featured').checked,
    active: $('pf-active').checked,
    image_url: $('pf-image').value.trim() || null
  };
  const btn = $('pf-save');
  btn.disabled = true;
  let error = null;
  let saved = null;
  try {
    if (state.editingProductId) {
      const res = await api('PATCH', `/rest/v1/products?id=eq.${state.editingProductId}`, payload, 'return=representation');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json().catch(() => []);
      saved = Array.isArray(rows) ? rows[0] : null;
    } else {
      const res = await api('POST', '/rest/v1/products', payload, 'return=representation');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json().catch(() => []);
      saved = Array.isArray(rows) ? rows[0] : null;
    }
  } catch (e) {
    error = e;
  }
  btn.disabled = false;
  if (error) { showMsg(msg, 'Enregistrement impossible : ' + error.message, 'err'); return; }
  const wasEdit = !!state.editingProductId;
  await loadProducts(false);
  renderProducts(); renderDashboard();
  closeProductModal();
  toast(wasEdit ? 'Produit mis à jour.' : 'Produit créé.');
}

/* ---------------- delete (confirm dialog) ---------------- */
function openConfirm(text, onYes) {
  $('confirm-text').textContent = text;
  $('confirm-scrim').hidden = false;
  state.confirmResolve = onYes;
}
function closeConfirm(yes) {
  const sc = $('confirm-scrim');
  if (sc && sc.hidden) return;
  if (sc) sc.hidden = true;
  const cb = state.confirmResolve;
  state.confirmResolve = null;
  if (yes && cb) cb();
}

async function deleteProduct(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  openConfirm(`Supprimer « ${p.name_fr || p.sku || 'produit'} » ? Cette action est définitive.`, async () => {
    try {
      const res = await api('DELETE', `/rest/v1/products?id=eq.${id}`, undefined, 'return=representation');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.products = state.products.filter((x) => x.id !== id);
      renderProducts(); renderDashboard();
      toast('Produit supprimé.');
    } catch (e) {
      toast('Suppression impossible : ' + e.message, true);
    }
  });
}

/* ============================================================
   SETTINGS
   ============================================================ */
function settingsRowHtml(f) {
  const val = state.settings[f.key] != null ? state.settings[f.key] : f.def;
  const dirAttr = f.dir ? ` dir="${f.dir}"` : '';
  const keyTag = `<span class="settings-key">${esc(f.key)}</span>`;
  let input;
  if (f.type === 'number') {
    input = `<input class="field-input" type="number" step="0.001" min="0" data-setting="${esc(f.key)}" value="${esc(val)}">`;
  } else if (f.type === 'textarea') {
    input = `<textarea class="field-input" rows="2" data-setting="${esc(f.key)}"${dirAttr} placeholder="${esc(f.placeholder || '')}">${esc(val)}</textarea>`;
  } else {
    input = `<input class="field-input" type="${f.type === 'url' ? 'url' : 'text'}" data-setting="${esc(f.key)}"${dirAttr} value="${esc(val)}" placeholder="${esc(f.placeholder || '')}">`;
  }
  return `<div class="settings-row">
    <div class="settings-col">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">${keyTag}
        <span class="field-label" style="margin:0">${esc(f.label)}${f.required ? ' *' : ''}</span></div>
      ${input}
    </div>
  </div>`;
}

function renderSettings() {
  const box = $('settings-fields');
  if (!box) return;
  let html = SETTINGS_FIELDS.map(settingsRowHtml).join('');
  // custom keys not covered above (read-only-ish text inputs, JSON preserved)
  Object.keys(state.settings).forEach((key) => {
    if (SETTINGS_KNOWN.has(key)) return;
    const v = state.settings[key];
    const asText = (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v);
    html += `<div class="settings-row settings-custom">
      <div class="settings-col">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span class="settings-key">${esc(key)}</span>
          <span class="field-label" style="margin:0">Clé personnalisée</span></div>
        <input class="field-input" type="text" data-setting="${esc(key)}" data-json="1" value="${esc(asText)}">
      </div>
    </div>`;
  });
  box.innerHTML = html;
}

async function saveSettings() {
  const msg = $('settings-msg');
  const rows = [];
  let invalid = null;
  document.querySelectorAll('#settings-fields [data-setting]').forEach((input) => {
    const key = input.dataset.setting;
    let value;
    if (input.dataset.json) {
      try { value = JSON.parse(input.value); } catch (e) { value = input.value; }
    } else if (input.type === 'number') {
      if (input.value === '') { invalid = key + ' : valeur numérique requise.'; return; }
      value = Number(input.value);
      if (!isFinite(value)) { invalid = key + ' : nombre invalide.'; return; }
    } else {
      value = input.value;
    }
    rows.push({ key, value });
  });
  if (invalid) { showMsg(msg, invalid, 'err'); return; }
  if (!rows.length) { showMsg(msg, 'Rien à enregistrer.', 'err'); return; }
  const btn = $('btn-save-settings');
  btn.disabled = true;
  try {
    const res = await api('POST', '/rest/v1/site_settings?on_conflict=key', rows, 'resolution=merge-duplicates,return=representation');
    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 120));
    await loadSettings(false);
    renderSettings();
    showMsg(msg, 'Réglages enregistrés.', 'ok');
    toast('Réglages enregistrés.');
    setTimeout(() => showMsg($('settings-msg'), ''), 3500);
  } catch (e) {
    showMsg(msg, 'Enregistrement impossible : ' + e.message, 'err');
    toast('Échec réglages : ' + e.message, true);
  }
  btn.disabled = false;
}

/* ============================================================
   REALTIME + fallback polling
   ============================================================ */
function startRealtime() {
  if (state.channel) return;
  state.channel = sb.channel('orders-admin-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
      onOrdersRealtime(payload);
    })
    .subscribe((status) => {
      state.realtimeOk = (status === 'SUBSCRIBED');
      if (state.realtimeOk) stopPolling(); else startPolling();
      setConnBar();
    });
  // safety: if the channel never confirms, fall back to polling
  setTimeout(() => { if (!state.realtimeOk && state.user) { startPolling(); setConnBar(); } }, 6000);
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
  }, POLL_MS);
}
function stopPolling() {
  if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
}

async function onOrdersRealtime(payload) {
  const row = (payload && (payload.new || payload.old)) || null;
  if (payload && payload.eventType === 'DELETE' && row && row.id) {
    state.orders = state.orders.filter((o) => o.id !== row.id);
    if (state.drawerOrderId === row.id) closeOrderDrawer();
  } else if (row && row.id) {
    const i = state.orders.findIndex((o) => o.id === row.id);
    if (i >= 0) state.orders[i] = row; else state.orders.unshift(row);
    if (state.drawerOrderId === row.id) renderOrderDrawer();
  } else {
    await loadOrders(false);
  }
  renderOrderChips();
  if (state.view === 'orders') renderOrders();
  renderDashboard();
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
    await refreshAll(true);
    toast('Données actualisées.');
  });

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.addEventListener('click', () => showView(b.dataset.nav));
  });

  // dashboard rows → drawer
  $('dash-recent').addEventListener('click', (ev) => {
    const row = ev.target.closest('[data-open-order]');
    if (!row) return;
    showView('orders');
    openOrderDrawer(row.dataset.openOrder);
  });

  // orders: chips + search + card actions
  $('orders-chips').addEventListener('click', (ev) => {
    const chip = ev.target.closest('.chip');
    if (!chip) return;
    state.orderFilter = chip.dataset.filter;
    renderOrderChips();
    renderOrders();
  });
  $('orders-search').addEventListener('input', (ev) => {
    state.orderSearch = ev.target.value;
    renderOrders();
  });
  $('btn-export-orders').addEventListener('click', exportOrdersCsv);
  $('orders-list').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'drawer') {
      openOrderDrawer(id);
    } else if (act === 'next') {
      setOrderStatus(id, btn.dataset.next);
    }
  });
  $('orders-list').addEventListener('change', (ev) => {
    const sel = ev.target.closest('[data-act="status"]');
    if (sel) setOrderStatus(sel.dataset.id, sel.value);
  });

  // drawer
  $('drawer-close').addEventListener('click', () => closeOrderDrawer());
  $('drawer-scrim').addEventListener('click', () => closeOrderDrawer());
  $('drawer-body').addEventListener('change', (ev) => {
    const sel = ev.target.closest('[data-act="status"]');
    if (sel) setOrderStatus(sel.dataset.id, sel.value);
  });
  $('drawer-body').addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act="next"]');
    if (btn) setOrderStatus(btn.dataset.id, btn.dataset.next);
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
    } else if (act === 'inline-save') {
      inlineSaveProduct(id, btn.dataset.field);
    }
  });
  $('products-list').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    const input = ev.target.closest('input[data-act="price-input"],input[data-act="stock-input"]');
    if (!input) return;
    ev.preventDefault();
    const id = input.dataset.id;
    const field = input.dataset.act === 'price-input' ? 'price' : 'stock';
    inlineSaveProduct(id, field);
  });

  $('products-list').addEventListener('change', (ev) => {
    const feat = ev.target.closest('[data-act="feat-toggle"]');
    if (feat) {
      const id = feat.dataset.id;
      const p = state.products.find((x) => x.id === id);
      if (!p) return;
      feat.checked = !!p.featured; // revert immediately; patchProduct re-renders with server truth
      patchProduct(id, { featured: !p.featured }, !p.featured ? 'Produit mis en avant.' : 'Produit retiré de la mise en avant.');
      return;
    }
    const act = ev.target.closest('[data-act="active-toggle"]');
    if (act) {
      const id = act.dataset.id;
      const p = state.products.find((x) => x.id === id);
      if (!p) return;
      act.checked = p.active !== false;
      patchProduct(id, { active: !(p.active !== false) }, !(p.active !== false) ? 'Produit activé.' : 'Produit désactivé.');
      return;
    }
    const sel = ev.target.closest('[data-act="status"]');
    if (sel) setOrderStatus(sel.dataset.id, sel.value);
  });

  // settings
  $('btn-save-settings').addEventListener('click', saveSettings);

  // confirm dialog
  $('confirm-yes').addEventListener('click', () => closeConfirm(true));
  $('confirm-no').addEventListener('click', () => closeConfirm(false));
  $('confirm-scrim').addEventListener('click', (ev) => {
    if (ev.target === $('confirm-scrim')) closeConfirm(false);
  });

  // Esc closes topmost layer
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape') return;
    if (!$('confirm-scrim').hidden) { closeConfirm(false); return; }
    if (!$('modal-scrim').hidden) { closeProductModal(); return; }
    if (!$('drawer').hidden) closeOrderDrawer();
  });

  // keep data fresh when tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.user) refreshAll(false);
  });
}

/* ============================================================
   BOOT
   ============================================================ */
async function boot() {
  wire();
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
