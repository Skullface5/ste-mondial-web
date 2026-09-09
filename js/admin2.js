/* ============================================================
   STE Mondial — admin2.js (mobile-first admin)
   Auth + dashboard + orders (live) + products CRUD + settings
   + image upload to Supabase Storage (bucket: products).
   Plain REST — no build step.
   ============================================================ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';
  var BUCKET = 'products';
  var POLL_MS = 30000;
  var STATUS_LABELS = { nouvelle: 'Nouvelle', confirmee: 'Confirmée', expediee: 'Expédiée', livree: 'Livrée', annulée: 'Annulée', annulee: 'Annulée' };
  var STATUS_CLASS = { nouvelle: 'st-new', confirmee: 'st-confirmed', expediee: 'st-shipped', livree: 'st-delivered', annulee: 'st-cancelled' };
  var CAT_LABELS = { inspires: 'Inspires', voiture: 'Voiture', ambiance: 'Ambiance', musc: 'Musc', accessoires: 'Accessoires' };

  /* ---------- i18n ---------- */
  var I18N = {
    fr: {
      'login.sub': 'Espace administration', 'login.email': 'Email', 'login.password': 'Mot de passe',
      'login.showPw': 'Afficher le mot de passe', 'login.btn': 'Connexion', 'login.foot': 'Accès réservé — STE Mondial Parfums',
      'login.errFields': 'Email et mot de passe requis.', 'login.errBad': 'Identifiants incorrects',
      'top.refresh': 'Rafraîchir',
      'dash.title': 'Tableau de bord', 'dash.t1': "Aujourd'hui", 'dash.t1h': 'commandes',
      'dash.t2': 'CA du jour', 'dash.t2h': 'hors annulées', 'dash.t3': 'En attente', 'dash.t3h': 'nouvelle + confirmée',
      'dash.t4': 'Stock faible', 'dash.t4h': 'stock ≤ 5', 'dash.recent': 'Dernières commandes', 'dash.lowcard': 'Stock faible (≤ 5)',
      'dash.emptyRecent': 'Pas encore de commandes.', 'dash.emptyLow': 'Tous les stocks sont bons ✓',
      'ord.title': 'Commandes', 'ord.all': 'Toutes', 'ord.search': 'Rechercher : client, tél, ville…',
      'ord.emptyT': 'Aucune commande', 'ord.emptyS': 'Les commandes du site arrivent ici en direct.',
      'ord.kicker': 'Commande', 'ord.items': 'Articles', 'ord.total': 'Total', 'ord.status': 'Statut',
      'ord.client': 'Client', 'ord.phone': 'Téléphone', 'ord.email': 'Email', 'ord.address': 'Adresse', 'ord.city': 'Ville',
      'ord.notes': 'Notes', 'ord.received': 'Reçue le', 'ord.call': 'Appeler', 'ord.wa': 'WhatsApp',
      'ord.del': 'Supprimer la commande', 'ord.deleted': 'Commande supprimée', 'ord.delFail': 'Échec de la suppression',
      'ord.statusOk': 'Statut →', 'ord.statusFail': 'Échec du changement de statut', 'ord.articles': 'article(s)',
      'prod.title': 'Produits', 'prod.new': '+ Nouveau', 'prod.search': 'Rechercher un produit…',
      'prod.emptyT': 'Aucun produit', 'prod.emptyS': "Ajoutez votre premier produit avec « + Nouveau ».",
      'prod.count': 'produit(s)', 'prod.created': 'Produit créé ✓', 'prod.updated': 'Produit mis à jour ✓',
      'prod.delFail': 'Échec de la suppression', 'prod.deleted': 'Produit supprimé',
      'set.title': 'Réglages', 'set.sub': 'Boutique, livraison, annonce, héro', 'set.shopCard': 'Boutique & livraison',
      'set.save': 'Enregistrer', 'set.saveHero': 'Enregistrer le héro', 'set.autoplay': 'Défilement automatique',
      'set.heroCard': 'Images héro (diaporama)', 'set.heroHelp': "Plusieurs images = diaporama. La 1ʳᵉ est l'image principale.",
      'set.bannerCard': 'Bannière promo', 'set.bannerHelp': 'L\'image affichée dans la section « Notre sélection ».',
      'set.logoCard': 'Logo', 'set.logoHelp': "Affiché dans l'en-tête et le pied de page.",
      'set.uploadBanner': '📤 Changer la bannière', 'set.uploadLogo': '📤 Changer le logo',
      'set.shopName': 'Nom de la boutique', 'set.whatsapp': 'WhatsApp (ex: 21612345678)', 'set.defaultLang': 'Langue par défaut (fr/en/ar)', 'set.delivery': 'Frais de livraison (DT)', 'set.annFr': 'Bandeau annonce (FR)', 'set.annEn': 'Bandeau annonce (EN)', 'set.annAr': 'Bandeau annonce (AR)',
      'set.saved': 'Réglages enregistrés ✓ — visibles sur le site après rechargement.',
      'set.nothing': 'Rien à enregistrer.',
      'set.heroSaved1': 'Image héro enregistrée ✓', 'set.heroSavedN': 'Diaporama héro enregistré ✓',
      'set.saveBanner': 'Enregistrer la bannière', 'set.bannerSavedN': 'Diaporama bannière enregistré ✓',
      'set.defaultApplied': 'Aucune image — image par défaut appliquée.',
      'set.imgUpdated': 'Image mise à jour ✓ — visible sur le site après rechargement.',
      'tab.dash': 'Bord', 'tab.orders': 'Commandes', 'tab.products': 'Produits', 'tab.reviews': 'Avis', 'tab.settings': 'Réglages',
      'nav.reviews': 'Avis clients',
      'pf.new': 'Nouveau produit', 'pf.edit': 'Modifier le produit',
      'pf.images': 'Images du produit', 'pf.imgHelp': 'La 1ʳᵉ image = principale. Touchez ✕ pour retirer.',
      'pf.addUrl': 'Ajouter par URL (Entrée pour valider)', 'pf.imgCount': 'images — la 1ʳᵉ est l\'image principale',
      'pf.imgBad': 'URL invalide — doit commencer par http(s)://', 'pf.imgHeavy': 'Image trop lourde (max 5 Mo).',
      'pf.uploading': 'Envoi de l\'image', 'pf.imgReady': 'Image prête — enregistrée avec le produit.',
      'pf.nameFR': 'Nom (FR) *', 'pf.nameEN': 'Nom (EN)', 'pf.nameAR': 'Nom (AR)',
      'pf.descFR': 'Description (FR)', 'pf.descEN': 'Description (EN)', 'pf.descAR': 'Description (AR)',
      'pf.cat': 'Catégorie *', 'pf.sku': 'Référence (SKU)', 'pf.price': 'Prix (DT) *', 'pf.oldPrice': 'Ancien prix',
      'pf.stock': 'Stock', 'pf.featured': 'Mis en avant', 'pf.active': 'Actif',
      'pf.errName': 'Le nom (FR) est obligatoire.', 'pf.errPrice': 'Prix invalide.',
      'pf.delete': 'Supprimer', 'pf.cancel': 'Annuler', 'pf.save': 'Enregistrer', 'pf.errPrefix': 'Erreur : ',
      'cf.title': 'Confirmer', 'cf.no': 'Annuler', 'cf.yes': 'Supprimer',
      'cf.delOrder': 'Supprimer définitivement cette commande ?', 'cf.delProduct': 'Supprimer',
      'cf.delProductSuffix': 'définitivement ?',
      'st.nouvelle': 'Nouvelle', 'st.confirmee': 'Confirmée', 'st.expediee': 'Expédiée', 'st.livree': 'Livrée', 'st.annulee': 'Annulée',
      'cat.inspires': 'Inspires', 'cat.voiture': 'Voiture', 'cat.ambiance': 'Ambiance', 'cat.musc': 'Musc', 'cat.accessoires': 'Accessoires',
      'toast.refreshed': 'Données actualisées ✓', 'toast.refreshFail': 'Actualisation impossible',
      'toast.loadErr': 'Erreur de chargement : ', 'stock': 'stock', 'off': 'off', 'rupture': 'rupture'
    },
    en: {
      'login.sub': 'Admin area', 'login.email': 'Email', 'login.password': 'Password',
      'login.showPw': 'Show password', 'login.btn': 'Sign in', 'login.foot': 'Restricted access — STE Mondial Parfums',
      'login.errFields': 'Email and password required.', 'login.errBad': 'Incorrect credentials',
      'top.refresh': 'Refresh',
      'dash.title': 'Dashboard', 'dash.t1': 'Today', 'dash.t1h': 'orders',
      'dash.t2': "Today's revenue", 'dash.t2h': 'excl. cancelled', 'dash.t3': 'Pending', 'dash.t3h': 'new + confirmed',
      'dash.t4': 'Low stock', 'dash.t4h': 'stock ≤ 5', 'dash.recent': 'Latest orders', 'dash.lowcard': 'Low stock (≤ 5)',
      'dash.emptyRecent': 'No orders yet.', 'dash.emptyLow': 'All stock levels are good ✓',
      'ord.title': 'Orders', 'ord.all': 'All', 'ord.search': 'Search: customer, phone, city…',
      'ord.emptyT': 'No orders', 'ord.emptyS': 'Orders from the site arrive here live.',
      'ord.kicker': 'Order', 'ord.items': 'Items', 'ord.total': 'Total', 'ord.status': 'Status',
      'ord.client': 'Customer', 'ord.phone': 'Phone', 'ord.email': 'Email', 'ord.address': 'Address', 'ord.city': 'City',
      'ord.notes': 'Notes', 'ord.received': 'Received', 'ord.call': 'Call', 'ord.wa': 'WhatsApp',
      'ord.del': 'Delete order', 'ord.deleted': 'Order deleted', 'ord.delFail': 'Failed to delete',
      'ord.statusOk': 'Status →', 'ord.statusFail': 'Status change failed', 'ord.articles': 'item(s)',
      'prod.title': 'Products', 'prod.new': '+ New', 'prod.search': 'Search products…',
      'prod.emptyT': 'No products', 'prod.emptyS': 'Add your first product with “+ New”.',
      'prod.count': 'product(s)', 'prod.created': 'Product created ✓', 'prod.updated': 'Product updated ✓',
      'prod.delFail': 'Failed to delete', 'prod.deleted': 'Product deleted',
      'set.title': 'Settings', 'set.sub': 'Shop, delivery, banner, hero', 'set.shopCard': 'Shop & delivery',
      'set.save': 'Save', 'set.saveHero': 'Save hero', 'set.autoplay': 'Auto-play slideshow',
      'set.heroCard': 'Hero images (slideshow)', 'set.heroHelp': 'Multiple images = slideshow. The 1st is the main one.',
      'set.bannerCard': 'Promo banner', 'set.bannerHelp': 'The image shown in the “Our selection” section.',
      'set.logoCard': 'Logo', 'set.logoHelp': 'Shown in the header and footer.',
      'set.uploadBanner': '📤 Change banner', 'set.uploadLogo': '📤 Change logo',
      'set.shopName': 'Shop name', 'set.whatsapp': 'WhatsApp (e.g. 21612345678)', 'set.defaultLang': 'Default language (fr/en/ar)', 'set.delivery': 'Delivery fee (DT)', 'set.annFr': 'Announcement banner (FR)', 'set.annEn': 'Announcement banner (EN)', 'set.annAr': 'Announcement banner (AR)',
      'set.saved': 'Settings saved ✓ — visible on the site after reload.',
      'set.nothing': 'Nothing to save.',
      'set.heroSaved1': 'Hero image saved ✓', 'set.heroSavedN': 'Hero slideshow saved ✓',
      'set.saveBanner': 'Save banner', 'set.bannerSavedN': 'Banner slideshow saved ✓',
      'set.defaultApplied': 'No images — default image applied.',
      'set.imgUpdated': 'Image updated ✓ — visible on the site after reload.',
      'tab.dash': 'Board', 'tab.orders': 'Orders', 'tab.products': 'Products', 'tab.reviews': 'Reviews', 'tab.settings': 'Settings',
      'nav.reviews': 'Customer reviews',
      'pf.new': 'New product', 'pf.edit': 'Edit product',
      'pf.images': 'Product images', 'pf.imgHelp': '1st image = main. Tap ✕ to remove.',
      'pf.addUrl': 'Add by URL (Enter to confirm)', 'pf.imgCount': 'images — 1st is the main one',
      'pf.imgBad': 'Invalid URL — must start with http(s)://', 'pf.imgHeavy': 'Image too large (max 5 MB).',
      'pf.uploading': 'Uploading image', 'pf.imgReady': 'Image ready — saved with the product.',
      'pf.nameFR': 'Name (FR) *', 'pf.nameEN': 'Name (EN)', 'pf.nameAR': 'Name (AR)',
      'pf.descFR': 'Description (FR)', 'pf.descEN': 'Description (EN)', 'pf.descAR': 'Description (AR)',
      'pf.cat': 'Category *', 'pf.sku': 'Reference (SKU)', 'pf.price': 'Price (DT) *', 'pf.oldPrice': 'Old price',
      'pf.stock': 'Stock', 'pf.featured': 'Featured', 'pf.active': 'Active',
      'pf.errName': 'Name (FR) is required.', 'pf.errPrice': 'Invalid price.',
      'pf.delete': 'Delete', 'pf.cancel': 'Cancel', 'pf.save': 'Save', 'pf.errPrefix': 'Error: ',
      'cf.title': 'Confirm', 'cf.no': 'Cancel', 'cf.yes': 'Delete',
      'cf.delOrder': 'Permanently delete this order?', 'cf.delProduct': 'Permanently delete “',
      'cf.delProductSuffix': '”?',
      'st.nouvelle': 'New', 'st.confirmee': 'Confirmed', 'st.expediee': 'Shipped', 'st.livree': 'Delivered', 'st.annulee': 'Cancelled',
      'cat.inspires': 'Inspires', 'cat.voiture': 'Car', 'cat.ambiance': 'Ambiance', 'cat.musc': 'Musk', 'cat.accessoires': 'Accessories',
      'toast.refreshed': 'Data refreshed ✓', 'toast.refreshFail': 'Refresh failed',
      'toast.loadErr': 'Loading error: ', 'stock': 'stock', 'off': 'off', 'rupture': 'out of stock'
    },
    ar: {
      'login.sub': 'منطقة الإدارة', 'login.email': 'البريد الإلكتروني', 'login.password': 'كلمة المرور',
      'login.showPw': 'إظهار كلمة المرور', 'login.btn': 'تسجيل الدخول', 'login.foot': 'الدخول مخصص — ست مونديال للعطور',
      'login.errFields': 'البريد الإلكتروني وكلمة المرور مطلوبان.', 'login.errBad': 'بيانات الدخول غير صحيحة',
      'top.refresh': 'تحديث',
      'dash.title': 'لوحة التحكم', 'dash.t1': 'اليوم', 'dash.t1h': 'طلبات',
      'dash.t2': 'مداخيل اليوم', 'dash.t2h': 'بلا الملغاة', 'dash.t3': 'في الانتظار', 'dash.t3h': 'جديدة + مؤكدة',
      'dash.t4': 'مخزون منخفض', 'dash.t4h': 'المخزون ≤ 5', 'dash.recent': 'آخر الطلبات', 'dash.lowcard': 'مخزون منخفض (≤ 5)',
      'dash.emptyRecent': 'لا طلبات بعد.', 'dash.emptyLow': 'كل المخزون في حالة جيدة ✓',
      'ord.title': 'الطلبات', 'ord.all': 'الكل', 'ord.search': 'بحث: الزبون، الهاتف، المدينة…',
      'ord.emptyT': 'لا طلبات', 'ord.emptyS': 'طلبات الموقع تصل هنا مباشرة.',
      'ord.kicker': 'طلب', 'ord.items': 'المواد', 'ord.total': 'المجموع', 'ord.status': 'الحالة',
      'ord.client': 'الزبون', 'ord.phone': 'الهاتف', 'ord.email': 'البريد', 'ord.address': 'العنوان', 'ord.city': 'المدينة',
      'ord.notes': 'ملاحظات', 'ord.received': 'وصلت في', 'ord.call': 'اتصال', 'ord.wa': 'واتساب',
      'ord.del': 'حذف الطلب', 'ord.deleted': 'تم حذف الطلب', 'ord.delFail': 'فشل الحذف',
      'ord.statusOk': 'الحالة ←', 'ord.statusFail': 'فشل تغيير الحالة', 'ord.articles': 'قطعة',
      'prod.title': 'المنتجات', 'prod.new': '+ جديد', 'prod.search': 'البحث عن منتج…',
      'prod.emptyT': 'لا منتجات', 'prod.emptyS': 'أضف أول منتج بـ « + جديد ».',
      'prod.count': 'منتج', 'prod.created': 'تم إنشاء المنتج ✓', 'prod.updated': 'تم تحديث المنتج ✓',
      'prod.delFail': 'فشل الحذف', 'prod.deleted': 'تم حذف المنتج',
      'set.title': 'الإعدادات', 'set.sub': 'المتجر، التوصيل، الإعلان، الواجهة', 'set.shopCard': 'المتجر والتوصيل',
      'set.save': 'حفظ', 'set.saveHero': 'حفظ الواجهة', 'set.autoplay': 'تبديل تلقائي',
      'set.heroCard': 'صور الواجهة (عرض متبدل)', 'set.heroHelp': 'عدة صور = عرض متبدل. الأولى هي الأساسية.',
      'set.bannerCard': 'لافتة ترويجية', 'set.bannerHelp': 'الصورة المعروضة في قسم « اختيارنا ».',
      'set.logoCard': 'الشعار', 'set.logoHelp': 'يظهر في الترويسة والتذييل.',
      'set.uploadBanner': '📤 تغيير اللافتة', 'set.uploadLogo': '📤 تغيير الشعار',
      'set.shopName': 'اسم المتجر', 'set.whatsapp': 'واتساب (مثال: 21612345678)', 'set.defaultLang': 'اللغة الافتراضية (fr/en/ar)', 'set.delivery': 'رسوم التوصيل (د.ت)', 'set.annFr': 'شريط الإعلان (FR)', 'set.annEn': 'شريط الإعلان (EN)', 'set.annAr': 'شريط الإعلان (AR)',
      'set.saved': 'تم حفظ الإعدادات ✓ — تظهر في الموقع بعد إعادة التحميل.',
      'set.nothing': 'لا شيء للحفظ.',
      'set.heroSaved1': 'تم حفظ صورة الواجهة ✓', 'set.heroSavedN': 'تم حفظ العرض المتبدل ✓',
      'set.saveBanner': 'حفظ البانر', 'set.bannerSavedN': 'تم حفظ عرض البانر ✓',
      'set.defaultApplied': 'لا صور — تم تطبيق الصورة الافتراضية.',
      'set.imgUpdated': 'تم تحديث الصورة ✓ — تظهر في الموقع بعد إعادة التحميل.',
      'tab.dash': 'اللوحة', 'tab.orders': 'الطلبات', 'tab.products': 'المنتجات', 'tab.reviews': 'التقييمات', 'tab.settings': 'الإعدادات',
      'nav.reviews': 'آراء العملاء',
      'pf.new': 'منتج جديد', 'pf.edit': 'تعديل المنتج',
      'pf.images': 'صور المنتج', 'pf.imgHelp': 'الصورة الأولى = الأساسية. المس ✕ للإزالة.',
      'pf.addUrl': 'إضافة برابط (Entrée للتأكيد)', 'pf.imgCount': 'صور — الأولى هي الأساسية',
      'pf.imgBad': 'رابط غير صالح — يجب أن يبدأ بـ http(s)://', 'pf.imgHeavy': 'الصورة ثقيلة جدًا (5 ميغا كحد أقصى).',
      'pf.uploading': 'جارٍ رفع الصورة', 'pf.imgReady': 'الصورة جاهزة — تُحفظ مع المنتج.',
      'pf.nameFR': 'الاسم (FR) *', 'pf.nameEN': 'الاسم (EN)', 'pf.nameAR': 'الاسم (AR)',
      'pf.descFR': 'الوصف (FR)', 'pf.descEN': 'الوصف (EN)', 'pf.descAR': 'الوصف (AR)',
      'pf.cat': 'الفئة *', 'pf.sku': 'المرجع (SKU)', 'pf.price': 'السعر (د.ت) *', 'pf.oldPrice': 'السعر القديم',
      'pf.stock': 'المخزون', 'pf.featured': 'مميز', 'pf.active': 'نشط',
      'pf.errName': 'الاسم (FR) مطلوب.', 'pf.errPrice': 'سعر غير صالح.',
      'pf.delete': 'حذف', 'pf.cancel': 'إلغاء', 'pf.save': 'حفظ', 'pf.errPrefix': 'خطأ: ',
      'cf.title': 'تأكيد', 'cf.no': 'إلغاء', 'cf.yes': 'حذف',
      'cf.delOrder': 'حذف هذا الطلب نهائيًا؟', 'cf.delProduct': 'حذف « ',
      'cf.delProductSuffix': ' » نهائيًا؟',
      'st.nouvelle': 'جديدة', 'st.confirmee': 'مؤكدة', 'st.expediee': 'مُرسلة', 'st.livree': 'تم التوصيل', 'st.annulee': 'ملغاة',
      'cat.inspires': 'ملهمة', 'cat.voiture': 'السيارة', 'cat.ambiance': 'أجواء', 'cat.musc': 'مسك', 'cat.accessoires': 'إكسسوارات',
      'toast.refreshed': 'تم تحديث البيانات ✓', 'toast.refreshFail': 'فشل التحديث',
      'toast.loadErr': 'خطأ في التحميل: ', 'stock': 'المخزون', 'off': 'متوقف', 'rupture': 'نفذ'
    }
  };

  function t(key) {
    var d = I18N[state.lang] || I18N.fr;
    if (key && d[key] !== undefined) return d[key];
    if (key && I18N.fr[key] !== undefined) return I18N.fr[key];
    return key;
  }

  var SETTINGS_FIELDS = [
    { key: 'shop_name', k: 'set.shopName', type: 'text' },
    { key: 'whatsapp', k: 'set.whatsapp', type: 'text', inputmode: 'tel' },
    { key: 'default_language', k: 'set.defaultLang', type: 'text' },
    { key: 'delivery_fee', k: 'set.delivery', type: 'number' },
    { key: 'announcement_fr', k: 'set.annFr', type: 'textarea' },
    { key: 'announcement_en', k: 'set.annEn', type: 'textarea' },
    { key: 'announcement_ar', k: 'set.annAr', type: 'textarea', dir: 'rtl' }
  ];

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var state = {
    lang: 'fr',
    currentOrder: null,
    user: null,
    orders: [],
    products: [],
    settings: {},
    orderFilter: 'all',
    editingId: null,
    pfGallery: [],        // committed image urls in product editor
    pfNew: [],            // File objects picked in product editor
    heroList: [],         // committed hero image urls
    heroNew: [],          // File objects picked in settings
   bannerList: [],       // committed banner urls
   bannerNew: [],        // staged banner files
   bannerBackup: [],     // last-saved banner urls (empty-save guard)
    heroPending: null,
    realtimeOk: false,
    channel: null,
    pollTimer: null,
    lastCountNew: 0
  };

  function $(id) { return document.getElementById(id); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDT(n) { var v = Number(n) || 0; return v.toFixed(3).replace(/\.?0+$/, '') + ' DT'; }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' }) + ' ' +
        d.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }
  function locale() {
    return state.lang === 'ar' ? 'ar-TN' : (state.lang === 'en' ? 'en-GB' : 'fr-TN');
  }
  function applyStatic() {
    $all('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $all('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $all('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  }
  function applyLang(lang) {
    if (!I18N[lang]) lang = 'fr';
    state.lang = lang;
    try { localStorage.setItem('sm_admin_lang', lang); } catch (e) { /* noop */ }
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' ? 'rtl' : 'ltr');
    $all('#lang-sw button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    applyStatic();
    renderDashboard();
    renderOrders();
    renderProducts();
    renderSettings();
    $('pf-title').textContent = t(state.editingId ? 'pf.edit' : 'pf.new');
    if (!$('order-sheet').hidden && state.currentOrder) renderOrderSheet(state.currentOrder);
    if (!$('pf-sheet').hidden) renderPfGallery();
  }

  function toast(msg, kind) {
    var box = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.classList.add('show'); }, 10);
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 350);
    }, 2600);
  }
  function showMsg(id, text, ok) {
    var el = $(id);
    if (!el) return;
    el.textContent = text || '';
    el.hidden = !text;
    el.classList.toggle('ok', !!ok);
    el.classList.toggle('err', !ok);
  }

  /* ---------- auth ---------- */
  function getToken() { return state.user ? state.user.access_token : null; }

  async function api(method, path, body, prefer) {
    var headers = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' };
    if (prefer) headers['Prefer'] = prefer;
    var res = await fetch(SUPABASE_URL + path, {
      method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (res.status === 401) { await refreshSession(); }
    return res;
  }

  async function refreshSession() {
    try {
      var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: state.user.refresh_token })
      });
      if (r.ok) {
        var j = await r.json();
        state.user = { access_token: j.access_token, refresh_token: j.refresh_token, email: j.user && j.user.email };
        try { localStorage.setItem('sm_admin_session', JSON.stringify(state.user)); } catch (e) { /* noop */ }
      }
    } catch (e) { /* offline */ }
  }

  async function restoreSession() {
    try {
      var raw = localStorage.getItem('sm_admin_session');
      if (!raw) return false;
      state.user = JSON.parse(raw);
      // validate with a cheap call; refresh if expired
      var res = await fetch(SUPABASE_URL + '/rest/v1/orders?select=id&limit=1', {
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + state.user.access_token }
      });
      if (res.status === 401) await refreshSession();
      return !!getToken();
    } catch (e) { return false; }
  }

  /* ---------- data loads ---------- */
  async function loadOrders() {
    var res = await api('GET', '/rest/v1/orders?select=*&order=created_at.desc&limit=300');
    if (!res.ok) throw new Error('orders HTTP ' + res.status);
    state.orders = await res.json();
  }

  async function loadProducts() {
    var res = await api('GET', '/rest/v1/products?select=*&order=created_at.desc');
    if (!res.ok) throw new Error('products HTTP ' + res.status);
    state.products = await res.json();
  }

  async function loadSettings() {
    var res = await api('GET', '/rest/v1/site_settings?select=key,value');
    if (!res.ok) throw new Error('settings HTTP ' + res.status);
    var rows = await res.json();
    state.settings = {};
    rows.forEach(function (r) { state.settings[r.key] = r.value; });
  }

  /* ---------- navigation ---------- */
  function showView(name) {
    $all('.view--app').forEach(function (v) { v.hidden = true; });
    var el = $('view-' + name);
    if (el) el.hidden = false;
    $all('.tab-item').forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-nav') === name); });
    window.scrollTo({ top: 0 });
  }

  /* ---------- dashboard ---------- */
  function renderDashboard() {
    var now = new Date();
    $('today-label').textContent = now.toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
    var todayKey = now.toDateString();
    var todayOrders = state.orders.filter(function (o) { return new Date(o.created_at).toDateString() === todayKey; });
    var ca = todayOrders.reduce(function (n, o) { return o.status !== 'annulee' ? n + Number(o.total || 0) : n; }, 0);
    var pending = state.orders.filter(function (o) { return o.status === 'nouvelle' || o.status === 'confirmee'; }).length;
    var low = state.products.filter(function (p) { return Number(p.stock) <= 5 && p.active; });

    $('stat-today').textContent = String(todayOrders.length);
    $('stat-ca-today').textContent = fmtDT(ca);
    $('stat-pending').textContent = String(pending);
    $('stat-lowstock').textContent = String(low.length);
    $('tab-orders-badge').hidden = pending === 0;
    $('tab-orders-badge').textContent = String(pending);

    var recent = state.orders.slice(0, 5);
    $('dash-recent').innerHTML = recent.length
      ? recent.map(function (o) {
        return '<button class="mini-row" data-open-order="' + esc(o.id) + '">' +
          '<span class="mini-name">' + esc(o.customer_name || '—') + '</span>' +
          '<span class="mini-meta">' + fmtDT(o.total) + ' · ' + fmtDate(o.created_at) + '</span>' +
          '<span class="chip-status ' + (STATUS_CLASS[o.status] || '') + '">' + esc(t('st.' + o.status)) + '</span></button>';
      }).join('')
      : '<p class="empty-sub">' + t('dash.emptyRecent') + '</p>';

    $('dash-lowstock').innerHTML = low.length
      ? low.map(function (p) {
        return '<button class="mini-row" data-open-product="' + esc(p.id) + '">' +
          '<span class="mini-name">' + esc(p.name_fr || p.sku) + '</span>' +
          '<span class="mini-meta">' + esc(t('cat.' + p.category)) + '</span>' +
          '<span class="chip-status st-low">stock ' + esc(p.stock) + '</span></button>';
      }).join('')
      : '<p class="empty-sub">' + t('dash.emptyLow') + '</p>';
  }

  /* ---------- orders ---------- */
  function ordersFiltered() {
    var q = ($('orders-search').value || '').trim().toLowerCase();
    return state.orders.filter(function (o) {
      if (state.orderFilter !== 'all' && o.status !== state.orderFilter) return false;
      if (!q) return true;
      return [o.customer_name, o.customer_phone, o.city, o.id].some(function (v) {
        return String(v || '').toLowerCase().indexOf(q) !== -1;
      });
    });
  }

  function renderOrders() {
    var list = ordersFiltered();
    $('orders-empty').hidden = list.length > 0;
    $('orders-list').innerHTML = list.map(function (o) {
      var nItems = Array.isArray(o.items) ? o.items.reduce(function (n, it) { return n + (it.qty || 1); }, 0) : 0;
      return '<button class="order-card" data-open-order="' + esc(o.id) + '">' +
        '<div class="order-card-top"><span class="order-name">' + esc(o.customer_name || '—') + '</span>' +
        '<span class="chip-status ' + (STATUS_CLASS[o.status] || '') + '">' + esc(t('st.' + o.status)) + '</span></div>' +
        '<div class="order-card-mid"><span>' + fmtDT(o.total) + '</span><span>' + nItems + ' ' + t('ord.articles') + '</span><span>' + fmtDate(o.created_at) + '</span></div>' +
        '<div class="order-card-bot">' + esc(o.customer_phone || '') + (o.city ? ' · ' + esc(o.city) : '') + '</div>' +
        '</button>';
    }).join('');
  }

  function renderOrderSheet(o) {
    $('order-title').textContent = '#' + String(o.id).slice(0, 8);
    var items = Array.isArray(o.items) ? o.items : [];
    var rows = items.map(function (it) {
      return '<div class="order-item"><span class="oi-name">' + esc(it.name || '—') + '</span>' +
        '<span class="oi-qty">×' + esc(it.qty) + '</span>' +
        '<span class="oi-price">' + fmtDT(Number(it.price) * Number(it.qty || 1)) + '</span></div>';
    }).join('');

    var wa = String(o.customer_phone || '').replace(/[^0-9]/g, '');
    if (wa.length === 8) wa = '216' + wa;

    $('order-body').innerHTML =
      '<div class="detail-grid">' +
      '<div class="detail"><span class="detail-k">' + t('ord.client') + '</span><span class="detail-v">' + esc(o.customer_name || '—') + '</span></div>' +
      '<div class="detail"><span class="detail-k">' + t('ord.phone') + '</span><span class="detail-v">' + esc(o.customer_phone || '—') + '</span></div>' +
      (o.customer_email ? '<div class="detail"><span class="detail-k">' + t('ord.email') + '</span><span class="detail-v">' + esc(o.customer_email) + '</span></div>' : '') +
      (o.address ? '<div class="detail"><span class="detail-k">' + t('ord.address') + '</span><span class="detail-v">' + esc(o.address) + '</span></div>' : '') +
      (o.city ? '<div class="detail"><span class="detail-k">' + t('ord.city') + '</span><span class="detail-v">' + esc(o.city) + '</span></div>' : '') +
      (o.notes ? '<div class="detail"><span class="detail-k">' + t('ord.notes') + '</span><span class="detail-v">' + esc(o.notes) + '</span></div>' : '') +
      '<div class="detail"><span class="detail-k">' + t('ord.received') + '</span><span class="detail-v">' + fmtDate(o.created_at) + '</span></div>' +
      '</div>' +
      '<div class="contact-row">' +
      '<a class="btn btn--ghost" href="tel:' + esc(o.customer_phone || '') + '">📞 ' + t('ord.call') + '</a>' +
      '<a class="btn btn--ghost" target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '">💬 ' + t('ord.wa') + '</a>' +
      '</div>' +
      '<h4 class="sheet-sub">' + t('ord.items') + '</h4>' + rows +
      '<div class="order-total"><span>' + t('ord.total') + '</span><strong>' + fmtDT(o.total) + '</strong></div>' +
      '<h4 class="sheet-sub">' + t('ord.status') + '</h4>' +
      '<div class="status-picker" role="group">' +
      ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'].map(function (s) {
        return '<button type="button" class="status-opt ' + (o.status === s ? 'active ' + (STATUS_CLASS[s] || '') : '') + '" data-status="' + s + '">' + t('st.' + s) + '</button>';
      }).join('') +
      '</div>' +
      '<button type="button" class="btn btn--danger btn--block" id="order-delete" style="margin-top:1rem">' + t('ord.del') + '</button>';

    $all('#order-body [data-status]').forEach(function (b) {
      b.addEventListener('click', async function () {
        var s = b.getAttribute('data-status');
        b.disabled = true;
        try {
          var res = await api('PATCH', '/rest/v1/orders?id=eq.' + o.id, { status: s }, 'return=minimal');
          if (!res.ok) throw new Error('HTTP ' + res.status);
          o.status = s;
          renderOrders();
          renderDashboard();
          renderOrderSheet(o);
          toast(t('ord.statusOk') + ' ' + t('st.' + s), 'ok');
        } catch (e) {
          toast(t('ord.statusFail'), 'err');
        } finally {
          b.disabled = false;
        }
      });
    });
    var del = $('order-delete');
    if (del) del.addEventListener('click', function () {
      confirmDialog(t('cf.delOrder'), async function () {
        try {
          var res = await api('DELETE', '/rest/v1/orders?id=eq.' + o.id, undefined, 'return=minimal');
          if (!res.ok) throw new Error('HTTP ' + res.status);
          closeSheet('order');
          await loadOrders();
          renderOrders();
          renderDashboard();
          toast(t('ord.deleted'), 'ok');
        } catch (e) { toast(t('ord.delFail'), 'err'); }
      });
    });
  }

  /* ---------- products ---------- */
  function productsFiltered() {
    var q = ($('products-search').value || '').trim().toLowerCase();
    if (!q) return state.products;
    return state.products.filter(function (p) {
      return [p.name_fr, p.name_en, p.name_ar, p.sku].some(function (v) {
        return String(v || '').toLowerCase().indexOf(q) !== -1;
      });
    });
  }

  function renderProducts() {
    var list = productsFiltered();
    $('products-count').textContent = state.products.length + ' ' + t('prod.count');
    $('products-empty').hidden = list.length > 0;
    $('products-list').innerHTML = list.map(function (p) {
      var img = p.image_url
        ? '<img src="' + esc(p.image_url) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
        : '<span class="prod-thumb-empty">?</span>';
      var flags = '';
      if (p.featured) flags += '<span class="chip-flag">★</span>';
      if (!p.active) flags += '<span class="chip-flag chip-flag--off">' + t('off') + '</span>';
      if (Number(p.stock) <= 0) flags += '<span class="chip-flag chip-flag--danger">' + t('rupture') + '</span>';
      else if (Number(p.stock) <= 5) flags += '<span class="chip-flag chip-flag--warn">stock ' + esc(p.stock) + '</span>';
      return '<button class="prod-card" data-open-product="' + esc(p.id) + '">' +
        '<span class="prod-thumb">' + img + '</span>' +
        '<span class="prod-info"><span class="prod-name">' + esc(p.name_fr || p.sku || '—') + '</span>' +
        '<span class="prod-meta">' + esc(t('cat.' + p.category)) + ' · ' + fmtDT(p.price) + '</span></span>' +
        '<span class="prod-flags">' + flags + '</span></button>';
    }).join('');
  }

  function openProductEditor(p) {
    state.editingId = p ? p.id : null;
    state.pfGallery = p && Array.isArray(p.images) && p.images.length ? p.images.slice()
      : (p && p.image_url ? [p.image_url] : []);
    state.pfNew = [];
    $('pf-title').textContent = t(p ? 'pf.edit' : 'pf.new');
    $('pf-name-fr').value = p ? (p.name_fr || '') : '';
    $('pf-name-en').value = p ? (p.name_en || '') : '';
    $('pf-name-ar').value = p ? (p.name_ar || '') : '';
    $('pf-desc-fr').value = p ? (p.desc_fr || '') : '';
    $('pf-desc-en').value = p ? (p.desc_en || '') : '';
    $('pf-desc-ar').value = p ? (p.desc_ar || '') : '';
    $('pf-category').value = p ? p.category : 'inspires';
    $('pf-sku').value = p ? (p.sku || '') : '';
    $('pf-price').value = p ? p.price : '';
    $('pf-old-price').value = (p && p.old_price != null) ? p.old_price : '';
    $('pf-stock').value = p ? p.stock : 10;
    $('pf-featured').checked = !!(p && p.featured);
    $('pf-active').checked = p ? !!p.active : true;
    var delBtn = $('pf-delete');
    if (delBtn) delBtn.hidden = !p;
    $('pf-image').value = '';
    renderPfGallery();
    showMsg('pf-msg', '');
    showMsg('pf-img-msg', '');
    openSheet('pf');
  }

  function renderPfGallery() {
    var box = $('pf-gallery');
    if (!box) return;
    var html = state.pfGallery.map(function (u, i) {
      return '<div class="g-thumb' + (i === 0 ? ' is-primary' : '') + '" data-gurl="' + esc(u) + '">' +
        '<img src="' + esc(u) + '" alt="" onerror="this.parentElement.remove()">' +
        (i === 0 ? '<span class="g-tag">1</span>' : '') +
        '<button type="button" class="g-del" data-gdel="' + esc(u) + '" aria-label="Retirer">✕</button>' +
        '</div>';
    }).join('');
    html += state.pfNew.map(function (f, i) {
      return '<div class="g-thumb g-thumb--new" data-gfile="' + i + '">' +
        '<img src="' + esc(URL.createObjectURL(f)) + '" alt="">' +
        '<button type="button" class="g-del" data-gdelfile="' + i + '" aria-label="Retirer">✕</button>' +
        '</div>';
    }).join('');
    html += '<label class="g-add" for="pf-img-input" aria-label="Ajouter des images">＋</label>';
    box.innerHTML = html;
    var saveBtn = $('pf-save');
    if (saveBtn && (state.pfNew.length || state.pfGallery.length)) {
      saveBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      saveBtn.classList.remove('btn--pulse'); void saveBtn.offsetWidth;
      saveBtn.classList.add('btn--pulse');
    }
    var gCount = state.pfGallery.length + state.pfNew.length;
    showMsg('pf-img-msg', gCount > 1 ? gCount + ' ' + t('pf.imgCount') : '', true);
  }

  function renderHeroGallery() {
    var box = $('hero-gallery');
    if (!box) return;
    var html = state.heroList.map(function (u) {
      return '<div class="g-thumb" data-gurl="' + esc(u) + '">' +
        '<img src="' + esc(u) + '" alt="" onerror="this.parentElement.remove()">' +
        '<button type="button" class="g-del" data-hdel="' + esc(u) + '" aria-label="Retirer">✕</button>' +
        '</div>';
    }).join('');
    html += state.heroNew.map(function (f, i) {
      return '<div class="g-thumb g-thumb--new" data-gfile="' + i + '">' +
        '<img src="' + esc(URL.createObjectURL(f)) + '" alt="">' +
        '<button type="button" class="g-del" data-hdelfile="' + i + '" aria-label="Retirer">✕</button>' +
        '</div>';
    }).join('');
    html += '<label class="g-add" for="hero-file-input" aria-label="Ajouter des images héro">＋</label>';
    box.innerHTML = html;
    var saveBtn = $('btn-save-hero');
    if (saveBtn && (state.heroNew.length || state.heroList.length)) {
      saveBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      saveBtn.classList.remove('btn--pulse'); void saveBtn.offsetWidth;
      saveBtn.classList.add('btn--pulse');
    }
  }

  function renderBannerGallery() {
    var box = $('banner-gallery');
    if (!box) return;
    var html = state.bannerList.map(function (u) {
      return '<div class="g-thumb" data-gurl="' + esc(u) + '">' +
        '<img src="' + esc(u) + '" alt="" onerror="this.parentElement.remove()">' +
        '<button type="button" class="g-del" data-bdel="' + esc(u) + '" aria-label="Retirer">✕</button>' +
        '</div>';
    }).join('');
    html += state.bannerNew.map(function (f, i) {
      return '<div class="g-thumb g-thumb--new" data-gfile="' + i + '">' +
        '<img src="' + esc(URL.createObjectURL(f)) + '" alt="">' +
        '<button type="button" class="g-del" data-bdelfile="' + i + '" aria-label="Retirer">✕</button>' +
        '</div>';
    }).join('');
    html += '<label class="g-add" for="banner-file-input" aria-label="Ajouter des images bannière">＋</label>';
    box.innerHTML = html;
  }

  function uploadToBucket(file, pathPrefix) {
    return new Promise(function (resolve, reject) {
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      var name = pathPrefix + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext;
      var url = SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + name;
      fetch(url, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + getToken(), 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
        body: file
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error('upload HTTP ' + r.status + ' ' + t.slice(0, 120)); });
        return r.json();
      }).then(function () {
        resolve(SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + name);
      }).catch(reject);
    });
  }

  async function saveProduct(e) {
    e.preventDefault();
    var nameFr = $('pf-name-fr').value.trim();
    var price = Number($('pf-price').value);
    if (!nameFr) { showMsg('pf-msg', t('pf.errName')); return; }
    if (!(price > 0)) { showMsg('pf-msg', t('pf.errPrice')); return; }

    var btn = $('pf-save');
    btn.disabled = true;
    try {
      // gather committed urls + pasted URL + fresh uploads
      var gallery = state.pfGallery.slice();
      var pasted = $('pf-image').value.trim();
      if (pasted && gallery.indexOf(pasted) === -1) gallery.push(pasted);
      for (var fi = 0; fi < state.pfNew.length; fi++) {
        showMsg('pf-img-msg', t('pf.uploading') + ' ' + (fi + 1) + '/' + state.pfNew.length + '…');
        gallery.push(await uploadToBucket(state.pfNew[fi], 'products'));
      }
      var imageUrl = gallery[0] || '';

      var payload = {
        name_fr: nameFr,
        name_en: $('pf-name-en').value.trim() || nameFr,
        name_ar: $('pf-name-ar').value.trim() || nameFr,
        desc_fr: $('pf-desc-fr').value.trim() || null,
        desc_en: $('pf-desc-en').value.trim() || null,
        desc_ar: $('pf-desc-ar').value.trim() || null,
        category: $('pf-category').value,
        sku: $('pf-sku').value.trim() || null,
        price: price,
        old_price: $('pf-old-price').value === '' ? null : Number($('pf-old-price').value),
        stock: $('pf-stock').value === '' ? 0 : Math.max(0, parseInt($('pf-stock').value, 10)),
        featured: $('pf-featured').checked,
        active: $('pf-active').checked,
        image_url: imageUrl || null,
        images: gallery
      };

      var res;
      if (state.editingId) {
        res = await api('PATCH', '/rest/v1/products?id=eq.' + state.editingId, payload, 'return=minimal');
      } else {
        res = await api('POST', '/rest/v1/products', payload, 'return=representation');
      }
      if (!res.ok) {
        var errTxt = await res.text();
        throw new Error('HTTP ' + res.status + ' ' + errTxt.slice(0, 140));
      }
      closeSheet('pf');
      await loadProducts();
      renderProducts();
      renderDashboard();
      toast(t(state.editingId ? 'prod.updated' : 'prod.created'), 'ok');
    } catch (err) {
      showMsg('pf-msg', t('pf.errPrefix') + err.message);
    } finally {
      btn.disabled = false;
    }
  }

  function deleteProduct(p) {
    confirmDialog(t('cf.delProduct') + (p.name_fr || p.sku) + t('cf.delProductSuffix'), async function () {
      try {
        var res = await api('DELETE', '/rest/v1/products?id=eq.' + p.id, undefined, 'return=minimal');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        closeSheet('pf');
        await loadProducts();
        renderProducts();
        renderDashboard();
        toast(t('prod.deleted'), 'ok');
      } catch (e) { toast(t('ord.delFail'), 'err'); }
    });
  }

  /* ---------- settings ---------- */
  function renderSettings() {
    var box = $('settings-fields');
    // keep any unsaved edits when re-rendering (e.g. after an image upload)
    var drafts = {};
    $all('#settings-fields [data-setting]').forEach(function (el) {
      drafts[el.getAttribute('data-setting')] = el.value;
    });
    box.innerHTML = SETTINGS_FIELDS.map(function (f) {
      var val = drafts[f.key] !== undefined ? drafts[f.key] : state.settings[f.key];
      if (val == null) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      var input;
      if (f.type === 'textarea') {
        input = '<textarea class="field-input" data-setting="' + f.key + '" rows="2"' + (f.dir ? ' dir="' + f.dir + '"' : '') + '>' + esc(val) + '</textarea>';
      } else {
        input = '<input class="field-input" data-setting="' + f.key + '" type="' + (f.type === 'number' ? 'number' : 'text') + '"' +
          (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') + ' value="' + esc(val) + '">';
      }
      return '<div class="field"><label class="field-label">' + esc(t(f.k)) + '</label>' + input + '</div>';
    }).join('');

    var heroList = Array.isArray(state.settings.hero_images) ? state.settings.hero_images.slice()
      : (state.settings.hero_image ? [state.settings.hero_image] : []);
    state.heroList = heroList;
    state.heroListBackup = heroList.slice();
    state.heroNew = [];
    renderHeroGallery();
    var ap = $('hero-autoplay');
    var bannerList = Array.isArray(state.settings.banner_images) ? state.settings.banner_images.slice()
      : (state.settings.banner_image ? [state.settings.banner_image] : []);
    state.bannerList = bannerList.filter(function (u) { return typeof u === 'string' && u; });
    state.bannerBackup = state.bannerList.slice();
    state.bannerNew = [];
    renderBannerGallery();
    var bap = $('banner-autoplay');
    if (bap) bap.checked = state.settings.banner_autoplay !== false;
    if (ap) ap.checked = state.settings.hero_autoplay !== false;
  }

  async function saveSettings() {
    var btn = $('btn-save-settings');
    btn.disabled = true;
    try {
      var rows = [];
      $all('#settings-fields [data-setting]').forEach(function (el) {
        var key = el.getAttribute('data-setting');
        var raw = el.value.trim();
        var val;
        var def = SETTINGS_FIELDS.filter(function (f) { return f.key === key; })[0];
        if (def && def.type === 'number') {
          if (raw === '') return;
          val = Number(raw);
          if (isNaN(val)) return;
        } else {
          val = raw;
        }
        rows.push({ key: key, value: val });
      });
      if (!rows.length) { showMsg('settings-msg', t('set.nothing')); return; }
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', rows, 'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      await loadSettings();
      showMsg('settings-msg', t('set.saved'), true);
      toast(t('set.saved'), 'ok');
    } catch (e) {
      showMsg('settings-msg', t('pf.errPrefix') + e.message);
    } finally {
      btn.disabled = false;
    }
  }

  async function saveHeroMedia() {
    try {
      var list = state.heroList.slice();
      for (var i = 0; i < state.heroNew.length; i++) {
        showMsg('hero-msg', t('pf.uploading') + ' ' + (i + 1) + '/' + state.heroNew.length + '…');
        list.push(await uploadToBucket(state.heroNew[i], 'site'));
      }
      // empty save -> fall back to the site's default hero image
      if (!list.length) {
        list = ['i/new/hero.jpg'];
        showMsg('hero-msg', t('set.defaultApplied'), true);
      }
      var rows = [{ key: 'hero_images', value: list }];
      var ap = $('hero-autoplay');
      if (ap) rows.push({ key: 'hero_autoplay', value: !!ap.checked });
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', rows,
        'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.settings.hero_images = list;
      state.heroList = list.slice();
      state.heroNew = [];
      renderSettings();
      showMsg('hero-msg', list.length > 1 ? t('set.heroSavedN') + ' (' + list.length + ')' : t('set.heroSaved1'), true);
      toast(t('set.saved'), 'ok');
    } catch (e) {
      showMsg('hero-msg', t('pf.errPrefix') + e.message);
    }
  }

  async function saveBannerMedia() {
    try {
      var btn = $('btn-save-banner');
      btn.disabled = true;
      var list = state.bannerList.slice();
      for (var i = 0; i < state.bannerNew.length; i++) {
        showMsg('banner-msg', t('pf.uploading') + ' ' + (i + 1) + '/' + state.bannerNew.length + '…');
        list.push(await uploadToBucket(state.bannerNew[i], 'site'));
      }
      // empty save -> fall back to the site's default banner image
      if (!list.length) {
        list = ['i/new/banner1.jpg'];
        showMsg('banner-msg', t('set.defaultApplied'), true);
      }
      var rows = [{ key: 'banner_images', value: list }];
      var ap = $('banner-autoplay');
      if (ap) rows.push({ key: 'banner_autoplay', value: !!ap.checked });
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', rows,
        'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.settings.banner_images = list;
      state.bannerList = list.slice();
      state.bannerNew = [];
      state.bannerBackup = list.slice();
      renderBannerGallery();
      showMsg('banner-msg', list.length > 1 ? t('set.bannerSavedN') : t('set.imgUpdated'), true);
      toast(t('set.bannerSavedN'), 'ok');
    } catch (e) {
      showMsg('banner-msg', t('pf.errPrefix') + e.message);
    } finally {
      var b2 = $('btn-save-banner');
      if (b2) b2.disabled = false;
    }
  }

    async function uploadSingle(key, file, msgId) {
    try {
      showMsg(msgId, t('pf.uploading') + '…');
      var url = await uploadToBucket(file, 'site');
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key',
        [{ key: key, value: url }], 'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.settings[key] = url;
      renderSettings();
      showMsg(msgId, t('set.imgUpdated'), true);
      toast(t('set.saved'), 'ok');
    } catch (e) {
      showMsg(msgId, t('pf.errPrefix') + e.message);
    }
  }

  /* ---------- sheets / dialogs ---------- */
  function openSheet(which) {
    var sheet = $(which === 'order' ? 'order-sheet' : 'pf-sheet');
    var scrim = $(which === 'order' ? 'order-scrim' : 'pf-scrim');
    sheet.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('open'); });
    document.body.classList.add('locked');
  }
  function closeSheet(which) {
    var sheet = $(which === 'order' ? 'order-sheet' : 'pf-sheet');
    var scrim = $(which === 'order' ? 'order-scrim' : 'pf-scrim');
    sheet.classList.remove('open');
    scrim.hidden = true;
    sheet.hidden = true;
    document.body.classList.remove('locked');
  }

  var confirmCb = null;
  function confirmDialog(text, cb) {
    $('confirm-text').textContent = text;
    confirmCb = cb;
    $('confirm-scrim').hidden = false;
  }
  function closeConfirm() {
    $('confirm-scrim').hidden = true;
    confirmCb = null;
  }

  /* ---------- realtime / polling ---------- */
  function startRealtime() {
    if (state.channel) return;
    state.channel = sb.channel('orders-admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, function () {
        loadOrders().then(function () { renderOrders(); renderDashboard(); }).catch(function () { /* noop */ });
      })
      .subscribe(function (status) {
        state.realtimeOk = (status === 'SUBSCRIBED');
        setConnDot();
        if (state.realtimeOk) stopPolling(); else startPolling();
      });
    setTimeout(function () {
      if (!state.realtimeOk && state.user) { startPolling(); setConnDot(); }
    }, 6000);
  }
  function stopRealtime() {
    if (state.channel) { try { sb.removeChannel(state.channel); } catch (e) { /* noop */ } state.channel = null; }
    stopPolling();
    state.realtimeOk = false;
  }
  function startPolling() {
    if (state.pollTimer) return;
    state.pollTimer = setInterval(function () {
      if (!state.user) return;
      loadOrders().then(function () { renderOrders(); renderDashboard(); }).catch(function () { /* noop */ });
    }, POLL_MS);
  }
  function stopPolling() {
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
  }
  function setConnDot() {
    $('conn-dot').classList.toggle('on', state.realtimeOk);
    $('conn-dot').classList.toggle('poll', !state.realtimeOk);
  }

  /* ---------- boot / bind ---------- */
  /* ---------- reviews moderation ---------- */
  function loadRevAdmin() {
    var box = $('revAdminList');
    if (!box) return;
    box.innerHTML = '<p class="rev-admin-empty">Chargement…</p>';
    api('GET', '/rest/v1/reviews?select=id,product_id,user_name,rating,comment,created_at&order=created_at.desc&limit=200')
      .then(function (r) { return r.text().then(function (tx) { return { s: r.status, t: tx }; }); })
      .then(function (res) {
        if (res.s !== 200) { box.innerHTML = '<p class="rev-admin-empty">Erreur de chargement</p>'; return; }
        var rows = [];
        try { rows = JSON.parse(res.t) || []; } catch (e) {}
        if (!rows.length) { box.innerHTML = '<p class="rev-admin-empty">Aucun avis pour le moment.</p>'; return; }
        var ids = rows.map(function (rv) { return 'id.eq.' + rv.product_id; }).join('|');
        api('GET', '/rest/v1/products?select=id,name_fr&or=' + encodeURIComponent(ids))
          .then(function (r2) { return r2.text().then(function (tx) { return { s: r2.status, t: tx }; }); })
          .then(function (res2) {
            var pmap = {};
            try { (JSON.parse(res2.t) || []).forEach(function (pp) { pmap[pp.id] = pp.name_fr; }); } catch (e) {}
            box.innerHTML = rows.map(function (rv) {
              var d = new Date(rv.created_at);
              var ds = isNaN(d) ? '' : d.toLocaleDateString('fr-FR');
              return '<div class="rev-admin-item">' +
                '<div class="rev-admin-top"><span class="rev-admin-name">' + esc(rv.user_name || 'Client') + '</span>' +
                '<span class="rev-admin-stars">' + '★'.repeat(rv.rating) + '☆'.repeat(5 - rv.rating) + '</span>' +
                '<span class="rev-admin-date">' + ds + '</span>' +
                '<button class="rev-admin-del" type="button" data-rev-del="' + esc(rv.id) + '">Supprimer</button></div>' +
                '<p class="rev-admin-prod">' + esc(pmap[rv.product_id] || '') + '</p>' +
                (rv.comment ? '<p class="rev-admin-comment">' + esc(rv.comment) + '</p>' : '') +
                '</div>';
            }).join('');
          });
      });
  }

  function bindRevAdmin() {
    var box = $('revAdminList');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rev-del]');
      if (!b) return;
      var id = b.getAttribute('data-rev-del');
      confirmDialog('Supprimer cet avis ?', function () {
        api('DELETE', '/rest/v1/reviews?id=eq.' + encodeURIComponent(id))
          .then(function (r) {
            if (r.status === 204 || r.status === 404) { toast('Avis supprimé'); loadRevAdmin(); }
          });
      });
    });
  }

  function enterApp() {
    $('view-login').hidden = true;
    $('app-shell').hidden = false;
    showView('dashboard');
    Promise.all([loadOrders(), loadProducts(), loadSettings()])
      .then(function () {
        renderDashboard();
        renderOrders();
        renderProducts();
        renderSettings();
        bindRevAdmin();
        loadRevAdmin();
        startRealtime();
        setConnDot();
      })
      .catch(function (e) { toast(t('toast.loadErr') + e.message, 'err'); });
  }

  function bind() {
    // language switcher
    $all('#lang-sw button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });

    // login
    $('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = $('login-btn');
      var email = $('login-email').value.trim();
      var pw = $('login-password').value;
      if (!email || !pw) { showMsg('login-msg', t('login.errFields')); return; }
      btn.disabled = true;
      try {
        var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: pw })
        });
        if (!r.ok) throw new Error(t('login.errBad'));
        var j = await r.json();
        state.user = { access_token: j.access_token, refresh_token: j.refresh_token, email: email };
        try { localStorage.setItem('sm_admin_session', JSON.stringify(state.user)); } catch (err) { /* noop */ }
        enterApp();
      } catch (err) {
        showMsg('login-msg', err.message || t('login.errBad'));
      } finally {
        btn.disabled = false;
      }
    });

    $('pw-toggle').addEventListener('click', function () {
      var inp = $('login-password');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    // logout
    document.addEventListener('click', async function (e) {
      var lo = e.target.closest('#btn-logout, #btn-logout-2');
      if (lo) {
        stopRealtime();
        state.user = null;
        try { localStorage.removeItem('sm_admin_session'); } catch (err) { /* noop */ }
        $('app-shell').hidden = true;
        $('view-login').hidden = false;
      }
    });

    // tabbar + dashboard goto
    $all('.tab-item').forEach(function (t) {
      t.addEventListener('click', function () { showView(t.getAttribute('data-nav')); });
    });
    $all('.stat-card[data-goto]').forEach(function (c) {
      c.addEventListener('click', function () { showView(c.getAttribute('data-goto')); });
    });

    $('btn-refresh').addEventListener('click', async function () {
      try {
        await Promise.all([loadOrders(), loadProducts(), loadSettings()]);
        renderDashboard(); renderOrders(); renderProducts(); renderSettings();
        toast(t('toast.refreshed'), 'ok');
      } catch (e) { toast(t('toast.refreshFail'), 'err'); }
    });

    // orders filter + search
    $all('#orders-chips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        state.orderFilter = c.getAttribute('data-filter');
        $all('#orders-chips .chip').forEach(function (x) { x.classList.toggle('active', x === c); });
        renderOrders();
      });
    });
    $('orders-search').addEventListener('input', renderOrders);
    /* csv export removed per user request */

    // products search + new
    $('products-search').addEventListener('input', renderProducts);
    $('btn-new-product').addEventListener('click', function () { openProductEditor(null); });

    // open order / product cards (delegated)
    document.addEventListener('click', function (e) {
      var oo = e.target.closest('[data-open-order]');
      if (oo) {
        var o = state.orders.filter(function (x) { return x.id === oo.getAttribute('data-open-order'); })[0];
        if (o) { state.currentOrder = o; renderOrderSheet(o); openSheet('order'); }
        return;
      }
      var op = e.target.closest('[data-open-product]');
      if (op) {
        if (op.closest('#dash-lowstock') || op.closest('.prod-list')) {
          var p = state.products.filter(function (x) { return x.id === op.getAttribute('data-open-product'); })[0];
          if (p) openProductEditor(p);
        }
        return;
      }
    });

    // order sheet close
    $('order-close').addEventListener('click', function () { closeSheet('order'); });
    $('order-scrim').addEventListener('click', function () { closeSheet('order'); });

    // product sheet
    $('pf-close').addEventListener('click', function () { closeSheet('pf'); });
    $('pf-scrim').addEventListener('click', function () { closeSheet('pf'); });
    $('pf-cancel').addEventListener('click', function () { closeSheet('pf'); });
    $('pf-delete').addEventListener('click', function () {
      var p = state.products.filter(function (x) { return x.id === state.editingId; })[0];
      if (p) deleteProduct(p);
    });
    $('product-form').addEventListener('submit', saveProduct);

    // product gallery: multi-pick
    $('pf-img-input').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []);
      var rejected = 0;
      files.forEach(function (f) {
        if (f.size > 5 * 1024 * 1024) { rejected++; return; }
        state.pfNew.push(f);
      });
      if (rejected) showMsg('pf-img-msg', rejected + ' ✕ — ' + t('pf.imgHeavy'), false);
      renderPfGallery();
      this.value = '';
    });
    // paste URL + Enter to append
    $('pf-image').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addPfUrl(); }
    });
    $('pf-image').addEventListener('blur', addPfUrl);
    function addPfUrl() {
      var v = $('pf-image').value.trim();
      if (!v) return;
      if (/^https?:\/\//i.test(v) && state.pfGallery.indexOf(v) === -1) {
        state.pfGallery.push(v);
        renderPfGallery();
      } else if (!/^https?:\/\//i.test(v)) {
        showMsg('pf-img-msg', t('pf.imgBad'), false);
      }
      $('pf-image').value = '';
    }
    // delegated remove (committed urls + fresh files), shared by both galleries
    document.addEventListener('click', function (e) {
      var del = e.target.closest('[data-gdel]');
      if (del) {
        state.pfGallery = state.pfGallery.filter(function (u) { return u !== del.getAttribute('data-gdel'); });
        renderPfGallery();
        return;
      }
      var delf = e.target.closest('[data-gdelfile]');
      if (delf) {
        state.pfNew.splice(Number(delf.getAttribute('data-gdelfile')), 1);
        renderPfGallery();
        return;
      }
      var hdel = e.target.closest('[data-hdel]');
      if (hdel) {
        state.heroList = state.heroList.filter(function (u) { return u !== hdel.getAttribute('data-hdel'); });
        renderHeroGallery();
        return;
      }
      var hdelf = e.target.closest('[data-hdelfile]');
      if (hdelf) {
        state.heroNew.splice(Number(hdelf.getAttribute('data-hdelfile')), 1);
        renderHeroGallery();
        return;
      }
      var bdel = e.target.closest('[data-bdel]');
      if (bdel) {
        state.bannerList = state.bannerList.filter(function (u) { return u !== bdel.getAttribute('data-bdel'); });
        renderBannerGallery();
        return;
      }
      var bdelf = e.target.closest('[data-bdelfile]');
      if (bdelf) {
        state.bannerNew.splice(Number(bdelf.getAttribute('data-bdelfile')), 1);
        renderBannerGallery();
      }
    });

    // hero gallery: multi-pick (staged, saved with the button)
    $('hero-file-input').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []);
      var rejected = 0;
      files.forEach(function (f) {
        if (f.size > 5 * 1024 * 1024) { rejected++; return; }
        state.heroNew.push(f);
      });
      if (rejected) showMsg('hero-msg', rejected + ' ✕ — ' + t('pf.imgHeavy'), false);
      renderHeroGallery();
      this.value = '';
    });
    $('btn-save-hero').addEventListener('click', saveHeroMedia);
    $('banner-file-input').addEventListener('change', function () {
      var files = Array.prototype.slice.call(this.files || []);
      var rejected = 0;
      files.forEach(function (f) {
        if (f.size > 5 * 1024 * 1024) { rejected++; return; }
        state.bannerNew.push(f);
      });
      if (rejected) showMsg('banner-msg', rejected + ' ✕ — ' + t('pf.imgHeavy'), false);
      renderBannerGallery();
      this.value = '';
    });
    $('btn-save-banner').addEventListener('click', saveBannerMedia);
    $('logo-file-input').addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) { showMsg('logo-msg', 'Image trop lourde (max 5 Mo).'); return; }
      uploadSingle('logo_image', f, 'logo-msg');
      this.value = '';
    });

    // settings save
    $('btn-save-settings').addEventListener('click', saveSettings);

    // confirm dialog
    $('confirm-no').addEventListener('click', closeConfirm);
    $('confirm-scrim').addEventListener('click', function (e) {
      if (e.target === $('confirm-scrim')) closeConfirm();
    });
    $('confirm-yes').addEventListener('click', function () {
      var cb = confirmCb;
      closeConfirm();
      if (cb) cb();
    });

    // esc closes topmost
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('confirm-scrim').hidden) closeConfirm();
        else if (!$('pf-sheet').hidden) closeSheet('pf');
        else if (!$('order-sheet').hidden) closeSheet('order');
      }
    });
  }

  async function boot() {
    bind();
    var savedLang = null;
    try { savedLang = localStorage.getItem('sm_admin_lang'); } catch (e) { /* noop */ }
    applyLang(savedLang || 'fr');
    var ok = await restoreSession();
    if (ok) enterApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
