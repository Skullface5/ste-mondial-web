        (function () {
            const SUPABASE_URL = 'https://knwpctdroogzwjrdotzo.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtud3BjdGRyb29nendqcmRvdHpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5NzgzOTAsImV4cCI6MjEwMDU1NDM5MH0.cyw1mvxyM0eLJN7_wstkpW9h4XFjWnrcEvuq9pWk4cI';
            const tsupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            let allProducts = [], currentProduct = null, currentLang = localStorage.getItem('smp_lang') || 'fr';
            let cart = JSON.parse(localStorage.getItem('smp_cart') || '[]'), currentImageIndex = 0, productImages = [];
            let currentUser = null;
            const siteSettings = {};

            const translations = {
                fr: {
                    brandSub: 'Maison de Parfum', back: 'Retour', addToCart: 'Ajouter au panier',
                    outOfStock: 'Rupture de stock', lowStock: 'Stock faible — {n} restant(s)', inStock: 'En stock',
                    quantityLeft: 'pièce(s) disponible(s)', discover: 'Découvrez ce parfum d\'exception...',
                    youMayLike: 'Vous aimerez aussi', cartTitle: 'Votre panier', cartTotal: 'Total', cartCheckout: 'Commander',
                    cartEmpty: 'Votre panier est vide.', checkoutTitle: 'Finaliser la commande', fieldName: 'Nom complet',
                    fieldPhone: 'Téléphone', fieldEmail: 'Email', fieldAddress: 'Adresse de livraison',
                    confirm: 'Confirmer', cancel: 'Annuler', footerRights: 'Tous droits réservés.',
                    footerBlurb: "L'élégance intemporelle, en chaque souffle — une maison de parfum sans frontières.",
                    footerNavH: 'Navigation', footerCatH: 'Catégories', footerContactH: 'Contact',
                    footerAddress: 'Tunis, Tunisie', footerTagline: "L'élégance intemporelle, en chaque souffle.",
                    navCollection: 'La Collection', navUnivers: 'Univers', navContact: 'Contact',
                    catMan: 'Homme', catWoman: 'Femme', catUnisex: 'Unisexe', catKids: 'Enfant',
                    toastAdded: 'Ajouté au panier', toastEmpty: 'Votre panier est vide', toastOrder: 'Commande enregistrée...',
                    toastOutOfStock: 'Stock insuffisant.', toastStockLimit: 'Stock maximum atteint.',
                    noResults: 'Aucun produit trouvé.', errorLoading: 'Erreur de chargement.', productNotFound: 'Produit non trouvé.',
                    photoPlaceholder: 'Photo à venir', themeLabelDark: 'Mode sombre', themeLabelLight: 'Mode clair',
                    searchPh: 'Rechercher un parfum...',
                    authSubtitle: 'Votre espace Ste Mondial Parfums', tabLogin: 'Connexion', tabSignup: 'Créer un compte',
                    fieldPassword: 'Mot de passe', fieldFullName: 'Nom complet', btnLogin: 'Se connecter', btnSignup: 'Créer mon compte',
                    accountLogout: 'Se déconnecter', toastLoginSuccess: 'Ravis de vous revoir.', toastLoginError: 'Email ou mot de passe incorrect.',
                    toastSignupCheckEmail: 'Compte créé — vérifiez vos emails.', toastSignupSuccess: 'Bienvenue dans la maison.',
                    toastLogout: 'Vous êtes déconnecté(e).', accountMyOrders: 'Mes commandes',
                },
                en: {
                    brandSub: 'Perfume House', back: 'Back', addToCart: 'Add to cart',
                    outOfStock: 'Out of stock', lowStock: 'Low stock — {n} left', inStock: 'In stock',
                    quantityLeft: 'piece(s) available', discover: 'Discover this exceptional perfume...',
                    youMayLike: 'You may also like', cartTitle: 'Your cart', cartTotal: 'Total', cartCheckout: 'Checkout',
                    cartEmpty: 'Your cart is empty.', checkoutTitle: 'Complete your order', fieldName: 'Full name',
                    fieldPhone: 'Phone', fieldEmail: 'Email', fieldAddress: 'Delivery address',
                    confirm: 'Confirm', cancel: 'Cancel', footerRights: 'All rights reserved.',
                    footerBlurb: 'Timeless elegance, in every breath — a perfume house without borders.',
                    footerNavH: 'Navigation', footerCatH: 'Categories', footerContactH: 'Contact',
                    footerAddress: 'Tunis, Tunisia', footerTagline: 'Timeless elegance, in every breath.',
                    navCollection: 'The Collection', navUnivers: 'Our World', navContact: 'Contact',
                    catMan: 'Men', catWoman: 'Women', catUnisex: 'Unisex', catKids: 'Kids',
                    toastAdded: 'Added to cart', toastEmpty: 'Your cart is empty', toastOrder: 'Order recorded...',
                    toastOutOfStock: 'Insufficient stock.', toastStockLimit: 'Maximum stock reached.',
                    noResults: 'No products found.', errorLoading: 'Error loading.', productNotFound: 'Product not found.',
                    photoPlaceholder: 'Photo coming soon', themeLabelDark: 'Dark mode', themeLabelLight: 'Light mode',
                    searchPh: 'Search a fragrance...',
                    authSubtitle: 'Your Ste Mondial Parfums account', tabLogin: 'Sign in', tabSignup: 'Create account',
                    fieldPassword: 'Password', fieldFullName: 'Full name', btnLogin: 'Sign in', btnSignup: 'Create my account',
                    accountLogout: 'Sign out', toastLoginSuccess: 'Welcome back.', toastLoginError: 'Incorrect email or password.',
                    toastSignupCheckEmail: 'Account created — check your email.', toastSignupSuccess: 'Welcome to the house.',
                    toastLogout: 'You have been signed out.', accountMyOrders: 'My orders',
                },
                ar: {
                    brandSub: 'دار العطور', back: 'رجوع', addToCart: 'أضف إلى السلة',
                    outOfStock: 'غير متوفر', lowStock: 'مخزون منخفض — {n} متبقي', inStock: 'متوفر',
                    quantityLeft: 'قطعة متاحة', discover: 'اكتشف هذا العطر الاستثنائي...',
                    youMayLike: 'قد يعجبك أيضاً', cartTitle: 'سلتك', cartTotal: 'المجموع', cartCheckout: 'إتمام الطلب',
                    cartEmpty: 'سلتك فارغة.', checkoutTitle: 'إتمام الطلب', fieldName: 'الاسم الكامل',
                    fieldPhone: 'الهاتف', fieldEmail: 'البريد الإلكتروني', fieldAddress: 'عنوان التوصيل',
                    confirm: 'تأكيد', cancel: 'إلغاء', footerRights: 'جميع الحقوق محفوظة.',
                    footerBlurb: 'أناقة خالدة، في كل نفس — دار عطور بلا حدود.',
                    footerNavH: 'التصفح', footerCatH: 'الفئات', footerContactH: 'اتصل بنا',
                    footerAddress: 'تونس، تونس', footerTagline: 'أناقة خالدة، في كل نفس.',
                    navCollection: 'المجموعة', navUnivers: 'عالمنا', navContact: 'اتصل بنا',
                    catMan: 'رجالي', catWoman: 'نسائي', catUnisex: 'للجنسين', catKids: 'أطفال',
                    toastAdded: 'أضيف إلى السلة', toastEmpty: 'سلتك فارغة', toastOrder: 'تم تسجيل الطلب...',
                    toastOutOfStock: 'مخزون غير كافٍ.', toastStockLimit: 'الحد الأقصى المتوفر.',
                    noResults: 'لا توجد منتجات.', errorLoading: 'خطأ في التحميل.', productNotFound: 'المنتج غير موجود.',
                    photoPlaceholder: 'الصورة قريباً', themeLabelDark: 'الوضع الداكن', themeLabelLight: 'الوضع الفاتح',
                    searchPh: 'ابحث عن عطر...',
                    authSubtitle: 'مساحتك في Ste Mondial Parfums', tabLogin: 'تسجيل الدخول', tabSignup: 'إنشاء حساب',
                    fieldPassword: 'كلمة المرور', fieldFullName: 'الاسم الكامل', btnLogin: 'تسجيل الدخول', btnSignup: 'إنشاء حسابي',
                    accountLogout: 'تسجيل الخروج', toastLoginSuccess: 'سعداء بعودتك.', toastLoginError: 'بريد أو كلمة مرور خاطئة.',
                    toastSignupCheckEmail: 'تم إنشاء الحساب — تحقق من بريدك.', toastSignupSuccess: 'مرحبًا بك في الدار.',
                    toastLogout: 'تم تسجيل خروجك.', accountMyOrders: 'طلباتي',
                }
            };

            const catKeyMap = { homme: 'catMan', femme: 'catWoman', unisexe: 'catUnisex', enfant: 'catKids' };

            const productDetailContainer = document.getElementById('productDetailContainer');
            const suggestionsContainer = document.getElementById('suggestionsContainer');
            const suggestionsGrid = document.getElementById('suggestionsGrid');
            const cartOverlay = document.getElementById('cartOverlay');
            const cartItemsContainer = document.getElementById('cartItems');
            const cartTotalValue = document.getElementById('cartTotalValue');
            const cartCountSpan = document.getElementById('cartCount');
            const toast = document.getElementById('toast');
            const checkoutOverlay = document.getElementById('checkoutOverlay');
            const langMenu = document.getElementById('langMenu');
            const themeToggleBtn = document.getElementById('themeToggle');
            const authOverlay = document.getElementById('authOverlay');
            const accountMenu = document.getElementById('accountMenu');
            const accountToggle = document.getElementById('accountToggle');
            const tabLoginBtn = document.getElementById('tabLoginBtn');
            const tabSignupBtn = document.getElementById('tabSignupBtn');
            const authIndicator = document.getElementById('authIndicator');
            const loginForm = document.getElementById('loginForm');
            const signupForm = document.getElementById('signupForm');
            const searchBar = document.getElementById('searchBar');
            const searchInputEl = document.getElementById('searchInput');
            const searchClearBtn = document.getElementById('searchClear');
            const searchDropdown = document.getElementById('searchDropdown');
            const searchContainer = document.querySelector('.search-container');

            function formatPrice(p) { return parseFloat(p).toFixed(3).replace('.', ',') + ' TND'; }
            function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])); }
            function t(key) { return translations[currentLang][key] || key; }
            function showToast(msgKey) {
                if (!toast) return;
                const msg = translations[currentLang][msgKey] || msgKey;
                toast.textContent = msg;
                toast.classList.add('active');
                clearTimeout(window._toastTimer);
                window._toastTimer = setTimeout(() => toast.classList.remove('active'), 2600);
            }
            function goBack() {
                if (document.referrer && document.referrer.includes(window.location.host)) {
                    history.back();
                } else {
                    window.location.href = 'index.html';
                }
            }
            window.goBack = goBack;

            function saveCart() { localStorage.setItem('smp_cart', JSON.stringify(cart)); updateCartUI(); }
            function cartTotal() { return cart.reduce((sum, i) => sum + i.price * i.qty, 0); }
            function updateCartUI() {
                const totalQty = cart.reduce((s, i) => s + i.qty, 0);
                if (cartCountSpan) cartCountSpan.textContent = totalQty;
                if (cartTotalValue) cartTotalValue.textContent = formatPrice(cartTotal());
                renderCartItems();
            }
            function addToCart(id, name, price, image) {
                const product = allProducts.find(p => p.id == id);
                if (!product) return;
                const hasStockLimit = typeof product.stock === 'number';
                if (hasStockLimit && product.stock <= 0) { showToast('toastOutOfStock'); return; }
                const existing = cart.find(i => i.id == id);
                const currentQty = existing ? existing.qty : 0;
                if (hasStockLimit && currentQty >= product.stock) { showToast('toastStockLimit'); return; }
                if (existing) existing.qty += 1;
                else cart.push({ id: product.id, name: product.name, price: parseFloat(product.price), qty: 1, image: image || '' });
                saveCart();
                showToast('toastAdded');
            }
            function updateQty(id, delta) {
                const item = cart.find(i => i.id == id);
                if (!item) return;
                if (delta > 0) {
                    const product = allProducts.find(p => p.id == id);
                    if (product && typeof product.stock === 'number' && item.qty >= product.stock) { showToast('toastStockLimit'); return; }
                }
                item.qty += delta;
                if (item.qty <= 0) cart = cart.filter(i => i.id != id);
                saveCart();
            }
            function removeItem(id) { cart = cart.filter(i => i.id != id); saveCart(); }
            function renderCartItems() {
                if (!cartItemsContainer) return;
                if (cart.length === 0) { cartItemsContainer.innerHTML = `<div class="cart-empty">${t('cartEmpty')}</div>`; return; }
                cartItemsContainer.innerHTML = cart.map(i => `
                    <div class="cart-item">
                        <div class="cart-item-img">${i.image ? `<img src="${i.image}" alt="" onerror="this.onerror=null;this.innerHTML='<i class=\\'fas fa-spray-can-sparkles\\'></i>';">` : '<i class="fas fa-spray-can-sparkles"></i>'}</div>
                        <div class="cart-item-info">
                            <b>${escapeHtml(i.name)}</b>
                            <small>${formatPrice(i.price)}</small>
                            <div class="qty-row">
                                <button class="qty-btn" data-action="dec" data-id="${i.id}">−</button>
                                <span>${i.qty}</span>
                                <button class="qty-btn" data-action="inc" data-id="${i.id}">+</button>
                            </div>
                        </div>
                        <button class="cart-item-remove" data-id="${i.id}"><i class="fas fa-trash"></i></button>
                    </div>
                `).join('');
            }
            function openCart() { cartOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
            function closeCart() { cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }
            function openCheckout() {
                if (cart.length === 0) { showToast('toastEmpty'); return; }
                document.getElementById('checkoutSummary').innerHTML = cart.map(i => `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${escapeHtml(i.name)} x${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></div>`).join('') + `<div style="display:flex;justify-content:space-between;padding-top:8px;font-weight:700;color:var(--gold)"><span>${t('cartTotal')}</span><span>${formatPrice(cartTotal())}</span></div>`;
                closeCart();
                checkoutOverlay.classList.add('active');
            }
            function closeCheckout() { checkoutOverlay.classList.remove('active'); }

            function changeImage(newIndex) {
                if (newIndex < 0 || newIndex >= productImages.length || newIndex === currentImageIndex) return;
                currentImageIndex = newIndex;
                const mainImg = document.getElementById('mainImage');
                if (mainImg) mainImg.src = productImages[currentImageIndex];
                document.querySelectorAll('.thumbnail').forEach((thumb, idx) => thumb.classList.toggle('active', idx === currentImageIndex));
                document.querySelectorAll('.swipe-dot').forEach((dot, idx) => dot.classList.toggle('active', idx === currentImageIndex));
            }
            function setupGallery(images) {
                if (!images || images.length <= 1) return;
                let touchStartX = 0, touchEndX = 0;
                const container = document.querySelector('.main-image-container');
                if (!container) return;
                container.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
                container.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].screenX;
                    const diff = touchEndX - touchStartX;
                    if (Math.abs(diff) < 50) return;
                    if (diff > 0) changeImage(currentImageIndex - 1);
                    else changeImage(currentImageIndex + 1);
                });
                const prevArrow = document.querySelector('.nav-arrow.prev');
                const nextArrow = document.querySelector('.nav-arrow.next');
                if (prevArrow) prevArrow.addEventListener('click', () => changeImage(currentImageIndex - 1));
                if (nextArrow) nextArrow.addEventListener('click', () => changeImage(currentImageIndex + 1));
                document.querySelectorAll('.thumbnail').forEach((thumb, idx) => { thumb.addEventListener('click', () => changeImage(idx)); });
            }

            function displayProduct(product) {
                currentProduct = product;
                try {
                    if (product.images && typeof product.images === 'string') productImages = JSON.parse(product.images);
                    else if (product.images && Array.isArray(product.images)) productImages = product.images;
                    else if (product.image) productImages = [product.image];
                    else productImages = [];
                } catch (e) { productImages = []; }
                currentImageIndex = 0;

                const categoryName = t(catKeyMap[product.category]) || product.category;
                const stock = typeof product.stock === 'number' ? product.stock : null;
                const isOutOfStock = stock !== null && stock <= 0;
                const isLowStock = stock !== null && stock > 0 && stock <= 3;
                const stockStatusHTML = isOutOfStock ? `<div class="stock-status stock-out"><i class="fas fa-times-circle"></i> <span>${t('outOfStock')}</span></div>` : isLowStock ? `<div class="stock-status stock-low"><i class="fas fa-exclamation-triangle"></i> <span>${t('lowStock').replace('{n}', stock)}</span></div>` : stock !== null ? `<div class="stock-status stock-available"><i class="fas fa-check-circle"></i> <span>${t('inStock')}</span> <span class="quantity-info">(${stock} ${t('quantityLeft')})</span></div>` : '';

                let mainImageHtml, thumbnailsHtml = '', swipeIndicatorsHtml = '', arrowsHtml = '';
                if (productImages.length > 0) {
                    mainImageHtml = `<img src="${productImages[0]}" alt="${escapeHtml(product.name)}" id="mainImage" onerror="this.onerror=null;this.style.display='none';this.parentElement.querySelector('.placeholder-icon').style.display='block';">`;
                    if (productImages.length > 1) {
                        thumbnailsHtml = productImages.map((img, idx) => `<div class="thumbnail ${idx === 0 ? 'active' : ''}" data-idx="${idx}"><img src="${img}" alt="" onerror="this.onerror=null;this.innerHTML='<i class=\\'fas fa-spray-can-sparkles placeholder-icon\\'></i>';"></div>`).join('');
                        swipeIndicatorsHtml = productImages.map((_, idx) => `<div class="swipe-dot ${idx === 0 ? 'active' : ''}"></div>`).join('');
                        arrowsHtml = `<button class="nav-arrow prev"><i class="fas fa-chevron-left"></i></button><button class="nav-arrow next"><i class="fas fa-chevron-right"></i></button>`;
                    }
                } else {
                    mainImageHtml = '<i class="fas fa-spray-can-sparkles placeholder-icon" style="display:block;"></i>';
                }

                productDetailContainer.innerHTML = `
                    <div class="product-detail">
                        <div class="product-gallery">
                            <div class="main-image-container">
                                <div class="image-container">${mainImageHtml}<i class="fas fa-spray-can-sparkles placeholder-icon" style="display:none;font-size:5rem;color:var(--gold);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></i></div>
                                ${arrowsHtml}<div class="swipe-indicators">${swipeIndicatorsHtml}</div>
                            </div>
                            ${productImages.length > 1 ? `<div class="thumbnail-grid">${thumbnailsHtml}</div>` : ''}
                        </div>
                        <div class="product-info">
                            <h1>${escapeHtml(product.name)}</h1>
                            <div class="product-brand">${escapeHtml(product.brand || 'Ste Mondial Parfums')}</div>
                            <div class="product-meta"><span class="meta-badge"><i class="fas fa-tag"></i> ${categoryName}</span></div>
                            ${stockStatusHTML}
                            <div class="product-price">${formatPrice(product.price)}</div>
                            <div class="product-description">${escapeHtml(product.description || t('discover'))}</div>
                            <button class="add-to-cart-btn" data-id="${product.id}" data-name="${escapeHtml(product.name)}" data-price="${product.price}" data-image="${productImages[0] || ''}" ${isOutOfStock ? 'disabled' : ''}>
                                <i class="fas fa-shopping-bag"></i> ${isOutOfStock ? t('outOfStock') : t('addToCart')}
                            </button>
                        </div>
                    </div>`;
                const addBtn = productDetailContainer.querySelector('.add-to-cart-btn');
                if (addBtn && !isOutOfStock) {
                    addBtn.addEventListener('click', () => addToCart(addBtn.dataset.id, addBtn.dataset.name, parseFloat(addBtn.dataset.price), addBtn.dataset.image));
                }
                if (productImages.length > 1) setupGallery(productImages);
                productDetailContainer.classList.add('in');
            }

            function loadSuggestions() {
                if (!currentProduct || !allProducts.length) return;
                const suggestions = allProducts.filter(p => p.id !== currentProduct.id && p.category === currentProduct.category).slice(0, 4);
                if (suggestions.length === 0) { suggestionsContainer.style.display = 'none'; return; }
                suggestionsContainer.style.display = 'block';
                suggestionsGrid.innerHTML = suggestions.map(p => {
                    let firstImage = '';
                    try { const imgArr = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []; firstImage = Array.isArray(imgArr) ? imgArr[0] || '' : ''; } catch (e) { firstImage = ''; }
                    const imgHtml = firstImage ? `<img src="${firstImage}" alt="" onerror="this.onerror=null;this.parentElement.innerHTML='<i class=\\'fas fa-spray-can-sparkles placeholder-icon\\'></i>';">` : '<i class="fas fa-spray-can-sparkles placeholder-icon"></i>';
                    return `<a class="suggestion-card" href="product.html?id=${p.id}"><div class="suggestion-img">${imgHtml}</div><div class="suggestion-name">${escapeHtml(p.name)}</div><div class="suggestion-category">${t(catKeyMap[p.category]) || p.category}</div><div class="suggestion-price">${formatPrice(p.price)}</div></a>`;
                }).join('');
                suggestionsContainer.classList.add('in');
            }

            function showSkeleton() {
                productDetailContainer.innerHTML = `<div class="product-detail"><div class="product-gallery"><div class="skeleton-img"></div><div style="display:flex;gap:0.8rem;margin-top:1rem;"><div class="skeleton-thumb"></div><div class="skeleton-thumb"></div><div class="skeleton-thumb"></div></div></div><div class="product-info"><div class="skeleton-title"></div><div class="skeleton-brand"></div><div class="skeleton-price"></div><div class="skeleton-description"></div><div class="skeleton-button"></div></div></div>`;
            }

            async function init() {
                showSkeleton();
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('id');
                if (!productId) { productDetailContainer.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--gold);">${t('productNotFound')}</div>`; return; }
                try {
                    const { data, error } = await tsupabase.from('products').select('*').order('created_at', { ascending: false });
                    if (error) throw error;
                    allProducts = data.map(p => { let firstImage = ''; if (p.images) { try { const imgArr = typeof p.images === 'string' ? JSON.parse(p.images) : p.images; firstImage = Array.isArray(imgArr) ? imgArr[0] || '' : ''; } catch (e) { firstImage = ''; } } return { ...p, firstImage }; });
                    currentProduct = allProducts.find(p => p.id == productId);
                    if (!currentProduct) throw new Error('Not found');
                    displayProduct(currentProduct);
                    loadSuggestions();
                } catch (err) { console.error(err); productDetailContainer.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--bronze);">${t('errorLoading')}</div>`; }
            }

            // --- Search ---
            let searchQuery = '';
            function syncSearchIcon() { const icon = document.querySelector('#searchToggle i'); if (window.matchMedia('(max-width: 640px)').matches && searchBar.classList.contains('expanded')) { icon.className = 'fas fa-times'; } else { icon.className = 'fas fa-search'; } }
            function expandSearch() { searchBar.classList.add('expanded'); searchInputEl.focus(); syncSearchIcon(); }
            function collapseSearch() { searchBar.classList.remove('expanded'); searchInputEl.value = ''; searchQuery = ''; searchClearBtn.classList.remove('show'); if (searchDropdown) searchDropdown.classList.remove('show'); syncSearchIcon(); }
            function forceCloseSearch() { searchBar.classList.remove('expanded'); searchInputEl.blur(); syncSearchIcon(); }
            document.getElementById('searchToggle').addEventListener('click', (e) => { e.stopPropagation(); if (searchBar.classList.contains('expanded')) { if (window.matchMedia('(max-width: 640px)').matches) forceCloseSearch(); else searchInputEl.focus(); } else { expandSearch(); } });
            searchInputEl.addEventListener('input', (e) => { searchQuery = e.target.value; searchClearBtn.classList.toggle('show', !!searchQuery); updateSearchDropdown(); });
            searchClearBtn.addEventListener('click', (e) => { e.stopPropagation(); searchInputEl.value = ''; searchQuery = ''; searchClearBtn.classList.remove('show'); if (searchDropdown) searchDropdown.classList.remove('show'); searchInputEl.focus(); });
            document.addEventListener('click', (e) => { if (!e.target.closest('.search-bar')) collapseSearch(); if (!e.target.closest('.lang-switch')) langMenu.classList.remove('active'); if (searchContainer && !searchContainer.contains(e.target) && searchDropdown) { searchDropdown.classList.remove('show'); } });
            function updateSearchDropdown() {
                if (!searchDropdown) return;
                const term = searchQuery.trim().toLowerCase();
                if (term.length < 2 || allProducts.length === 0) { searchDropdown.classList.remove('show'); return; }
                const matches = allProducts.filter(p => p.name.toLowerCase().includes(term)).slice(0, 6);
                if (matches.length === 0) { searchDropdown.innerHTML = `<div class="search-no-results">${t('noResults')}</div>`; searchDropdown.classList.add('show'); return; }
                searchDropdown.innerHTML = matches.map(p => { const img = p.firstImage ? `<img src="${p.firstImage}" alt="">` : '<i class="fas fa-spray-can-sparkles"></i>'; const outOfStock = typeof p.stock === 'number' && p.stock <= 0; return `<div class="search-result-item${outOfStock ? ' out-of-stock' : ''}" data-id="${p.id}"><div class="search-result-img">${img}</div><div class="search-result-info"><div class="search-result-name">${p.name}</div><div class="search-result-category">${t(catKeyMap[p.category]) || p.category}${outOfStock ? ` · <span class="search-out-label">${t('outOfStock')}</span>` : ''}</div></div><div class="search-result-price">${formatPrice(p.price)}</div></div>`; }).join('');
                searchDropdown.classList.add('show');
            }
            searchDropdown.addEventListener('click', (e) => { const item = e.target.closest('.search-result-item'); if (item) { if (item.classList.contains('out-of-stock')) { showToast('outOfStock'); return; } addToCart(item.dataset.id, '', 0, ''); searchInputEl.value = ''; searchQuery = ''; searchClearBtn.classList.remove('show'); searchDropdown.classList.remove('show'); searchBar.classList.remove('expanded'); syncSearchIcon(); } });

            // --- Auth ---
            const authFormsTrack = document.querySelector('.auth-forms');
            let authAnimating = false;
            function initAuthForms() { const dir = document.body.dir === 'rtl' ? -1 : 1; loginForm.classList.add('active-form'); loginForm.style.transform = 'translateX(0)'; loginForm.style.opacity = '1'; signupForm.style.transform = `translateX(${100 * dir}%)`; signupForm.style.opacity = '0'; authFormsTrack.style.height = loginForm.scrollHeight + 'px'; }
            let authFormsInitialized = false;
            function openAuth(tab = 'login') { authOverlay.classList.add('active'); if (!authFormsInitialized) { initAuthForms(); authFormsInitialized = true; } const activeForm = loginForm.classList.contains('active-form') ? loginForm : signupForm; authFormsTrack.style.height = activeForm.scrollHeight + 'px'; setAuthTab(tab); }
            function closeAuth() { authOverlay.classList.remove('active'); }
            function setAuthTab(tab) { const isLogin = tab === 'login'; tabLoginBtn.classList.toggle('active', isLogin); tabSignupBtn.classList.toggle('active', !isLogin); authIndicator.classList.toggle('signup', !isLogin); const incoming = isLogin ? loginForm : signupForm; const outgoing = isLogin ? signupForm : loginForm; if (incoming.classList.contains('active-form') || authAnimating) return; authAnimating = true; const dir = document.body.dir === 'rtl' ? -1 : 1; incoming.classList.remove('hidden'); incoming.style.transition = 'none'; incoming.style.transform = `translateX(${(isLogin ? -100 : 100) * dir}%)`; incoming.style.opacity = '0'; void incoming.offsetWidth; incoming.style.transition = ''; incoming.classList.add('active-form'); outgoing.classList.remove('active-form'); requestAnimationFrame(() => { outgoing.style.transform = `translateX(${(isLogin ? 100 : -100) * dir}%)`; outgoing.style.opacity = '0'; incoming.style.transform = 'translateX(0)'; incoming.style.opacity = '1'; authFormsTrack.style.height = incoming.scrollHeight + 'px'; }); setTimeout(() => { outgoing.classList.add('hidden'); authAnimating = false; }, 550); }
            document.getElementById('authClose').addEventListener('click', closeAuth);
            authOverlay.addEventListener('click', (e) => { if (e.target.id === 'authOverlay') closeAuth(); });
            tabLoginBtn.addEventListener('click', () => setAuthTab('login'));
            tabSignupBtn.addEventListener('click', () => setAuthTab('signup'));
            loginForm.addEventListener('submit', async (e) => { e.preventDefault(); setSubmitLoading(loginForm, true); const { error } = await tsupabase.auth.signInWithPassword({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPassword').value }); setSubmitLoading(loginForm, false); if (error) { showToast('toastLoginError'); return; } closeAuth(); loginForm.reset(); showToast('toastLoginSuccess'); });
            signupForm.addEventListener('submit', async (e) => { e.preventDefault(); setSubmitLoading(signupForm, true); const { data, error } = await tsupabase.auth.signUp({ email: document.getElementById('signupEmail').value, password: document.getElementById('signupPassword').value, options: { data: { full_name: document.getElementById('signupName').value } } }); setSubmitLoading(signupForm, false); if (error) { showToast(error.message); return; } signupForm.reset(); if (data.session) { closeAuth(); showToast('toastSignupSuccess'); } else { setAuthTab('login'); showToast('toastSignupCheckEmail'); } });
            document.getElementById('accountLogoutBtn').addEventListener('click', async () => { await tsupabase.auth.signOut(); accountMenu.classList.remove('active'); showToast('toastLogout'); });
            accountToggle.addEventListener('click', (e) => { e.stopPropagation(); if (currentUser) { accountMenu.classList.toggle('active'); } else { openAuth('login'); } });
            document.addEventListener('click', (e) => { if (!e.target.closest('.account-switch')) accountMenu.classList.remove('active'); });
            function setSubmitLoading(form, loading) { const btn = form.querySelector('.auth-submit'); btn.classList.toggle('loading', loading); btn.disabled = loading; }
            function updateAuthUI(session) { currentUser = session ? session.user : null; accountToggle.classList.toggle('icon-btn-active', !!currentUser); if (currentUser) { document.getElementById('accountEmailDisplay').textContent = currentUser.email; } else { accountMenu.classList.remove('active'); } }
            tsupabase.auth.onAuthStateChange((_event, session) => updateAuthUI(session));
            tsupabase.auth.getSession().then(({ data }) => updateAuthUI(data.session));

            // --- Cart events ---
            document.getElementById('cartToggle').addEventListener('click', openCart);
            document.getElementById('cartClose').addEventListener('click', closeCart);
            cartOverlay.addEventListener('click', (e) => { if (e.target.id === 'cartOverlay') closeCart(); });
            cartItemsContainer.addEventListener('click', (e) => { const rm = e.target.closest('.cart-item-remove'); if (rm) { removeItem(rm.dataset.id); return; } const qtyBtn = e.target.closest('.qty-btn'); if (qtyBtn) updateQty(qtyBtn.dataset.id, qtyBtn.dataset.action === 'inc' ? 1 : -1); });
            document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
            document.getElementById('checkoutClose').addEventListener('click', closeCheckout);
            document.getElementById('checkoutCancelBtn').addEventListener('click', closeCheckout);
            checkoutOverlay.addEventListener('click', (e) => { if (e.target.id === 'checkoutOverlay') closeCheckout(); });
            document.getElementById('checkoutForm').addEventListener('submit', async (e) => { e.preventDefault(); const orderData = { items: cart, total: cartTotal(), customer_name: document.getElementById('custName').value, customer_phone: document.getElementById('custPhone').value, customer_email: document.getElementById('custEmail').value, shipping_address: document.getElementById('custAddress').value, status: 'pending', user_id: currentUser ? currentUser.id : null }; const { error } = await tsupabase.from('orders').insert([orderData]); if (error) { console.error(error); showToast('errorLoading'); return; } cart.forEach(item => { tsupabase.rpc('decrement_stock', { p_id: item.id, p_qty: item.qty }).then(({ error: stockErr }) => { if (stockErr) console.error('Stock decrement failed', item.id, stockErr); }); }); cart = []; saveCart(); closeCheckout(); showToast('toastOrder'); e.target.reset(); });

            // --- Language ---
            document.getElementById('langToggle').addEventListener('click', () => langMenu.classList.toggle('active'));
            document.querySelectorAll('.lang-menu button').forEach(btn => { btn.addEventListener('click', () => { currentLang = btn.dataset.lang; localStorage.setItem('smp_lang', currentLang); langMenu.classList.remove('active'); applyTranslations(); }); });
            function applyTranslations() { document.documentElement.lang = currentLang; document.body.dir = currentLang === 'ar' ? 'rtl' : 'ltr'; document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if (translations[currentLang][key]) el.textContent = translations[currentLang][key]; }); document.querySelectorAll('[data-i18n-ph]').forEach(el => { const key = el.getAttribute('data-i18n-ph'); if (translations[currentLang][key]) el.placeholder = translations[currentLang][key]; }); updateLangButtons(); updateThemeLabel(); if (currentProduct) displayProduct(currentProduct); updateCartUI(); }
            function updateLangButtons() { document.querySelectorAll('.lang-menu button').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang)); }

            // --- Site settings ---
            async function fetchSiteSettings() {
                const { data, error } = await tsupabase.from('site_settings').select('*');
                if (error) return;
                data.forEach(row => { siteSettings[row.key] = row.value; });
                applySiteSettings();
            }
            function applySiteSettings() {
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

            // --- Theme ---
            function updateThemeLabel() { const isDark = document.body.classList.contains('dark'); const label = document.querySelector('#mobileThemeToggle span'); if (label) label.textContent = isDark ? t('themeLabelLight') : t('themeLabelDark'); }
            function initTheme() { const saved = localStorage.getItem('smp_theme') || 'light'; if (saved === 'dark') { document.body.classList.add('dark'); const icon = themeToggleBtn.querySelector('i'); if (icon) { icon.classList.replace('fa-moon', 'fa-sun'); } } updateThemeLabel(); }
            function toggleTheme() { document.body.classList.toggle('dark'); const isDark = document.body.classList.contains('dark'); localStorage.setItem('smp_theme', isDark ? 'dark' : 'light'); const icon = themeToggleBtn.querySelector('i'); if (icon) { icon.classList.toggle('fa-moon', !isDark); icon.classList.toggle('fa-sun', isDark); } updateThemeLabel(); }
            themeToggleBtn.addEventListener('click', toggleTheme);
            initTheme();

            // --- Reveal ---
            const revealObserver = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); } }); }, { threshold: 0.12 });
            document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

            // --- Start ---
            document.getElementById('year').textContent = new Date().getFullYear();
            applyTranslations();
            updateCartUI();
            fetchSiteSettings();
            init();
        })();
