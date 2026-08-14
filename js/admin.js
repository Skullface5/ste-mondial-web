    // ============ SUPABASE CONFIG ============
    const SUPABASE_URL = 'https://knwpctdroogzwjrdotzo.supabase.co';
  const SUPABASE_SCHEMA = 'ste_mondial';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud3BjdGRyb29nendqcmRvdHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NzgzOTAsImV4cCI6MjEwMDU1NDM5MH0.cyw1mvxyM0eLJN7_wstkpW9h4XFjWnrcEvuq9pWk4cI';
    const tsupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: SUPABASE_SCHEMA } });

    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    const loginError = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const toast = document.getElementById('toast');

    // ============ AUTH ============
    let currentAdminEmail = '';

    async function checkSession() {
      const { data: { session } } = await tsupabase.auth.getSession();
      if (!session) return;
      const { data: isAdmin } = await tsupabase.rpc('is_admin');
      if (isAdmin) {
        currentAdminEmail = session.user.email;
        showDashboard();
      }
    }

    loginBtn.addEventListener('click', async () => {
      loginError.textContent = '';
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
      const { data: signInData, error } = await tsupabase.auth.signInWithPassword({ email, password });
      if (error) {
        loginError.textContent = 'Identifiants invalides.';
        return;
      }
      const { data: isAdmin } = await tsupabase.rpc('is_admin');
      if (!isAdmin) {
        await tsupabase.auth.signOut();
        loginError.textContent = "Accès refusé. Vous n'êtes pas administrateur.";
        return;
      }
      currentAdminEmail = signInData.user.email;
      showDashboard();
    });

    logoutBtn.addEventListener('click', async () => {
      await tsupabase.auth.signOut();
      loginScreen.style.display = 'flex';
      dashboard.style.display = 'none';
    });

    function showDashboard() {
      loginScreen.style.display = 'none';
      dashboard.style.display = 'block';
      loadAllData();
      subscribeToOrderChanges();
    }

    async function loadAllData() {
      fetchProducts();
      fetchOrders();
      fetchSettings();
    }

    async function logActivity(actionType, description) {
      try {
        await tsupabase.from('admin_activity_log').insert([{
          admin_email: currentAdminEmail,
          action_type: actionType,
          description
        }]);
      } catch (e) {
        // Logging failures shouldn't block the actual action from succeeding
        console.error('Activity log failed:', e);
      }
    }

    // ============ TAB SWITCHING ============
    const pageTitles = { products: 'Produits', orders: 'Commandes', settings: 'Paramètres', history: 'Historique' };
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(`screen-${tab}`).classList.add('active');
        document.getElementById('pageTitle').textContent = pageTitles[tab];
        document.getElementById('addProductFab').classList.toggle('hidden', tab !== 'products');
        if (tab === 'history') {
          renderArchivedOrders();
          fetchActivityLog();
        }
        window.scrollTo({ top: 0 });
      });
    });

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('active');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => toast.classList.remove('active'), 2600);
    }

    // ============ CONFIRM SHEET (replaces native confirm()) ============
    function showConfirm(message) {
      return new Promise(resolve => {
        const overlay = document.getElementById('confirmSheet');
        document.getElementById('confirmMessage').textContent = message;
        overlay.classList.add('open');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const cleanup = (result) => {
          overlay.classList.remove('open');
          okBtn.removeEventListener('click', onOk);
          cancelBtn.removeEventListener('click', onCancel);
          overlay.removeEventListener('click', onBackdrop);
          resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        const onBackdrop = (e) => { if (e.target === overlay) cleanup(false); };
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.addEventListener('click', onBackdrop);
      });
    }

    // ================= PRODUCTS =================
    let allProducts = [];
    let productSearchQuery = '';
    let productCategoryFilter = 'all';
    let productSortMode = 'newest';
    const catLabels = { homme: 'Homme', femme: 'Femme', unisexe: 'Unisexe', enfant: 'Enfant' };

    async function fetchProducts() {
      document.getElementById('productsList').innerHTML = '<div class="loading-hint">Chargement...</div>';
      const { data, error } = await tsupabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) {
        showToast('Erreur de chargement des produits');
        return;
      }
      allProducts = data || [];
      renderProductsList();
    }

    function getFilteredProducts() {
      let list = allProducts.filter(p => {
        const matchCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
        const matchSearch = !productSearchQuery || p.name.toLowerCase().includes(productSearchQuery.toLowerCase());
        return matchCat && matchSearch;
      });
      if (productSortMode === 'stock_asc') {
        list = list.slice().sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
      }
      return list;
    }

    function renderProductsList() {
      const list = document.getElementById('productsList');

      const outOfStockCount = allProducts.filter(p => (p.stock ?? 0) <= 0).length;
      const summaryBar = document.getElementById('productSummaryBar');
      if (outOfStockCount > 0) {
        document.getElementById('productSummaryText').textContent =
          `${outOfStockCount} produit${outOfStockCount > 1 ? 's' : ''} en rupture de stock`;
        summaryBar.classList.add('show');
      } else {
        summaryBar.classList.remove('show');
      }

      const filtered = getFilteredProducts();
      document.getElementById('productCount').textContent = filtered.length;

      if (allProducts.length === 0) {
        list.innerHTML = '<div class="empty-hint">Aucun produit pour le moment.</div>';
        return;
      }
      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-hint">Aucun produit ne correspond à ces filtres.</div>';
        return;
      }

      list.innerHTML = filtered.map(p => {
        let firstImg = '';
        if (p.images) {
          try {
            const imgArr = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
            firstImg = Array.isArray(imgArr) ? (imgArr[0] || '') : '';
          } catch (e) { firstImg = ''; }
        }
        const stock = p.stock ?? 0;
        const stockClass = stock <= 0 ? 'out' : stock <= 3 ? 'low' : '';
        const stockLabel = stock <= 0 ? 'Rupture de stock' : `${stock} en stock`;
        return `
      <div class="item-card">
        <div class="product-card-row">
          <div class="product-thumb">${firstImg ? `<img src="${firstImg}" alt="">` : '<i class="fas fa-spray-can-sparkles"></i>'}</div>
          <div class="product-info">
            <div class="name">${p.name}</div>
            <div class="meta">${catLabels[p.category] || p.category}</div>
            <div class="price">${parseFloat(p.price).toFixed(3).replace('.', ',')} TND</div>
            <span class="stock-badge ${stockClass}">${stockLabel}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="editProduct" data-id="${p.id}"><i class="fas fa-edit"></i> Modifier</button>
          <button class="deleteProduct danger-action" data-id="${p.id}"><i class="fas fa-trash"></i> Supprimer</button>
        </div>
      </div>`;
      }).join('');

      document.querySelectorAll('.editProduct').forEach(btn => btn.addEventListener('click', () => editProduct(btn.dataset.id)));
      document.querySelectorAll('.deleteProduct').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.id)));
    }

    document.getElementById('productSearch').addEventListener('input', (e) => {
      productSearchQuery = e.target.value;
      document.getElementById('clearProductSearch').classList.toggle('show', !!productSearchQuery);
      renderProductsList();
    });
    document.getElementById('clearProductSearch').addEventListener('click', () => {
      document.getElementById('productSearch').value = '';
      productSearchQuery = '';
      document.getElementById('clearProductSearch').classList.remove('show');
      renderProductsList();
    });
    document.getElementById('productChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#productChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      productCategoryFilter = chip.dataset.cat;
      renderProductsList();
    });
    document.getElementById('productSort').addEventListener('change', (e) => {
      productSortMode = e.target.value;
      renderProductsList();
    });

    async function deleteProduct(id) {
      if (!(await showConfirm('Supprimer définitivement ce produit ?'))) return;
      const { error } = await tsupabase.from('products').delete().eq('id', id);
      if (error) showToast('Erreur : ' + error.message);
      else {
        showToast('Produit supprimé');
        fetchProducts();
      }
    }

    function editProduct(id) {
      const product = allProducts.find(p => p.id == id);
      if (!product) return;
      document.getElementById('productId').value = product.id;
      document.getElementById('prodName').value = product.name;
      document.getElementById('prodCategory').value = product.category;
      document.getElementById('prodPrice').value = product.price;
      document.getElementById('prodStock').value = product.stock ?? 0;
      let imgList = [];
      if (product.images) {
        try { imgList = typeof product.images === 'string' ? JSON.parse(product.images) : product.images; }
        catch (e) { imgList = []; }
      }
      currentEditImages = Array.isArray(imgList) ? imgList.slice() : [];
      renderImageStrip();
      document.getElementById('uploadStatus').textContent = '';
      document.getElementById('formTitle').textContent = 'Modifier le produit';
      openProductSheet();
    }

    function openProductSheet() { document.getElementById('productSheet').classList.add('open'); }
    function closeProductSheet() { document.getElementById('productSheet').classList.remove('open'); }

    document.getElementById('addProductFab').addEventListener('click', () => {
      document.getElementById('productForm').reset();
      document.getElementById('productId').value = '';
      currentEditImages = [];
      renderImageStrip();
      document.getElementById('uploadStatus').textContent = '';
      document.getElementById('formTitle').textContent = 'Ajouter un produit';
      openProductSheet();
    });

    document.getElementById('cancelProductForm').addEventListener('click', closeProductSheet);
    document.getElementById('productSheet').addEventListener('click', (e) => {
      if (e.target.id === 'productSheet') closeProductSheet();
    });

    // ---- Image management: a working list of URLs, edited via thumbnail strip ----
    let currentEditImages = [];
    let isUploadingImages = false;

    function renderImageStrip() {
      const strip = document.getElementById('imageThumbStrip');
      if (currentEditImages.length === 0) {
        strip.innerHTML = '<div class="image-strip-empty">Aucune image pour ce produit.</div>';
        return;
      }
      strip.innerHTML = currentEditImages.map((url, idx) => `
        <div class="image-thumb-item">
          <img src="${url}" alt="">
          <button type="button" class="remove-image-btn" data-idx="${idx}"><i class="fas fa-times"></i></button>
        </div>`).join('');
      strip.querySelectorAll('.remove-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentEditImages.splice(parseInt(btn.dataset.idx, 10), 1);
          renderImageStrip();
        });
      });
    }

    document.getElementById('removeAllImagesBtn').addEventListener('click', async () => {
      if (currentEditImages.length === 0) return;
      if (!(await showConfirm('Retirer toutes les images de ce produit ?'))) return;
      currentEditImages = [];
      renderImageStrip();
    });

    document.getElementById('addImageUrlBtn').addEventListener('click', () => {
      const input = document.getElementById('newImageUrl');
      const url = input.value.trim();
      if (!url) return;
      currentEditImages.push(url);
      input.value = '';
      renderImageStrip();
    });

    async function uploadImage(file) {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await tsupabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = tsupabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      return publicUrl;
    }

    document.getElementById('imageFile').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;
      const status = document.getElementById('uploadStatus');
      isUploadingImages = true;
      let failCount = 0;
      for (let i = 0; i < files.length; i++) {
        status.textContent = `Upload ${i + 1}/${files.length}...`;
        try {
          const url = await uploadImage(files[i]);
          currentEditImages.push(url);
          renderImageStrip();
        } catch (err) {
          failCount++;
        }
      }
      isUploadingImages = false;
      status.textContent = failCount > 0
        ? `${files.length - failCount}/${files.length} photo(s) téléversée(s), ${failCount} échec(s)`
        : '✓ Photos ajoutées';
      e.target.value = '';
    });

    document.getElementById('productForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isUploadingImages) {
        showToast('Veuillez attendre la fin du téléversement des photos');
        return;
      }
      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      const id = document.getElementById('productId').value;
      const productData = {
        name: document.getElementById('prodName').value,
        category: document.getElementById('prodCategory').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value) || 0,
        images: JSON.stringify(currentEditImages),
      };

      let result;
      if (id) result = await tsupabase.from('products').update(productData).eq('id', id);
      else result = await tsupabase.from('products').insert([productData]);

      if (submitBtn) submitBtn.disabled = false;

      if (result.error) {
        showToast('Erreur : ' + result.error.message);
      } else {
        logActivity(id ? 'product_updated' : 'product_created', `Produit ${id ? 'modifié' : 'créé'} : ${productData.name}`);
        closeProductSheet();
        fetchProducts();
        showToast('Produit enregistré');
      }
    });


    // ================= ORDERS =================
    let allOrders = [];
    let orderSearchQuery = '';
    let orderStatusFilter = 'all';
    let orderSortMode = 'newest';
    const newOrderIds = new Set();

    const statusLabels = {
      pending: 'En attente',
      under_review: 'En vérification',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };

    function formatOrderNumber(id) {
      const str = String(id);
      return /^\d+$/.test(str) ? '#' + str.padStart(4, '0') : '#' + str.slice(0, 8);
    }

    async function fetchOrders() {
      document.getElementById('ordersList').innerHTML = '<div class="loading-hint">Chargement...</div>';
      const { data, error } = await tsupabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) {
        showToast('Erreur de chargement des commandes');
        return;
      }
      allOrders = data || [];
      renderOrdersList();
    }

    function getFilteredOrders() {
      let list = allOrders.filter(o => {
        const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
        if (!orderSearchQuery) return matchStatus;
        const q = orderSearchQuery.toLowerCase();
        const matchSearch =
          (o.customer_name || '').toLowerCase().includes(q) ||
          (o.customer_phone || '').toLowerCase().includes(q) ||
          formatOrderNumber(o.id).toLowerCase().includes(q) ||
          String(o.id).toLowerCase().includes(q);
        return matchStatus && matchSearch;
      });
      list = list.slice().sort((a, b) => {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return orderSortMode === 'oldest' ? da - db : db - da;
      });
      return list;
    }

    function updateOrdersBadge() {
      const count = allOrders.filter(o => o.status === 'pending' || o.status === 'under_review').length;
      const badge = document.getElementById('ordersNavBadge');
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
      const summaryBar = document.getElementById('orderSummaryBar');
      if (count > 0) {
        document.getElementById('orderSummaryText').textContent =
          `${count} commande${count > 1 ? 's' : ''} à traiter (en attente / en vérification)`;
        summaryBar.classList.add('show');
      } else {
        summaryBar.classList.remove('show');
      }
    }

    function renderOrdersList() {
      const list = document.getElementById('ordersList');
      updateOrdersBadge();

      const filtered = getFilteredOrders();
      document.getElementById('orderCount').textContent = filtered.length;

      if (allOrders.length === 0) {
        list.innerHTML = '<div class="empty-hint">Aucune commande pour le moment.</div>';
        return;
      }
      if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-hint">Aucune commande ne correspond à ces filtres.</div>';
        return;
      }

      list.innerHTML = filtered.map(o => {
        let items = [];
        if (o.items) {
          try { items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items; }
          catch (e) { items = []; }
        }
        const itemsHtml = Array.isArray(items) && items.length
          ? `<ul class="order-items-list">${items.map(i => `<li>${i.name} &times; ${i.qty} <span>${(parseFloat(i.price) * i.qty).toFixed(3).replace('.', ',')} TND</span></li>`).join('')}</ul>`
          : '<span style="opacity:0.6;">Aucun article enregistré</span>';
        const detailsId = `order-details-${o.id}`;
        const isNew = newOrderIds.has(o.id);
        return `
      <div class="item-card">
        ${isNew ? '<span class="new-tag">Nouveau</span>' : ''}
        <div class="order-card-top" data-target="${detailsId}" data-id="${o.id}">
          <div>
            <div class="order-id">${formatOrderNumber(o.id)}</div>
            <div class="order-name">${o.customer_name || 'Inconnu'}</div>
          </div>
          <div class="order-total">${parseFloat(o.total).toFixed(3).replace('.', ',')} TND</div>
        </div>
        <div class="order-card-meta">
          <span class="order-date">${o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</span>
          <select class="status-select" data-id="${o.id}">
            ${Object.keys(statusLabels).map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
          </select>
        </div>
        <div class="order-details" id="${detailsId}">
          <strong>Téléphone</strong>${o.customer_phone || '—'}
          <strong>Email</strong>${o.customer_email || '—'}
          <strong>Adresse</strong>${o.shipping_address || '—'}
          <strong>Articles</strong>${itemsHtml}
          <div class="card-actions">
            <button class="deleteOrder danger-action" data-id="${o.id}"><i class="fas fa-trash"></i> Supprimer la commande</button>
          </div>
        </div>
      </div>`;
      }).join('');

      document.querySelectorAll('.order-card-top').forEach(top => {
        top.addEventListener('click', () => {
          document.getElementById(top.dataset.target).classList.toggle('open');
          if (newOrderIds.has(top.dataset.id)) {
            newOrderIds.delete(top.dataset.id);
            renderOrdersList();
          }
        });
      });

      document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('click', (e) => e.stopPropagation());
        select.addEventListener('change', async (e) => {
          const { error } = await tsupabase.from('orders').update({ status: e.target.value }).eq('id', e.target.dataset.id);
          showToast(error ? 'Erreur' : 'Statut mis à jour');
        });
      });

      document.querySelectorAll('.deleteOrder').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!(await showConfirm('Supprimer cette commande ?'))) return;
          const { error } = await tsupabase.from('orders').delete().eq('id', btn.dataset.id);
          if (error) showToast('Erreur');
          else showToast('Commande supprimée');
        });
      });
    }

    document.getElementById('orderSearch').addEventListener('input', (e) => {
      orderSearchQuery = e.target.value;
      document.getElementById('clearOrderSearch').classList.toggle('show', !!orderSearchQuery);
      renderOrdersList();
    });
    document.getElementById('clearOrderSearch').addEventListener('click', () => {
      document.getElementById('orderSearch').value = '';
      orderSearchQuery = '';
      document.getElementById('clearOrderSearch').classList.remove('show');
      renderOrdersList();
    });
    document.getElementById('orderChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#orderChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      orderStatusFilter = chip.dataset.status;
      renderOrdersList();
    });
    document.getElementById('orderSort').addEventListener('change', (e) => {
      orderSortMode = e.target.value;
      renderOrdersList();
    });

    // ============ REALTIME: live order updates ============
    function subscribeToOrderChanges() {
      tsupabase.channel('admin-orders-changes')
        .on('postgres_changes', { event: '*', schema: 'ste_mondial', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            allOrders.unshift(payload.new);
            newOrderIds.add(payload.new.id);
            showToast('🔔 Nouvelle commande reçue');
          } else if (payload.eventType === 'UPDATE') {
            const idx = allOrders.findIndex(o => o.id === payload.new.id);
            if (idx !== -1) allOrders[idx] = payload.new;
          } else if (payload.eventType === 'DELETE') {
            allOrders = allOrders.filter(o => o.id !== payload.old.id);
          }
          renderOrdersList();
          renderArchivedOrders();
        })
        .subscribe();
    }

    // ================= HISTORY =================
    document.getElementById('historyChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      document.querySelectorAll('#historyChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const view = chip.dataset.view;
      document.getElementById('archivedOrdersList').style.display = view === 'archived' ? '' : 'none';
      document.getElementById('activityLogList').style.display = view === 'log' ? '' : 'none';
    });

    // Reuses allOrders (already kept live via fetchOrders + realtime) rather than a
    // separate query — just filters down to the "finished" statuses.
    function renderArchivedOrders() {
      const list = document.getElementById('archivedOrdersList');
      const archived = allOrders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

      if (archived.length === 0) {
        list.innerHTML = '<div class="empty-hint">Aucune commande archivée pour le moment.</div>';
        return;
      }

      list.innerHTML = archived.map(o => {
        let items = [];
        if (o.items) {
          try { items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items; }
          catch (e) { items = []; }
        }
        const itemsHtml = Array.isArray(items) && items.length
          ? `<ul class="order-items-list">${items.map(i => `<li>${i.name} &times; ${i.qty} <span>${(parseFloat(i.price) * i.qty).toFixed(3).replace('.', ',')} TND</span></li>`).join('')}</ul>`
          : '<span style="opacity:0.6;">Aucun article enregistré</span>';
        // Prefixed IDs so these don't collide with the live cards on the Commandes tab
        const detailsId = `hist-order-details-${o.id}`;
        return `
      <div class="item-card">
        <div class="order-card-top" data-target="${detailsId}">
          <div>
            <div class="order-id">${formatOrderNumber(o.id)}</div>
            <div class="order-name">${o.customer_name || 'Inconnu'}</div>
          </div>
          <div class="order-total">${parseFloat(o.total).toFixed(3).replace('.', ',')} TND</div>
        </div>
        <div class="order-card-meta">
          <span class="order-date">${o.created_at ? new Date(o.created_at).toLocaleDateString() : ''}</span>
          <span class="stock-badge ${o.status === 'cancelled' ? 'out' : ''}">${statusLabels[o.status] || o.status}</span>
        </div>
        <div class="order-details" id="${detailsId}">
          <strong>Téléphone</strong>${o.customer_phone || '—'}
          <strong>Email</strong>${o.customer_email || '—'}
          <strong>Adresse</strong>${o.shipping_address || '—'}
          <strong>Articles</strong>${itemsHtml}
        </div>
      </div>`;
      }).join('');

      list.querySelectorAll('.order-card-top').forEach(top => {
        top.addEventListener('click', () => {
          document.getElementById(top.dataset.target).classList.toggle('open');
        });
      });
    }

    async function fetchActivityLog() {
      const list = document.getElementById('activityLogList');
      list.innerHTML = '<div class="loading-hint">Chargement...</div>';
      const { data, error } = await tsupabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        list.innerHTML = '<div class="empty-hint">Impossible de charger le journal.</div>';
        return;
      }
      renderActivityLog(data || []);
    }

    function renderActivityLog(entries) {
      const list = document.getElementById('activityLogList');
      if (entries.length === 0) {
        list.innerHTML = '<div class="empty-hint">Aucune activité enregistrée pour le moment.</div>';
        return;
      }
      const iconMap = {
        product_created: 'fa-plus', product_updated: 'fa-edit', product_deleted: 'fa-trash',
        order_status_changed: 'fa-truck', order_deleted: 'fa-trash', settings_updated: 'fa-gear'
      };
      list.innerHTML = entries.map(entry => `
        <div class="item-card activity-item">
          <div class="activity-icon"><i class="fas ${iconMap[entry.action_type] || 'fa-circle-info'}"></i></div>
          <div class="activity-body">
            <div class="activity-desc">${entry.description}</div>
            <div class="activity-meta">${entry.admin_email || 'Admin'} · ${new Date(entry.created_at).toLocaleString()}</div>
          </div>
        </div>`).join('');
    }

    // ================= SETTINGS =================
    async function fetchSettings() {
      const { data } = await tsupabase.from('site_settings').select('*');
      if (!data) return;
      const map = {};
      data.forEach(r => { map[r.key] = r.value; });
      document.getElementById('heroImage').value = map.hero_image || '';
      document.getElementById('contactPhone').value = map.contact_phone || '';
      document.getElementById('contactEmail').value = map.contact_email || '';
      document.getElementById('contactAddress').value = map.contact_address || '';
      document.getElementById('socialInstagram').value = map.social_instagram || '';
      document.getElementById('socialFacebook').value = map.social_facebook || '';
      document.getElementById('socialTiktok').value = map.social_tiktok || '';
    }

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = [
        { key: 'hero_image', value: document.getElementById('heroImage').value },
        { key: 'contact_phone', value: document.getElementById('contactPhone').value },
        { key: 'contact_email', value: document.getElementById('contactEmail').value },
        { key: 'contact_address', value: document.getElementById('contactAddress').value },
        { key: 'social_instagram', value: document.getElementById('socialInstagram').value },
        { key: 'social_facebook', value: document.getElementById('socialFacebook').value },
        { key: 'social_tiktok', value: document.getElementById('socialTiktok').value },
      ];
      for (const s of rows) {
        const { error } = await tsupabase.from('site_settings').upsert(s, { onConflict: 'key' });
        if (error) { showToast('Erreur : ' + error.message); return; }
      }
      showToast('Paramètres sauvegardés');
    });

    // ================= THEME =================
    function initTheme() {
      const saved = localStorage.getItem('smp_theme') || 'light';
      if (saved === 'dark') {
        document.body.classList.add('dark');
        document.querySelector('#themeToggle i').classList.replace('fa-moon', 'fa-sun');
      }
    }
    document.getElementById('themeToggle').addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('smp_theme', isDark ? 'dark' : 'light');
      const icon = document.querySelector('#themeToggle i');
      icon.classList.toggle('fa-moon', !isDark);
      icon.classList.toggle('fa-sun', isDark);
    });
    initTheme();

    checkSession();
