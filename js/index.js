    // ============ SUPABASE CONFIG ============
    const SUPABASE_URL = 'https://knwpctdroogzwjrdotzo.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud3BjdGRyb29nendqcmRvdHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NzgzOTAsImV4cCI6MjEwMDU1NDM5MH0.cyw1mvxyM0eLJN7_wstkpW9h4XFjWnrcEvuq9pWk4cI';
    const tsupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let allProducts = [];
    let shuffledProducts = [];
    let isLoadingProducts = true;
    let currentLang = localStorage.getItem('smp_lang') || 'fr';
    let cart = JSON.parse(localStorage.getItem('smp_cart') || '[]');
    let activeCategory = 'all';
    let searchQuery = '';

    const translations = {
      fr: {
        brandSub: 'Maison de Parfum', profileTotalOrders: 'Commandes', profileMemberSince: 'Membre depuis',
        navCollection: 'La Collection', navUnivers: 'Univers', navContact: 'Contact',
        searchPh: 'Rechercher un parfum...',
        heroEyebrow: 'Maison de Parfum',
        heroTitle: "L'élégance<br><em>n'a pas de frontière.</em>",
        tagline: "L'élégance intemporelle, en chaque souffle.",
        ctaExplore: 'Découvrir la collection', ctaStory: 'Notre univers', ctaDiscover: 'Découvrir',
        promoEyebrow: 'Édition en vedette',
        promoTitle: 'Une édition pensée pour l\'instant présent.',
        collectionEyebrow: 'La Collection',
        catAll: 'Tout', catMan: 'Homme', catWoman: 'Femme', catUnisex: 'Unisexe', catKids: 'Enfant',
        addToCart: 'Ajouter',
        outOfStock: 'Rupture de stock', lowStock: 'Plus que {n} en stock', stockLimitReached: 'Stock maximum atteint pour cet article.',
        toastAdded: 'Ajouté au panier', toastEmpty: 'Votre panier est vide', toastOrder: 'Commande enregistrée — nous vous contacterons bientôt.',
        noResults: 'Aucun parfum ne correspond à votre recherche.',
        cartTitle: 'Votre panier', cartTotal: 'Total', cartCheckout: 'Commander', cartEmpty: 'Votre panier est vide.',
        checkoutTitle: 'Finaliser la commande',
        fieldName: 'Nom complet', fieldPhone: 'Téléphone', fieldEmail: 'Email', fieldAddress: 'Adresse de livraison',
        footerBlurb: "L'élégance intemporelle, en chaque souffle — une maison de parfum sans frontières.",
        footerNavH: 'Navigation', footerCatH: 'Catégories', footerContactH: 'Contact',
        footerAddress: 'Tunis, Tunisie', footerRights: 'Tous droits réservés.',
        footerTagline: "L'élégance intemporelle, en chaque souffle.",
        themeLabelDark: 'Mode sombre', themeLabelLight: 'Mode clair',
        photoPlaceholder: 'Photo à venir',
        authSubtitle: 'Votre espace Ste Mondial Parfums',
        tabLogin: 'Connexion', tabSignup: 'Créer un compte',
        fieldPassword: 'Mot de passe', fieldFullName: 'Nom complet',
        btnLogin: 'Se connecter', btnSignup: 'Créer mon compte',
        authNoAccount: 'Pas encore de compte ?', authHasAccount: 'Déjà un compte ?',
        accountLogout: 'Se déconnecter',
        toastLoginSuccess: 'Ravis de vous revoir.', toastLoginError: 'Email ou mot de passe incorrect.',
        toastSignupCheckEmail: 'Compte créé — vérifiez vos emails pour confirmer.',
        toastSignupSuccess: 'Bienvenue dans la maison.',
        toastLogout: 'Vous êtes déconnecté(e).',
        accountMyOrders: 'Mes commandes',
        profileBack: 'Retour à la boutique', profileTitle: 'Mon Compte',
        profileOrdersLabel: 'Historique des commandes',
        profileEmpty: 'Vous n\'avez pas encore de commande.',
        profileLoading: 'Chargement de vos commandes...',
        orderTotalLabel: 'Total',
        statusPending: 'En attente', statusUnderReview: 'En cours de vérification', statusConfirmed: 'Confirmée', statusShipped: 'Expédiée',
        statusDelivered: 'Livrée', statusCancelled: 'Annulée'
      },
      en: {
        brandSub: 'Perfume House', profileTotalOrders: 'Orders', profileMemberSince: 'Member since',
        navCollection: 'The Collection', navUnivers: 'Our World', navContact: 'Contact',
        searchPh: 'Search a fragrance...',
        heroEyebrow: 'Perfume House',
        heroTitle: 'Elegance<br><em>knows no border.</em>',
        tagline: 'Timeless elegance, in every breath.',
        ctaExplore: 'Discover the collection', ctaStory: 'Our world', ctaDiscover: 'Discover',
        promoEyebrow: 'Featured edition',
        promoTitle: 'An edition crafted for the here and now.',
        collectionEyebrow: 'The Collection',
        catAll: 'All', catMan: 'Men', catWoman: 'Women', catUnisex: 'Unisex', catKids: 'Kids',
        addToCart: 'Add',
        outOfStock: 'Out of stock', lowStock: 'Only {n} left in stock', stockLimitReached: 'You\'ve reached the available stock for this item.',
        toastAdded: 'Added to cart', toastEmpty: 'Your cart is empty', toastOrder: 'Order recorded — we will contact you soon.',
        noResults: 'No fragrance matches your search.',
        cartTitle: 'Your cart', cartTotal: 'Total', cartCheckout: 'Checkout', cartEmpty: 'Your cart is empty.',
        checkoutTitle: 'Complete your order',
        fieldName: 'Full name', fieldPhone: 'Phone', fieldEmail: 'Email', fieldAddress: 'Delivery address',
        footerBlurb: 'Timeless elegance, in every breath — a perfume house without borders.',
        footerNavH: 'Navigation', footerCatH: 'Categories', footerContactH: 'Contact',
        footerAddress: 'Tunis, Tunisia', footerRights: 'All rights reserved.',
        footerTagline: 'Timeless elegance, in every breath.',
        themeLabelDark: 'Dark mode', themeLabelLight: 'Light mode',
        photoPlaceholder: 'Photo coming soon',
        authSubtitle: 'Your Ste Mondial Parfums account',
        tabLogin: 'Sign in', tabSignup: 'Create account',
        fieldPassword: 'Password', fieldFullName: 'Full name',
        btnLogin: 'Sign in', btnSignup: 'Create my account',
        authNoAccount: "Don't have an account yet?", authHasAccount: 'Already have an account?',
        accountLogout: 'Sign out',
        toastLoginSuccess: 'Welcome back.', toastLoginError: 'Incorrect email or password.',
        toastSignupCheckEmail: 'Account created — check your email to confirm.',
        toastSignupSuccess: 'Welcome to the house.',
        toastLogout: 'You have been signed out.',
        accountMyOrders: 'My orders',
        profileBack: 'Back to the shop', profileTitle: 'My Account',
        profileOrdersLabel: 'Order history',
        profileEmpty: 'You have no orders yet.',
        profileLoading: 'Loading your orders...',
        orderTotalLabel: 'Total',
        statusPending: 'Pending', statusUnderReview: 'Under review', statusConfirmed: 'Confirmed', statusShipped: 'Shipped',
        statusDelivered: 'Delivered', statusCancelled: 'Cancelled'
      },
      ar: {
        brandSub: 'دار العطور', profileTotalOrders: 'الطلبات', profileMemberSince: 'عضو منذ',
        navCollection: 'المجموعة', navUnivers: 'عالمنا', navContact: 'اتصل بنا',
        searchPh: 'ابحث عن عطر...',
        heroEyebrow: 'دار العطور',
        heroTitle: 'الأناقة<br><em>بلا حدود.</em>',
        tagline: 'أناقة خالدة، في كل نفس.',
        ctaExplore: 'اكتشف المجموعة', ctaStory: 'عالمنا', ctaDiscover: 'اكتشف',
        promoEyebrow: 'إصدار مميز',
        promoTitle: 'إصدار صُمم للحظة الحاضرة.',
        collectionEyebrow: 'المجموعة',
        catAll: 'الكل', catMan: 'رجالي', catWoman: 'نسائي', catUnisex: 'للجنسين', catKids: 'أطفال',
        addToCart: 'أضف',
        outOfStock: 'نفدت الكمية', lowStock: 'تبقى {n} فقط في المخزون', stockLimitReached: 'لقد وصلت إلى الحد الأقصى المتوفر من هذا المنتج.',
        toastAdded: 'أضيف إلى السلة', toastEmpty: 'سلتك فارغة', toastOrder: 'تم تسجيل الطلب — سنتواصل معك قريبًا.',
        noResults: 'لا يوجد عطر يطابق بحثك.',
        cartTitle: 'سلتك', cartTotal: 'المجموع', cartCheckout: 'إتمام الطلب', cartEmpty: 'سلتك فارغة.',
        checkoutTitle: 'إتمام الطلب',
        fieldName: 'الاسم الكامل', fieldPhone: 'الهاتف', fieldEmail: 'البريد الإلكتروني', fieldAddress: 'عنوان التوصيل',
        footerBlurb: 'أناقة خالدة، في كل نفس — دار عطور بلا حدود.',
        footerNavH: 'التصفح', footerCatH: 'الفئات', footerContactH: 'اتصل بنا',
        footerAddress: 'تونس، تونس', footerRights: 'جميع الحقوق محفوظة.',
        footerTagline: 'أناقة خالدة، في كل نفس.',
        themeLabelDark: 'الوضع الداكن', themeLabelLight: 'الوضع الفاتح',
        photoPlaceholder: 'الصورة قريبًا',
        authSubtitle: 'مساحتك في Ste Mondial Parfums',
        tabLogin: 'تسجيل الدخول', tabSignup: 'إنشاء حساب',
        fieldPassword: 'كلمة المرور', fieldFullName: 'الاسم الكامل',
        btnLogin: 'تسجيل الدخول', btnSignup: 'إنشاء حسابي',
        authNoAccount: 'ليس لديك حساب بعد؟', authHasAccount: 'لديك حساب بالفعل؟',
        accountLogout: 'تسجيل الخروج',
        toastLoginSuccess: 'سعداء بعودتك.', toastLoginError: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
        toastSignupCheckEmail: 'تم إنشاء الحساب — تحقق من بريدك الإلكتروني للتأكيد.',
        toastSignupSuccess: 'مرحبًا بك في الدار.',
        toastLogout: 'تم تسجيل خروجك.',
        accountMyOrders: 'طلباتي',
        profileBack: 'العودة إلى المتجر', profileTitle: 'حسابي',
        profileOrdersLabel: 'سجل الطلبات',
        profileEmpty: 'ليس لديك أي طلبات بعد.',
        profileLoading: 'جارٍ تحميل طلباتك...',
        orderTotalLabel: 'المجموع',
        statusPending: 'قيد الانتظار', statusUnderReview: 'قيد المراجعة', statusConfirmed: 'مؤكدة', statusShipped: 'تم الشحن',
        statusDelivered: 'تم التوصيل', statusCancelled: 'ملغاة'
      }
    };

    function applyTranslations() {
      const t = translations[currentLang];
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
      });
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        if (t[key]) el.innerHTML = t[key];
      });
      document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (t[key]) el.placeholder = t[key];
      });
      document.documentElement.lang = currentLang;
      document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
      renderCompass();
      renderProductGrid();
      renderCart();
      updateLangButtonStates();
      updateThemeLabel();
      syncSearchIcon();
      applySiteSettings();
      if (typeof renderOrders === 'function' && lastOrders.length) renderOrders(lastOrders);
    }

    function updateLangButtonStates() {
      document.querySelectorAll('.lang-menu button, .mobile-lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
      });
    }

    document.querySelectorAll('.lang-menu button, .mobile-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentLang = btn.dataset.lang;
        localStorage.setItem('smp_lang', currentLang);
        document.getElementById('langMenu').classList.remove('active');
        applyTranslations();
      });
    });
    updateLangButtonStates();

    // ============ CATEGORY TABS ============
    const catKeyMap = {
      all: 'catAll',
      homme: 'catMan',
      femme: 'catWoman',
      unisexe: 'catUnisex',
      enfant: 'catKids'
    };

    function renderCompass() {
      const t = translations[currentLang];
      const compass = document.getElementById('compass');
      compass.innerHTML = Object.keys(catKeyMap).map(cat =>
        `<button class="${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">${t[catKeyMap[cat]]}</button>`
      ).join('');
      compass.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCategory = btn.dataset.cat;
          currentPage = 1;
          renderCompass();
          renderProductGrid();
        });
      });
    }

    // ============ FETCH PRODUCTS ============
    const PAGE_SIZE = 16;
    let currentPage = 1;

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    async function fetchProducts() {
      isLoadingProducts = true;
      renderProductGrid();
      try {
        const { data, error } = await tsupabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        allProducts = data.map(p => {
          let firstImage = '';
          if (p.images) {
            try {
              const imgArr = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
              firstImage = Array.isArray(imgArr) ? imgArr[0] || '' : '';
            } catch (e) { firstImage = ''; }
          }
          return { ...p, firstImage };
        });
        // Shuffled once per page load
        shuffledProducts = shuffleArray(allProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        allProducts = [];
        shuffledProducts = [];
      } finally {
        isLoadingProducts = false;
        renderProductGrid();
      }
    }

    function getCategoryFiltered() {
      return shuffledProducts.filter(p => activeCategory === 'all' || p.category === activeCategory);
    }

    function renderProductGrid() {
      const grid = document.getElementById('productGrid');
      if (!grid) return;
      const t = translations[currentLang];

      if (isLoadingProducts) {
        let html = '';
        for (let i = 0; i < 8; i++) {
          html += `
            <div class="product-skeleton">
              <div class="skeleton-media shimmer"></div>
              <div class="skeleton-line shimmer" style="width:60%; height:0.8rem; margin-top:1rem;"></div>
              <div class="skeleton-line shimmer" style="width:40%; height:0.6rem; margin-top:0.5rem;"></div>
              <div class="skeleton-line shimmer" style="width:55%; height:1rem; margin-top:0.8rem;"></div>
              <div class="skeleton-btn shimmer" style="width:100%; height:2.2rem; margin-top:1rem;"></div>
            </div>`;
        }
        grid.innerHTML = html;
        renderPagination(0);
        return;
      }

      const filtered = getCategoryFiltered();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentPage > totalPages) currentPage = totalPages;
      const products = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

      if (products.length === 0) {
        grid.innerHTML = `<div class="empty-state">${t.noResults}</div>`;
        renderPagination(0);
        return;
      }

      grid.innerHTML = products.map(p => {
        const imgHtml = p.firstImage ? `<img src="${p.firstImage}" alt="" loading="lazy">` : `<span>${t.photoPlaceholder}</span>`;
        const catName = t[catKeyMap[p.category]] || p.category;
        const inStock = typeof p.stock !== 'number' || p.stock > 0;
        const lowStock = typeof p.stock === 'number' && p.stock > 0 && p.stock <= 3;
        const stockNote = !inStock
          ? `<div class="stock-note out">${t.outOfStock}</div>`
          : lowStock
            ? `<div class="stock-note low">${t.lowStock.replace('{n}', p.stock)}</div>`
            : '';
        return `
    <a href="product.html?id=${p.id}" class="product-card" style="display:block; text-decoration:none; color:inherit;">
      <div class="product-media">${imgHtml}</div>
      <div class="product-ref">${catName}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">${parseFloat(p.price).toFixed(3).replace('.', ',')} TND</div>
      ${stockNote}
      <button class="product-add" data-id="${p.id}" ${inStock ? '' : 'disabled'}>${inStock ? t.addToCart : t.outOfStock}</button>
    </a>
  `;
      }).join('');

      grid.querySelectorAll('.product-add:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();    // stop the link from being followed
          e.stopPropagation();   // stop the click from reaching the <a>
          addToCart(btn.dataset.id);
        });
      });

      renderPagination(filtered.length);
    }
    function renderPagination(totalItems) {
      const container = document.getElementById('productPagination');
      if (!container) return;
      const totalPages = Math.ceil(totalItems / PAGE_SIZE);
      if (totalPages <= 1) { container.innerHTML = ''; return; }

      function pageBtn(page, label, disabled, active) {
        return `<button class="page-btn${active ? ' active' : ''}" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`;
      }

      let pages = [];
      const windowSize = 1;
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= windowSize) {
          pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
          pages.push('...');
        }
      }

      let html = pageBtn(currentPage - 1, '<i class="fas fa-chevron-left"></i>', currentPage === 1, false);
      pages.forEach(p => {
        html += p === '...' ? `<span class="page-ellipsis">…</span>` : pageBtn(p, p, false, p === currentPage);
      });
      html += pageBtn(currentPage + 1, '<i class="fas fa-chevron-right"></i>', currentPage === totalPages, false);

      container.innerHTML = html;
      container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = parseInt(btn.dataset.page, 10);
          renderProductGrid();
          document.getElementById('collection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    // ============ CART ============
    function saveCart() { localStorage.setItem('smp_cart', JSON.stringify(cart)); }

    function addToCart(id) {
      const product = allProducts.find(p => p.id == id);
      if (!product) return;
      const hasStockLimit = typeof product.stock === 'number';
      if (hasStockLimit && product.stock <= 0) {
        showToast(translations[currentLang].outOfStock);
        return;
      }
      const existing = cart.find(i => i.id == id);
      const currentQty = existing ? existing.qty : 0;
      if (hasStockLimit && currentQty >= product.stock) {
        showToast(translations[currentLang].stockLimitReached);
        return;
      }
      if (existing) existing.qty += 1;
      else cart.push({ id: product.id, name: product.name, price: parseFloat(product.price), qty: 1 });
      saveCart();
      renderCart();
      showToast(translations[currentLang].toastAdded);
    }

    function updateQty(id, delta) {
      const item = cart.find(i => i.id == id);
      if (!item) return;
      if (delta > 0) {
        const product = allProducts.find(p => p.id == id);
        if (product && typeof product.stock === 'number' && item.qty >= product.stock) {
          showToast(translations[currentLang].stockLimitReached);
          return;
        }
      }
      item.qty += delta;
      if (item.qty <= 0) cart = cart.filter(i => i.id != id);
      saveCart();
      renderCart();
    }

    function removeItem(id) {
      cart = cart.filter(i => i.id != id);
      saveCart();
      renderCart();
    }

    function cartTotal() { return cart.reduce((sum, i) => sum + i.price * i.qty, 0); }

    function renderCart() {
      const t = translations[currentLang];
      const container = document.getElementById('cartItems');
      document.getElementById('cartCount').textContent = cart.reduce((s, i) => s + i.qty, 0);
      document.getElementById('cartTotalValue').textContent = cartTotal().toFixed(3).replace('.', ',') + ' TND';

      if (cart.length === 0) {
        container.innerHTML = `<div class="cart-empty">${t.cartEmpty}</div>`;
        return;
      }

      container.innerHTML = cart.map(i => `
        <div class="cart-item">
          <div class="cart-item-img"><i class="fas fa-spray-can-sparkles"></i></div>
          <div class="cart-item-info">
            <b>${i.name}</b>
            <small>${i.price.toFixed(3).replace('.', ',')} TND</small>
            <div class="qty-row">
              <button class="qty-btn" data-action="dec" data-id="${i.id}">−</button>
              <span>${i.qty}</span>
              <button class="qty-btn" data-action="inc" data-id="${i.id}">+</button>
            </div>
          </div>
          <button class="cart-item-remove" data-id="${i.id}"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');

      container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => updateQty(btn.dataset.id, btn.dataset.action === 'inc' ? 1 : -1));
      });
      container.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => removeItem(btn.dataset.id));
      });
    }

    // ============ SEARCH ============
    const searchBar = document.getElementById('searchBar');
    const searchInputEl = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClear');
    const searchIconEl = document.querySelector('#searchToggle i');
    const searchToggleBtn = document.getElementById('searchToggle');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchContainer = document.querySelector('.search-container');

    function isMobileViewport() {
      return window.matchMedia('(max-width: 640px)').matches;
    }

    function syncSearchIcon() {
      if (isMobileViewport() && searchBar.classList.contains('expanded')) {
        searchIconEl.className = 'fas fa-times';
      } else {
        searchIconEl.className = 'fas fa-search';
      }
    }

    function expandSearch() {
      searchBar.classList.add('expanded');
      searchInputEl.focus();
      syncSearchIcon();
    }

    function collapseSearch() {
      searchBar.classList.remove('expanded');
      searchInputEl.value = '';
      searchQuery = '';
      searchClearBtn.classList.remove('show');
      if (searchDropdown) searchDropdown.classList.remove('show');
      syncSearchIcon();
    }

    function forceCloseSearch() {
      searchBar.classList.remove('expanded');
      searchInputEl.blur();
      syncSearchIcon();
    }

    searchToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchBar.classList.contains('expanded')) {
        if (isMobileViewport()) forceCloseSearch();
        else searchInputEl.focus();
      } else {
        expandSearch();
      }
    });

    searchInputEl.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      searchClearBtn.classList.toggle('show', !!searchQuery);
      updateSearchDropdown();
    });

    searchClearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      searchInputEl.value = '';
      searchQuery = '';
      searchClearBtn.classList.remove('show');
      if (searchDropdown) searchDropdown.classList.remove('show');
      searchInputEl.focus();
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-bar')) collapseSearch();
      if (!e.target.closest('.lang-switch')) document.getElementById('langMenu').classList.remove('active');
      if (searchContainer && !searchContainer.contains(e.target) && searchDropdown) {
        searchDropdown.classList.remove('show');
      }
    });

    document.getElementById('langToggle').addEventListener('click', () => {
      document.getElementById('langMenu').classList.toggle('active');
    });

    function updateSearchDropdown() {
      if (!searchDropdown) return;
      const t = translations[currentLang];
      const term = searchQuery.trim().toLowerCase();
      if (term.length < 2 || allProducts.length === 0) {
        searchDropdown.classList.remove('show');
        return;
      }
      const matches = allProducts.filter(p => p.name.toLowerCase().includes(term)).slice(0, 6);
      if (matches.length === 0) {
        searchDropdown.innerHTML = `<div class="search-no-results">${t.noResults}</div>`;
        searchDropdown.classList.add('show');
        return;
      }
      searchDropdown.innerHTML = matches.map(p => {
        const img = p.firstImage ? `<img src="${p.firstImage}" alt="">` : '<i class="fas fa-spray-can-sparkles"></i>';
        const outOfStock = typeof p.stock === 'number' && p.stock <= 0;
        return `
          <div class="search-result-item${outOfStock ? ' out-of-stock' : ''}" data-id="${p.id}">
            <div class="search-result-img">${img}</div>
            <div class="search-result-info">
              <div class="search-result-name">${p.name}</div>
              <div class="search-result-category">${translations[currentLang][catKeyMap[p.category]] || p.category}${outOfStock ? ` · <span class="search-out-label">${t.outOfStock}</span>` : ''}</div>
            </div>
            <div class="search-result-price">${parseFloat(p.price).toFixed(3).replace('.', ',')} TND</div>
          </div>`;
      }).join('');
      searchDropdown.classList.add('show');
    }

    searchDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item');
      if (item) {
        if (item.classList.contains('out-of-stock')) {
          showToast(translations[currentLang].outOfStock);
          return;
        }
        addToCart(item.dataset.id);
        searchInputEl.value = '';
        searchQuery = '';
        searchClearBtn.classList.remove('show');
        searchDropdown.classList.remove('show');
        searchBar.classList.remove('expanded');
        syncSearchIcon();
      }
    });

    // ============ CART UI ============
    document.getElementById('cartToggle').addEventListener('click', () => document.getElementById('cartOverlay').classList.add('active'));
    document.getElementById('cartClose').addEventListener('click', () => document.getElementById('cartOverlay').classList.remove('active'));
    document.getElementById('cartOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'cartOverlay') e.target.classList.remove('active');
    });

    // ============ CHECKOUT ============
    document.getElementById('checkoutBtn').addEventListener('click', () => {
      const t = translations[currentLang];
      if (cart.length === 0) { showToast(t.toastEmpty); return; }
      document.getElementById('checkoutSummary').innerHTML = cart.map(i =>
        `<div style="display:flex;justify-content:space-between;padding:4px 0;">
          <span>${i.name} x${i.qty}</span><span>${(i.price * i.qty).toFixed(3).replace('.', ',')} TND</span>
        </div>`
      ).join('') + `<div style="display:flex;justify-content:space-between;padding-top:8px;font-weight:700;color:var(--gold)">
          <span>${t.cartTotal}</span><span>${cartTotal().toFixed(3).replace('.', ',')} TND</span>
        </div>`;
      document.getElementById('cartOverlay').classList.remove('active');
      document.getElementById('checkoutOverlay').classList.add('active');
    });

    document.getElementById('checkoutClose').addEventListener('click', () => document.getElementById('checkoutOverlay').classList.remove('active'));

    document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const orderData = {
        items: cart,
        total: cartTotal(),
        customer_name: document.getElementById('custName').value,
        customer_phone: document.getElementById('custPhone').value,
        customer_email: document.getElementById('custEmail').value,
        shipping_address: document.getElementById('custAddress').value,
        status: 'pending',
        user_id: currentUser ? currentUser.id : null
      };
      const { error } = await tsupabase.from('orders').insert([orderData]);
      if (error) {
        console.error(error);
        showToast('❌ Erreur lors de la commande.');
        return;
      }
      cart.forEach(item => {
        tsupabase.rpc('decrement_stock', { p_id: item.id, p_qty: item.qty })
          .then(({ error: stockErr }) => { if (stockErr) console.error('Stock decrement failed for', item.id, stockErr); });
      });
      cart = [];
      saveCart();
      renderCart();
      document.getElementById('checkoutOverlay').classList.remove('active');
      showToast(translations[currentLang].toastOrder);
      e.target.reset();
    });

    // ============ AUTH ============
    const authOverlay = document.getElementById('authOverlay');
    const accountMenu = document.getElementById('accountMenu');
    const accountToggle = document.getElementById('accountToggle');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabSignupBtn = document.getElementById('tabSignupBtn');
    const authIndicator = document.getElementById('authIndicator');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    let currentUser = null;

    const authFormsTrack = document.querySelector('.auth-forms');
    let authAnimating = false;

    function initAuthForms() {
      const dir = document.body.dir === 'rtl' ? -1 : 1;
      loginForm.classList.add('active-form');
      loginForm.style.transform = 'translateX(0)';
      loginForm.style.opacity = '1';
      signupForm.style.transform = `translateX(${100 * dir}%)`;
      signupForm.style.opacity = '0';
      authFormsTrack.style.height = loginForm.scrollHeight + 'px';
    }

    let authFormsInitialized = false;
    function openAuth(tab = 'login') {
      authOverlay.classList.add('active');
      if (!authFormsInitialized) {
        initAuthForms();
        authFormsInitialized = true;
      }
      const activeForm = loginForm.classList.contains('active-form') ? loginForm : signupForm;
      authFormsTrack.style.height = activeForm.scrollHeight + 'px';
      setAuthTab(tab);
    }
    function closeAuth() {
      authOverlay.classList.remove('active');
    }
    function setAuthTab(tab) {
      const isLogin = tab === 'login';
      tabLoginBtn.classList.toggle('active', isLogin);
      tabSignupBtn.classList.toggle('active', !isLogin);
      authIndicator.classList.toggle('signup', !isLogin);

      const incoming = isLogin ? loginForm : signupForm;
      const outgoing = isLogin ? signupForm : loginForm;

      if (incoming.classList.contains('active-form') || authAnimating) return;
      authAnimating = true;

      const dir = document.body.dir === 'rtl' ? -1 : 1;

      incoming.classList.remove('hidden');
      incoming.style.transition = 'none';
      incoming.style.transform = `translateX(${(isLogin ? -100 : 100) * dir}%)`;
      incoming.style.opacity = '0';
      void incoming.offsetWidth;
      incoming.style.transition = '';

      incoming.classList.add('active-form');
      outgoing.classList.remove('active-form');

      requestAnimationFrame(() => {
        outgoing.style.transform = `translateX(${(isLogin ? 100 : -100) * dir}%)`;
        outgoing.style.opacity = '0';
        incoming.style.transform = 'translateX(0)';
        incoming.style.opacity = '1';
        authFormsTrack.style.height = incoming.scrollHeight + 'px';
      });

      setTimeout(() => {
        outgoing.classList.add('hidden');
        authAnimating = false;
      }, 550);
    }

    document.getElementById('authClose').addEventListener('click', closeAuth);
    authOverlay.addEventListener('click', (e) => { if (e.target.id === 'authOverlay') closeAuth(); });
    tabLoginBtn.addEventListener('click', () => setAuthTab('login'));
    tabSignupBtn.addEventListener('click', () => setAuthTab('signup'));

    function setSubmitLoading(form, loading) {
      const btn = form.querySelector('.auth-submit');
      btn.classList.toggle('loading', loading);
      btn.disabled = loading;
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const t = translations[currentLang];
      setSubmitLoading(loginForm, true);
      const { data, error } = await tsupabase.auth.signInWithPassword({
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
      });
      setSubmitLoading(loginForm, false);
      if (error) {
        showToast(t.toastLoginError);
        return;
      }
      closeAuth();
      loginForm.reset();
      showToast(t.toastLoginSuccess);
    });

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const t = translations[currentLang];
      setSubmitLoading(signupForm, true);
      const { data, error } = await tsupabase.auth.signUp({
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        options: { data: { full_name: document.getElementById('signupName').value } }
      });
      setSubmitLoading(signupForm, false);
      if (error) {
        showToast(error.message);
        return;
      }
      signupForm.reset();
      if (data.session) {
        closeAuth();
        showToast(t.toastSignupSuccess);
      } else {
        setAuthTab('login');
        showToast(t.toastSignupCheckEmail);
      }
    });

    document.getElementById('accountLogoutBtn').addEventListener('click', async () => {
      await tsupabase.auth.signOut();
      accountMenu.classList.remove('active');
      showToast(translations[currentLang].toastLogout);
    });

    accountToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentUser) {
        accountMenu.classList.toggle('active');
      } else {
        openAuth('login');
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.account-switch')) accountMenu.classList.remove('active');
    });

    function updateAuthUI(session) {
      currentUser = session ? session.user : null;
      accountToggle.classList.toggle('icon-btn-active', !!currentUser);
      if (currentUser) {
        document.getElementById('accountEmailDisplay').textContent = currentUser.email;
      } else {
        accountMenu.classList.remove('active');
      }
    }

    tsupabase.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
    tsupabase.auth.getSession().then(({ data }) => updateAuthUI(data.session));

    // ============ PROFILE / ORDERS ============
    const shopView = document.getElementById('shopView');
    const profileView = document.getElementById('profileView');
    let lastOrders = [];

    function showProfile() {
      if (!currentUser) { openAuth('login'); return; }
      shopView.style.display = 'none';
      profileView.classList.add('active');

      const nameMeta = currentUser.user_metadata?.full_name || currentUser.email || '';
      const initials = nameMeta
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'SM';
      document.getElementById('profileAvatar').textContent = initials;

      const displayName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
      document.getElementById('profileNameDisplay').textContent = displayName;
      document.getElementById('profileEmailDisplay').textContent = currentUser.email;

      const created = currentUser.created_at
        ? new Date(currentUser.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-TN' : currentLang, { year: 'numeric', month: 'long' })
        : '—';
      document.getElementById('profileMemberSince').textContent = created;

      window.scrollTo({ top: 0, behavior: 'smooth' });
      fetchOrders();
    }

    function showShop() {
      profileView.classList.remove('active');
      shopView.style.display = '';
    }

    async function fetchOrders() {
      const list = document.getElementById('orderList');
      const t = translations[currentLang];
      list.innerHTML = `<div class="profile-loading">${t.profileLoading}</div>`;
      const { data, error } = await tsupabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching orders:', error);
        list.innerHTML = `<div class="profile-empty">${t.profileEmpty}</div>`;
        return;
      }
      renderOrders(data || []);
    }

    const orderStatusKeyMap = {
      pending: 'statusPending', under_review: 'statusUnderReview', confirmed: 'statusConfirmed', shipped: 'statusShipped',
      delivered: 'statusDelivered', cancelled: 'statusCancelled'
    };

    function renderOrders(orders) {
      lastOrders = orders;
      const list = document.getElementById('orderList');
      const t = translations[currentLang];

      document.getElementById('profileOrderCount').textContent = orders.length;

      if (!orders.length) {
        list.innerHTML = `<div class="profile-empty"><i class="fas fa-spray-can-sparkles" style="font-size:1.5rem;margin-bottom:1rem;display:block;color:var(--gold)"></i>${t.profileEmpty}</div>`;
        return;
      }

      list.innerHTML = orders.map((o, idx) => {
        const date = o.created_at
          ? new Date(o.created_at).toLocaleDateString(currentLang === 'ar' ? 'ar-TN' : currentLang, { day: 'numeric', month: 'long', year: 'numeric' })
          : '';
        const statusLabel = t[orderStatusKeyMap[o.status]] || o.status;
        const orderNum = `#${String(o.id).padStart(4, '0')}`;
        const items = Array.isArray(o.items) ? o.items : [];
        const itemsHtml = items.map(i => `
          <div class="order-item-row">
            <div class="order-item-icon"><i class="fas fa-spray-can-sparkles"></i></div>
            <div class="order-item-details">
              <span class="order-item-name">${i.name} <small style="opacity:0.6;font-size:0.7rem;">x${i.qty}</small></span>
              <span class="order-item-price">${(i.price * i.qty).toFixed(3).replace('.', ',')} TND</span>
            </div>
          </div>
        `).join('');
        return `
          <div class="order-card">
            <div class="order-card-head">
              <span class="order-number">${orderNum}</span>
              <span class="order-date">${date}</span>
              <span class="order-status ${o.status}">${statusLabel}</span>
            </div>
            <div class="order-items">${itemsHtml}</div>
            <div class="order-total-row">
              <span>${t.orderTotalLabel}</span>
              <b>${parseFloat(o.total).toFixed(3).replace('.', ',')} TND</b>
            </div>
          </div>`;
      }).join('');
    }

    document.getElementById('accountProfileBtn').addEventListener('click', () => {
      accountMenu.classList.remove('active');
      showProfile();
    });
    document.getElementById('accountEmailDisplay').addEventListener('click', () => {
      accountMenu.classList.remove('active');
      showProfile();
    });
    document.getElementById('profileBackBtn').addEventListener('click', showShop);

    // ============ TOAST ============
    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('active');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => toast.classList.remove('active'), 2600);
    }

    // ============ THEME ============
    function themeIcons() {
      return [
        document.querySelector('#themeToggle i'),
        document.querySelector('#mobileThemeToggle i')
      ].filter(Boolean);
    }
    function updateThemeLabel() {
      const isDark = document.body.classList.contains('dark');
      const t = translations[currentLang];
      const label = document.querySelector('#mobileThemeToggle span');
      if (label) label.textContent = isDark ? t.themeLabelLight : t.themeLabelDark;
    }
    function initTheme() {
      const saved = localStorage.getItem('smp_theme') || 'light';
      if (saved === 'dark') {
        document.body.classList.add('dark');
        themeIcons().forEach(icon => icon.classList.replace('fa-moon', 'fa-sun'));
      }
      updateThemeLabel();
    }
    function toggleTheme() {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('smp_theme', isDark ? 'dark' : 'light');
      themeIcons().forEach(icon => {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
      });
      updateThemeLabel();
    }
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeToggle').addEventListener('click', toggleTheme);

    // ============ MOBILE NAV ============
    document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('mobileNav').classList.add('active'));
    document.getElementById('mobileNavClose').addEventListener('click', () => document.getElementById('mobileNav').classList.remove('active'));
    document.getElementById('mobileNav').addEventListener('click', (e) => { if (e.target.id === 'mobileNav') e.target.classList.remove('active'); });
    document.querySelectorAll('.mobile-nav-panel a').forEach(a => a.addEventListener('click', () => document.getElementById('mobileNav').classList.remove('active')));

    // ============ REVEAL ON SCROLL ============
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); observer.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => observer.observe(el));



    // ============ SITE SETTINGS ============
    const siteSettings = {};

    async function fetchSiteSettings() {
      const { data, error } = await tsupabase.from('site_settings').select('*');
      if (error) return;
      data.forEach(row => { siteSettings[row.key] = row.value; });
      applySiteSettings();
    }

    function applySiteSettings() {
      const heroImg = document.getElementById('heroCrestImg');
      if (heroImg && siteSettings.hero_image) {
        heroImg.src = siteSettings.hero_image;
        heroImg.style.display = '';
        heroImg.nextElementSibling.style.display = 'none';
      }
      const phoneEl = document.getElementById('contactPhoneDisplay');
      if (phoneEl && siteSettings.contact_phone) phoneEl.textContent = siteSettings.contact_phone;
      const emailEl = document.getElementById('contactEmailDisplayFooter');
      if (emailEl && siteSettings.contact_email) emailEl.textContent = siteSettings.contact_email;
      const addrEl = document.getElementById('contactAddressDisplay');
      if (addrEl && siteSettings.contact_address) addrEl.textContent = siteSettings.contact_address;
      const insta = document.getElementById('socialInstagram');
      if (insta) insta.href = siteSettings.social_instagram || '#';
      const fb = document.getElementById('socialFacebook');
      if (fb) fb.href = siteSettings.social_facebook || '#';
      const tiktok = document.getElementById('socialTiktok');
      if (tiktok) tiktok.href = siteSettings.social_tiktok || '#';
    }

    fetchSiteSettings();

    // ============ INIT ============
    document.getElementById('year').textContent = new Date().getFullYear();
    initTheme();
    applyTranslations();
    fetchProducts();
