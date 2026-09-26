/* ═══════════════════════════════════════════════════════════════
   STE Mondial — admin (Rosa-skinned)
   Same chrome as Rosa Fragrances admin (tabs, hash routing, Jost/
   Cormorant, bottom nav on mobile) over the STE Supabase schema
   (trilingual products, audience, site_settings, orders).
   Plain REST, no build step.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';
  var ADMIN_EMAILS = ['azmmeli146@gmail.com'];
  var BUCKET = 'products';
  var POLL_MS = 30000;
  var TABS = ['overview', 'add', 'collections', 'orders', 'settings', 'edit'];

  var AUDS = {
    homme:   { icon: 'fa-male',       fr: 'Homme',   en: 'Men',   ar: 'رجالي' },
    femme:   { icon: 'fa-female',     fr: 'Femme',   en: 'Women', ar: 'نسائي' },
    unisexe: { icon: 'fa-genderless', fr: 'Unisexe', en: 'Unisex',ar: 'للجنسين' },
    enfants: { icon: 'fa-child',      fr: 'Enfants', en: 'Kids',  ar: 'أطفال' }
  };
  var STATUSES = ['nouvelle', 'confirmee', 'expediee', 'livree', 'annulee'];

  /* ── i18n (FR / EN / AR) ── */
  var I = {
    fr: {
      'login.sub': 'Espace administration', 'login.email': 'Email', 'login.password': 'Mot de passe',
      'login.btn': 'Connexion', 'login.foot': 'Accès réservé — STE Mondial Parfums',
      'login.errFields': 'Email et mot de passe requis.', 'login.errBad': 'Identifiants incorrects',
      'dtab.ov': 'Aperçu', 'dtab.add': 'Ajouter', 'dtab.cat': 'Collections', 'dtab.ord': 'Commandes', 'dtab.set': 'Paramètres',
      'top.refresh': 'Rafraîchir', 'top.logout': 'Déconnexion',
      'dash.title': 'Tableau de bord', 'dash.t1': "Aujourd'hui", 'dash.t1h': 'commandes',
      'dash.t2': 'CA du jour', 'dash.t2h': 'hors annulées', 'dash.t3': 'En attente', 'dash.t3h': 'nouvelle + confirmée',
      'dash.t4': 'Stock faible', 'dash.t4h': 'stock ≤ 5', 'dash.recent': 'Dernières commandes', 'dash.lowcard': 'Stock faible (≤ 5)',
      'dash.emptyRecent': 'Pas encore de commandes.', 'dash.emptyLow': 'Tous les stocks sont bons ✓',
      'aud.homme': 'Homme', 'aud.femme': 'Femme', 'aud.unisexe': 'Unisexe', 'aud.enfants': 'Enfants',
      'cat.all': 'Tous', 'catTitle.all': 'Tous les produits',
      'prod.new': '+ Nouveau produit', 'prod.count': 'produit(s)', 'prod.search': 'Rechercher un produit...',
      'prod.created': 'Produit créé ✓', 'prod.updated': 'Produit mis à jour ✓', 'prod.deleted': 'Produit supprimé',
      'prod.name': 'Produit', 'prod.price': 'Prix', 'prod.stock': 'Stock', 'prod.actions': 'Actions',
      'inStock': 'En stock', 'lowStock': 'Stock faible', 'outOfStock': 'Rupture', 'off': 'Inactif', 'feat': 'En vedette',
      'addProduct': 'Ajouter un produit', 'loading': 'Chargement...', 'back': 'Retour', 'editHint': 'Choisissez un produit dans Collections → Modifier.',
      'edit': 'Modifier', 'del': 'Supprimer', 'saveChanges': 'Enregistrer les modifications',
      'pf.new': 'Nouveau produit', 'pf.edit': 'Modifier le produit',
      'pf.nameFR': 'Nom (FR) *', 'pf.nameEN': 'Nom (EN)', 'pf.nameAR': 'Nom (AR)',
      'pf.descFR': 'Description (FR)', 'pf.descEN': 'Description (EN)', 'pf.descAR': 'Description (AR)',
      'pf.aud': 'Public *', 'pf.sku': 'Référence (SKU)', 'pf.price': 'Prix (DT) *', 'pf.oldPrice': 'Ancien prix — promo (optionnel)',
      'pf.stock': 'Stock', 'pf.featured': 'Mis en avant', 'pf.active': 'Actif',
      'pf.images': 'Images du produit', 'pf.imgHelp': 'La 1re image = principale.',
      'pf.save': 'Enregistrer le produit', 'pf.cancel': 'Annuler', 'pf.delete': 'Supprimer',
      'pf.errName': 'Le nom (FR) est obligatoire.', 'pf.errPrice': 'Prix invalide.',
      'pf.uploading': "Envoi de l'image", 'pf.errPrefix': 'Erreur : ', 'pf.imgBad': 'URL invalide — http(s):// requis.',
      'ord.title': 'Gestion des commandes', 'ord.search': 'ID, nom, téléphone, ville...', 'ord.all': 'Toutes',
      'badgeWord': 'commandes',
      'stRevenue': "Chiffre d'affaires", 'stRevenueSub': 'expédiées + livrées', 'stTotal': 'Total commandes',
      'stPending': 'En attente', 'stShipped': 'Expédiées', 'stDelivered': 'Livrées', 'stCancelled': 'Annulées',
      'st.nouvelle': 'Nouvelle', 'st.confirmee': 'Confirmée', 'st.expediee': 'Expédiée', 'st.livree': 'Livrée', 'st.annulee': 'Annulée',
      'ord.client': 'Client', 'ord.phone': 'Tél', 'ord.wa': 'WhatsApp', 'ord.items': 'Articles', 'ord.total': 'Total',
      'ord.call': 'Appeler', 'ord.received': 'Reçue', 'ord.emptyT': 'Aucune commande', 'ord.emptyS': 'Les commandes du site arrivent ici.',
      'ord.statusOk': 'Statut → ', 'ord.statusFail': "Échec du changement de statut", 'ord.deleted': 'Commande supprimée', 'ord.delFail': 'Échec de la suppression',
      'ord.del': 'Supprimer la commande', 'cf.delOrder': 'Supprimer définitivement cette commande ?',
      'cf.delProduct': 'Supprimer « ', 'cf.delProductSuffix': ' » définitivement ?', 'cf.delReview': "Supprimer cet avis ?",
      'set.shopCard': 'Boutique & livraison', 'set.sub': 'Nom, WhatsApp, frais, annonce.', 'set.shopName': 'Nom de la boutique',
      'set.whatsapp': 'WhatsApp (ex: 21612345678)', 'set.delivery': 'Frais de livraison (DT)',
      'set.annFr': 'Bandeau annonce (FR)', 'set.annEn': 'Bandeau annonce (EN)', 'set.annAr': 'Bandeau annonce (AR)',
      'set.save': 'Enregistrer', 'set.saved': 'Réglages enregistrés ✓', 'set.nothing': 'Rien à enregistrer.',
      'set.heroCard': 'Images héro (diaporama)', 'set.heroHelp': "Plusieurs images = diaporama. La 1re est l'image principale.",
      'set.saveHero': 'Enregistrer le héro', 'set.heroSaved1': 'Image héro enregistrée ✓', 'set.heroSavedN': 'Diaporama héro enregistré ✓',
      'set.bannerCard': 'Bannière promo', 'set.bannerHelp': "L'image affichée dans la section promotion de l'accueil.",
      'set.saveBanner': 'Enregistrer la bannière', 'set.bannerSavedN': 'Bannière enregistrée ✓',
      'set.autoplay': 'Défilement automatique', 'set.logoCard': 'Logo', 'set.logoHelp': "Affiché dans l'en-tête et le pied de page.",
      'set.uploadLogo': 'Changer le logo', 'set.imgUpdated': 'Image mise à jour ✓', 'set.defaultApplied': 'Aucune image — défaut appliqué.',
      'nav.reviews': 'Avis clients', 'rev.empty': 'Aucun avis pour le moment.', 'rev.err': 'Indisponible',
      'rev.del': 'Supprimer', 'rev.deleted': 'Avis supprimé',
      'toast.refreshed': 'Données actualisées ✓', 'toast.loadErr': 'Erreur de chargement : ', 'prod.delFail': 'Échec de la suppression'
    },
    en: {
      'login.sub': 'Admin area', 'login.email': 'Email', 'login.password': 'Password',
      'login.btn': 'Sign in', 'login.foot': 'Restricted access — STE Mondial Parfums',
      'login.errFields': 'Email and password required.', 'login.errBad': 'Incorrect credentials',
      'dtab.ov': 'Overview', 'dtab.add': 'Add', 'dtab.cat': 'Collections', 'dtab.ord': 'Orders', 'dtab.set': 'Settings',
      'top.refresh': 'Refresh', 'top.logout': 'Log out',
      'dash.title': 'Dashboard', 'dash.t1': 'Today', 'dash.t1h': 'orders',
      'dash.t2': "Today's revenue", 'dash.t2h': 'excl. cancelled', 'dash.t3': 'Pending', 'dash.t3h': 'new + confirmed',
      'dash.t4': 'Low stock', 'dash.t4h': 'stock ≤ 5', 'dash.recent': 'Latest orders', 'dash.lowcard': 'Low stock (≤ 5)',
      'dash.emptyRecent': 'No orders yet.', 'dash.emptyLow': 'All stock levels are good ✓',
      'aud.homme': 'Men', 'aud.femme': 'Women', 'aud.unisexe': 'Unisex', 'aud.enfants': 'Kids',
      'cat.all': 'All', 'catTitle.all': 'All products',
      'prod.new': '+ New product', 'prod.count': 'product(s)', 'prod.search': 'Search products...',
      'prod.created': 'Product created ✓', 'prod.updated': 'Product updated ✓', 'prod.deleted': 'Product deleted',
      'prod.name': 'Product', 'prod.price': 'Price', 'prod.stock': 'Stock', 'prod.actions': 'Actions',
      'inStock': 'In stock', 'lowStock': 'Low', 'outOfStock': 'Out', 'off': 'Hidden', 'feat': 'Featured',
      'addProduct': 'Add product', 'loading': 'Loading...', 'back': 'Back', 'editHint': 'Pick a product in Collections → Edit.',
      'edit': 'Edit', 'del': 'Delete', 'saveChanges': 'Save changes',
      'pf.new': 'New product', 'pf.edit': 'Edit product',
      'pf.nameFR': 'Name (FR) *', 'pf.nameEN': 'Name (EN)', 'pf.nameAR': 'Name (AR)',
      'pf.descFR': 'Description (FR)', 'pf.descEN': 'Description (EN)', 'pf.descAR': 'Description (AR)',
      'pf.aud': 'Audience *', 'pf.sku': 'Reference (SKU)', 'pf.price': 'Price (DT) *', 'pf.oldPrice': 'Old price — promo (optional)',
      'pf.stock': 'Stock', 'pf.featured': 'Featured', 'pf.active': 'Active',
      'pf.images': 'Product images', 'pf.imgHelp': '1st image = main.',
      'pf.save': 'Save product', 'pf.cancel': 'Cancel', 'pf.delete': 'Delete',
      'pf.errName': 'Name (FR) is required.', 'pf.errPrice': 'Invalid price.',
      'pf.uploading': 'Uploading image', 'pf.errPrefix': 'Error: ', 'pf.imgBad': 'Invalid URL — needs http(s)://.',
      'ord.title': 'Order management', 'ord.search': 'ID, name, phone, city...', 'ord.all': 'All',
      'badgeWord': 'orders',
      'stRevenue': 'Revenue', 'stRevenueSub': 'shipped + delivered', 'stTotal': 'Total orders',
      'stPending': 'Pending', 'stShipped': 'Shipped', 'stDelivered': 'Delivered', 'stCancelled': 'Cancelled',
      'st.nouvelle': 'New', 'st.confirmee': 'Confirmed', 'st.expediee': 'Shipped', 'st.livree': 'Delivered', 'st.annulee': 'Cancelled',
      'ord.client': 'Customer', 'ord.phone': 'Phone', 'ord.wa': 'WhatsApp', 'ord.items': 'Items', 'ord.total': 'Total',
      'ord.call': 'Call', 'ord.received': 'Received', 'ord.emptyT': 'No orders', 'ord.emptyS': 'Orders from the site arrive here.',
      'ord.statusOk': 'Status → ', 'ord.statusFail': 'Status change failed', 'ord.deleted': 'Order deleted', 'ord.delFail': 'Delete failed',
      'ord.del': 'Delete order', 'cf.delOrder': 'Permanently delete this order?',
      'cf.delProduct': 'Permanently delete « ', 'cf.delProductSuffix': ' »?', 'cf.delReview': 'Delete this review?',
      'set.shopCard': 'Shop & delivery', 'set.sub': 'Name, WhatsApp, fees, announcement.', 'set.shopName': 'Shop name',
      'set.whatsapp': 'WhatsApp (e.g. 21612345678)', 'set.delivery': 'Delivery fee (DT)',
      'set.annFr': 'Announcement banner (FR)', 'set.annEn': 'Announcement banner (EN)', 'set.annAr': 'Announcement banner (AR)',
      'set.save': 'Save', 'set.saved': 'Settings saved ✓', 'set.nothing': 'Nothing to save.',
      'set.heroCard': 'Hero images (slideshow)', 'set.heroHelp': 'Multiple images = slideshow. The 1st is the main one.',
      'set.saveHero': 'Save hero', 'set.heroSaved1': 'Hero image saved ✓', 'set.heroSavedN': 'Hero slideshow saved ✓',
      'set.bannerCard': 'Promo banner', 'set.bannerHelp': 'The image shown in the home promo section.',
      'set.saveBanner': 'Save banner', 'set.bannerSavedN': 'Banner saved ✓',
      'set.autoplay': 'Auto-play slideshow', 'set.logoCard': 'Logo', 'set.logoHelp': 'Shown in the header and footer.',
      'set.uploadLogo': 'Change logo', 'set.imgUpdated': 'Image updated ✓', 'set.defaultApplied': 'No images — default applied.',
      'nav.reviews': 'Customer reviews', 'rev.empty': 'No reviews yet.', 'rev.err': 'Unavailable',
      'rev.del': 'Delete', 'rev.deleted': 'Review deleted',
      'toast.refreshed': 'Data refreshed ✓', 'toast.loadErr': 'Loading error: ', 'prod.delFail': 'Delete failed'
    },
    ar: {
      'login.sub': 'منطقة الإدارة', 'login.email': 'البريد الإلكتروني', 'login.password': 'كلمة المرور',
      'login.btn': 'تسجيل الدخول', 'login.foot': 'الدخول مخصص — ست مونديال للعطور',
      'login.errFields': 'البريد وكلمة المرور مطلوبان.', 'login.errBad': 'بيانات غير صحيحة',
      'dtab.ov': 'نظرة عامة', 'dtab.add': 'إضافة', 'dtab.cat': 'المجموعات', 'dtab.ord': 'الطلبات', 'dtab.set': 'الإعدادات',
      'top.refresh': 'تحديث', 'top.logout': 'تسجيل الخروج',
      'dash.title': 'لوحة التحكم', 'dash.t1': 'اليوم', 'dash.t1h': 'طلبات',
      'dash.t2': 'مداخيل اليوم', 'dash.t2h': 'بلا الملغاة', 'dash.t3': 'في الانتظار', 'dash.t3h': 'جديدة + مؤكدة',
      'dash.t4': 'مخزون منخفض', 'dash.t4h': 'المخزون ≤ 5', 'dash.recent': 'آخر الطلبات', 'dash.lowcard': 'مخزون منخفض (≤ 5)',
      'dash.emptyRecent': 'لا طلبات بعد.', 'dash.emptyLow': 'كل المخزون جيد ✓',
      'aud.homme': 'رجالي', 'aud.femme': 'نسائي', 'aud.unisexe': 'للجنسين', 'aud.enfants': 'أطفال',
      'cat.all': 'الكل', 'catTitle.all': 'كل المنتجات',
      'prod.new': '+ منتج جديد', 'prod.count': 'منتج', 'prod.search': 'البحث عن منتج...',
      'prod.created': 'تم إنشاء المنتج ✓', 'prod.updated': 'تم تحديث المنتج ✓', 'prod.deleted': 'تم حذف المنتج',
      'prod.name': 'المنتج', 'prod.price': 'السعر', 'prod.stock': 'المخزون', 'prod.actions': 'إجراءات',
      'inStock': 'متوفر', 'lowStock': 'منخفض', 'outOfStock': 'نفد', 'off': 'مخفي', 'feat': 'مميز',
      'addProduct': 'إضافة منتج', 'loading': 'جاري التحميل...', 'back': 'رجوع', 'editHint': 'اختر منتجًا من المجموعات ← تعديل.',
      'edit': 'تعديل', 'del': 'حذف', 'saveChanges': 'حفظ التعديلات',
      'pf.new': 'منتج جديد', 'pf.edit': 'تعديل المنتج',
      'pf.nameFR': 'الاسم (FR) *', 'pf.nameEN': 'الاسم (EN)', 'pf.nameAR': 'الاسم (AR)',
      'pf.descFR': 'الوصف (FR)', 'pf.descEN': 'الوصف (EN)', 'pf.descAR': 'الوصف (AR)',
      'pf.aud': 'الفئة المستهدفة *', 'pf.sku': 'المرجع (SKU)', 'pf.price': 'السعر (د.ت) *', 'pf.oldPrice': 'السعر القديم — عرض (اختياري)',
      'pf.stock': 'المخزون', 'pf.featured': 'مميز', 'pf.active': 'نشط',
      'pf.images': 'صور المنتج', 'pf.imgHelp': 'الصورة الأولى = الأساسية.',
      'pf.save': 'حفظ المنتج', 'pf.cancel': 'إلغاء', 'pf.delete': 'حذف',
      'pf.errName': 'الاسم (FR) مطلوب.', 'pf.errPrice': 'سعر غير صالح.',
      'pf.uploading': 'رفع الصورة', 'pf.errPrefix': 'خطأ: ', 'pf.imgBad': 'رابط غير صالح — يلزم http(s)://.',
      'ord.title': 'إدارة الطلبات', 'ord.search': 'المعرّف، الاسم، الهاتف، المدينة...', 'ord.all': 'الكل',
      'badgeWord': 'طلب',
      'stRevenue': 'رقم المعاملات', 'stRevenueSub': 'مُرسلة + مستلمة', 'stTotal': 'إجمالي الطلبات',
      'stPending': 'في الانتظار', 'stShipped': 'مُرسلة', 'stDelivered': 'مستلمة', 'stCancelled': 'ملغاة',
      'st.nouvelle': 'جديدة', 'st.confirmee': 'مؤكدة', 'st.expediee': 'مُرسلة', 'st.livree': 'مستلمة', 'st.annulee': 'ملغاة',
      'ord.client': 'الزبون', 'ord.phone': 'الهاتف', 'ord.wa': 'واتساب', 'ord.items': 'المواد', 'ord.total': 'المجموع',
      'ord.call': 'اتصال', 'ord.received': 'وصلت', 'ord.emptyT': 'لا طلبات', 'ord.emptyS': 'طلبات الموقع تصل هنا.',
      'ord.statusOk': 'الحالة ← ', 'ord.statusFail': 'فشل تغيير الحالة', 'ord.deleted': 'تم حذف الطلب', 'ord.delFail': 'فشل الحذف',
      'ord.del': 'حذف الطلب', 'cf.delOrder': 'حذف هذا الطلب نهائيًا؟',
      'cf.delProduct': 'حذف « ', 'cf.delProductSuffix': ' » نهائيًا؟', 'cf.delReview': 'حذف هذا التقييم؟',
      'set.shopCard': 'المتجر والتوصيل', 'set.sub': 'الاسم، واتساب، الرسوم، الإعلان.', 'set.shopName': 'اسم المتجر',
      'set.whatsapp': 'واتساب (مثال: 21612345678)', 'set.delivery': 'رسوم التوصيل (د.ت)',
      'set.annFr': 'شريط الإعلان (FR)', 'set.annEn': 'شريط الإعلان (EN)', 'set.annAr': 'شريط الإعلان (AR)',
      'set.save': 'حفظ', 'set.saved': 'تم الحفظ ✓', 'set.nothing': 'لا شيء للحفظ.',
      'set.heroCard': 'صور الواجهة', 'set.heroHelp': 'عدة صور = عرض متبدل. الأولى هي الأساسية.',
      'set.saveHero': 'حفظ الواجهة', 'set.heroSaved1': 'تم حفظ الصورة ✓', 'set.heroSavedN': 'تم حفظ العرض ✓',
      'set.bannerCard': 'لافتة ترويجية', 'set.bannerHelp': 'الصور المعروضة في قسم الترويج بالرئيسية.',
      'set.saveBanner': 'حفظ البانر', 'set.bannerSavedN': 'تم حفظ البانر ✓',
      'set.autoplay': 'تبديل تلقائي', 'set.logoCard': 'الشعار', 'set.logoHelp': 'يظهر في الترويسة والتذييل.',
      'set.uploadLogo': 'تغيير الشعار', 'set.imgUpdated': 'تم تحديث الصورة ✓', 'set.defaultApplied': 'لا صور — الافتراضي مطبق.',
      'nav.reviews': 'آراء العملاء', 'rev.empty': 'لا تقييمات بعد.', 'rev.err': 'غير متاح',
      'rev.del': 'حذف', 'rev.deleted': 'تم حذف التقييم',
      'toast.refreshed': 'تم التحديث ✓', 'toast.loadErr': 'خطأ في التحميل: ', 'prod.delFail': 'فشل الحذف'
    }
  };

  /* ── state ── */
  var lang = 'fr';
  try { lang = localStorage.getItem('language') || 'fr'; } catch (e) {}
  if (!I[lang]) lang = 'fr';
  function t(k) { return (I[lang] && I[lang][k]) || I.fr[k] || k; }

  var user = null;            // {access_token, refresh_token, email}
  var orders = [], products = [], settings = {};
  var orderFilter = 'all', searchTerm = '', oSearchTerm = '';
  var editingId = null, editAud = 'homme', addAud = 'homme';
  var aG = { urls: [], files: [] }, eG = { urls: [], files: [] };
  var heroSt = { list: [], files: [] }, banSt = { list: [], files: [] };
  var channel = null, pollTimer = null, refreshInFlight = null;

  function $(id) { return document.getElementById(id); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtDT(n) { var v = Number(n) || 0; return v.toFixed(3).replace(/\.?0+$/, '') + ' DT'; }
  function locale() { return lang === 'ar' ? 'ar-TN' : (lang === 'en' ? 'en-GB' : 'fr-TN'); }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }
  function mediaUrl(u) {
    if (!u) return '';
    if (/^(https?:|data:|blob:)/i.test(u)) return u;
    return location.origin + '/' + String(u).replace(/^\/+/, '');
  }
  function firstImage(p) {
    if (Array.isArray(p.images) && p.images.length) return p.images[0];
    return p.image_url || '';
  }
  function audLabel(a) { return (AUDS[a] && AUDS[a][lang]) || a || ''; }
  function audIcon(a) { return (AUDS[a] && AUDS[a].icon) || 'fa-genderless'; }

  function toast(msg) {
    var el = $('adminToast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  function showMsg(id, text, ok) {
    var el = $(id); if (!el) return;
    el.textContent = text || '';
    el.style.display = text ? 'block' : 'none';
    el.className = 'set-msg ' + (ok ? 'ok' : 'err');
    el.style.display = text ? 'block' : 'none';
  }

  /* ── auth ── */
  function getToken() { return user ? user.access_token : null; }

  async function api(method, path, body, prefer) {
    var headers = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/json' };
    if (prefer) headers.Prefer = prefer;
    var res = await fetch(SUPABASE_URL + path, { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body) });
    if (res.status === 401) {
      if (await refreshSession()) {
        headers.Authorization = 'Bearer ' + getToken();
        res = await fetch(SUPABASE_URL + path, { method: method, headers: headers, body: body === undefined ? undefined : JSON.stringify(body) });
      }
    }
    return res;
  }

  async function refreshSession() {
    if (!user || !user.refresh_token) return false;
    if (refreshInFlight) return refreshInFlight;
    refreshInFlight = (async function () {
      try {
        var r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
          method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: user.refresh_token })
        });
        if (!r.ok) return false;
        var j = await r.json();
        if (!j.access_token || !j.refresh_token) return false;
        user = { access_token: j.access_token, refresh_token: j.refresh_token, email: (j.user && j.user.email) || user.email };
        try { localStorage.setItem('sm_admin_session', JSON.stringify(user)); } catch (e) {}
        return true;
      } catch (e) { return false; }
      finally { refreshInFlight = null; }
    })();
    return refreshInFlight;
  }

  async function importStorefrontSession() {
    try {
      var raw = localStorage.getItem('sm_user2');
      if (!raw) return false;
      var cached = JSON.parse(raw);
      if (!cached || !cached.refresh) return false;
      if (ADMIN_EMAILS.indexOf(String(cached.email || '').toLowerCase()) === -1) return false;
      user = { access_token: null, refresh_token: cached.refresh, email: cached.email };
      var ok = await refreshSession();
      if (!ok) { user = null; return false; }
      try { cached.refresh = user.refresh_token; localStorage.setItem('sm_user2', JSON.stringify(cached)); } catch (e) {}
      return true;
    } catch (e) { user = null; return false; }
  }

  async function restoreSession() {
    try {
      var raw = localStorage.getItem('sm_admin_session');
      if (!raw) return false;
      user = JSON.parse(raw);
      if (!user || !user.access_token) return false;
      if (ADMIN_EMAILS.indexOf(String(user.email || '').toLowerCase()) === -1) { user = null; return false; }
      var res = await fetch(SUPABASE_URL + '/rest/v1/orders?select=id&limit=1', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + user.access_token } });
      if (res.status === 401) {
        if (!(await refreshSession())) {
          try { localStorage.removeItem('sm_admin_session'); } catch (e) {}
          user = null; return false;
        }
      }
      return !!getToken();
    } catch (e) { return false; }
  }

  /* ── data ── */
  async function loadAll() {
    var r1 = await api('GET', '/rest/v1/orders?select=*&order=created_at.desc&limit=300');
    if (r1.ok) orders = await r1.json();
    var r2 = await api('GET', '/rest/v1/products?select=*&order=created_at.desc');
    if (r2.ok) products = await r2.json();
    var r3 = await api('GET', '/rest/v1/site_settings?select=key,value');
    if (r3.ok) { settings = {}; (await r3.json()).forEach(function (r) { settings[r.key] = r.value; }); }
    renderAll();
  }

  /* ── i18n apply ── */
  function applyLang() {
    try { localStorage.setItem('language', lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $all('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $all('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $all('.lang-option').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-lang') === lang); });
    renderAll();
  }

  function renderAll() {
    renderOverview(); renderCollections(); renderOrders(); renderSettingsTab();
    if (currentTab() === 'edit') renderEditForm();
  }

  /* ── router (Rosa-style) ── */
  function currentTab() {
    var h = (location.hash || '').replace('#', '');
    return TABS.indexOf(h) !== -1 ? h : (sessionStorage.getItem('ste_adm_tab') || 'overview');
  }
  function showTab(name) {
    if (TABS.indexOf(name) === -1) name = 'overview';
    try { sessionStorage.setItem('ste_adm_tab', name); } catch (e) {}
    $all('.dash-section').forEach(function (s) { s.hidden = s.id !== 'dash-' + name; });
    $all('.dash-tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-dashtab') === name); });
    if (name === 'edit') renderEditForm();
    window.scrollTo(0, 0);
  }
  function goto_(name) { if ((location.hash || '') === '#' + name) showTab(name); else location.hash = '#' + name; }

  /* ── OVERVIEW ── */
  function renderOverview() {
    var now = new Date(), todayKey = now.toDateString();
    var today = orders.filter(function (o) { return new Date(o.created_at).toDateString() === todayKey; });
    var ca = today.reduce(function (n, o) { return o.status !== 'annulee' ? n + Number(o.total || 0) : n; }, 0);
    var pending = orders.filter(function (o) { return o.status === 'nouvelle' || o.status === 'confirmee'; }).length;
    var low = products.filter(function (p) { return p.active !== false && Number(p.stock) <= 5; });
    $('ovToday').textContent = today.length;
    $('ovCA').textContent = fmtDT(ca);
    $('ovPending').textContent = pending;
    $('ovLow').textContent = low.length;
    Object.keys(AUDS).forEach(function (a) {
      var el = $('ovc-' + a); if (el) el.textContent = products.filter(function (p) { return (p.audience || 'unisexe') === a; }).length;
    });
    var recent = orders.slice(0, 5);
    $('dashRecent').innerHTML = recent.length ? recent.map(function (o) {
      return '<button class="mini-row" data-open-order="' + esc(o.id) + '"><span class="mr-name">' + esc(o.customer_name || '—') + '</span><span>' + fmtDT(o.total) + ' · ' + fmtDate(o.created_at) + '</span><span class="mini-chip">' + esc(t('st.' + o.status)) + '</span></button>';
    }).join('') : '<p class="rev-empty">' + t('dash.emptyRecent') + '</p>';
    $('dashLow').innerHTML = low.length ? low.map(function (p) {
      return '<button class="mini-row" data-open-product="' + esc(p.id) + '"><span class="mr-name">' + esc(p.name_fr || p.sku || '—') + '</span><span>' + esc(audLabel(p.audience)) + '</span><span class="mini-chip st-warn">stock ' + esc(p.stock) + '</span></button>';
    }).join('') : '<p class="rev-empty">' + t('dash.emptyLow') + '</p>';
    var em = $('sessionEmailChip'); if (em && user) em.textContent = '· ' + user.email;
    var ov = $('loggedInAsOv'); if (ov && user) ov.textContent = user.email;
  }

  /* ── COLLECTIONS ── */
  var catAud = 'all';
  try { catAud = sessionStorage.getItem('ste_adm_cat') || 'all'; } catch (e) {}
  if (catAud !== 'all' && !AUDS[catAud]) catAud = 'all';

  function setCat(aud) {
    catAud = aud;
    try { sessionStorage.setItem('ste_adm_cat', aud); } catch (e) {}
    renderCollections();
  }
  function renderCollections() {
    var seg = $('catSeg');
    if (seg) $all('button', seg).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-aud') === catAud); });
    $('catIcon').className = 'fas ' + (catAud === 'all' ? 'fa-layer-group' : audIcon(catAud));
    $('catTitle').textContent = catAud === 'all' ? t('catTitle.all') : audLabel(catAud);
    var list = products.filter(function (p) { return catAud === 'all' || (p.audience || 'unisexe') === catAud; });
    if (searchTerm) {
      var q = searchTerm.toLowerCase();
      list = list.filter(function (p) { return [p.name_fr, p.name_en, p.name_ar, p.sku].some(function (v) { return String(v || '').toLowerCase().indexOf(q) !== -1; }); });
    }
    $('productCount').textContent = list.length;
    var box = $('productsTableContent');
    if (!list.length) {
      box.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>' + esc(t('prod.search')) + ' — 0</p></div>';
      return;
    }
    var html = '<table class="products-table"><thead><tr><th>📷</th><th>' + t('prod.name') + '</th><th>' + t('pf.aud') +
      '</th><th>' + t('prod.price') + '</th><th>' + t('prod.stock') + '</th><th>' + t('prod.actions') + '</th></tr></thead><tbody>';
    list.forEach(function (p) {
      var img = firstImage(p);
      var imgHtml = img
        ? '<img src="' + esc(mediaUrl(img)) + '" class="product-image" loading="lazy" decoding="async">'
        : '<div class="product-image-placeholder"><i class="fas fa-globe"></i></div>';
      var st = Number(p.stock);
      var badge = st <= 0 ? '<span class="status-badge status-out">' + t('outOfStock') + '</span>'
        : st <= 5 ? '<span class="status-badge status-low">' + t('lowStock') + ' · ' + st + '</span>'
        : '<span class="status-badge status-available">' + t('inStock') + '</span>';
      var flags = '';
      if (p.featured) flags += '<span class="p-flag feat">★</span>';
      if (p.active === false) flags += '<span class="p-flag off">' + t('off') + '</span>';
      var priceHtml = (p.old_price != null && Number(p.old_price) > Number(p.price)) ? '<span class="old-p">' + fmtDT(p.old_price) + '</span>' : '';
      priceHtml += fmtDT(p.price);
      html += '<tr data-product-id="' + esc(p.id) + '"><td>' + imgHtml + '</td>' +
        '<td><strong>' + esc(p.name_fr || p.sku || '—') + '</strong>' + flags + '<div style="font-size:.62rem;opacity:.65;">' + esc(p.sku || '') + '</div></td>' +
        '<td>' + esc(audLabel(p.audience)) + '</td>' +
        '<td>' + priceHtml + '</td>' +
        '<td>' + badge + '</td>' +
        '<td><div class="action-buttons">' +
        '<button class="edit-btn" data-edit="' + esc(p.id) + '"><i class="fas fa-edit"></i> ' + t('edit') + '</button>' +
        '<button class="delete-btn" data-del="' + esc(p.id) + '"><i class="fas fa-trash-alt"></i> ' + t('del') + '</button>' +
        '</div></td></tr>';
    });
    html += '</tbody></table>';
    box.innerHTML = html;
  }

  /* ── product form driver (shared by add + edit) ── */
  function formState(pref) { return pref === 'a' ? aG : eG; }
  function fillForm(pref, p) {
    var g = formState(pref);
    g.urls = p && Array.isArray(p.images) && p.images.length ? p.images.slice() : (p && p.image_url ? [p.image_url] : []);
    g.files = [];
    $(pref + 'NameFr').value = p ? (p.name_fr || '') : '';
    $(pref + 'NameEn').value = p ? (p.name_en || '') : '';
    $(pref + 'NameAr').value = p ? (p.name_ar || '') : '';
    $(pref + 'DescFr').value = p ? (p.desc_fr || '') : '';
    $(pref + 'DescEn').value = p ? (p.desc_en || '') : '';
    $(pref + 'DescAr').value = p ? (p.desc_ar || '') : '';
    $(pref + 'Sku').value = p ? (p.sku || '') : '';
    $(pref + 'Price').value = p ? p.price : '';
    $(pref + 'OldPrice').value = (p && p.old_price != null) ? p.old_price : '';
    $(pref + 'Stock').value = p ? (p.stock != null ? p.stock : 10) : 10;
    $(pref + 'Featured').checked = !!(p && p.featured);
    $(pref + 'Active').checked = p ? p.active !== false : true;
    var aud = p && p.audience ? p.audience : (pref === 'a' ? addAud : editAud);
    if (pref === 'a') { addAud = aud; } else { editAud = aud; }
    $all('#' + pref + 'AudSeg button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-aud') === aud); });
    renderGallery(pref);
  }
  function currentAud(pref) { return pref === 'a' ? addAud : editAud; }
  function renderGallery(pref) {
    var g = formState(pref);
    var box = $(pref === 'a' ? 'aGallery' : 'eGallery');
    if (!box) return;
    var html = g.urls.map(function (u, i) {
      return '<div class="g-thumb' + (i === 0 ? ' is-primary' : '') + '"><img src="' + esc(mediaUrl(u)) + '" alt="" onerror="this.style.opacity=.25">' +
        (i === 0 ? '<span class="g-tag">1</span>' : '') +
        '<button type="button" class="g-del" data-gdel="' + i + '">✕</button></div>';
    }).join('');
    html += g.files.map(function (f, i) {
      return '<div class="g-thumb g-thumb--new"><img src="' + esc(URL.createObjectURL(f)) + '" alt=""><button type="button" class="g-del" data-gdelfile="' + i + '">✕</button></div>';
    }).join('');
    box.innerHTML = html;
  }
  function uploadToBucket(file, pathPrefix) {
    return new Promise(function (resolve, reject) {
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      var name = pathPrefix + '/' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7) + '.' + ext;
      fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + name, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + getToken(), 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true' },
        body: file
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (x) { throw new Error('upload HTTP ' + r.status + ' ' + x.slice(0, 120)); });
        return r.json();
      }).then(function () {
        resolve(SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + name);
      }).catch(reject);
    });
  }
  function collectPayload(pref) {
    var g = formState(pref);
    var urlBox = $(pref === 'a' ? 'aImageUrl' : 'eImageUrl');
    var urls = g.urls.slice();
    if (urlBox && urlBox.value.trim()) { var v = urlBox.value.trim(); if (urls.indexOf(v) === -1) urls.push(v); }
    return {
      name_fr: $(pref + 'NameFr').value.trim(),
      name_en: $(pref + 'NameEn').value.trim() || $(pref + 'NameFr').value.trim(),
      name_ar: $(pref + 'NameAr').value.trim() || $(pref + 'NameFr').value.trim(),
      desc_fr: $(pref + 'DescFr').value.trim() || null,
      desc_en: $(pref + 'DescEn').value.trim() || null,
      desc_ar: $(pref + 'DescAr').value.trim() || null,
      audience: currentAud(pref),
      sku: $(pref + 'Sku').value.trim() || null,
      price: Number($(pref + 'Price').value),
      old_price: $(pref + 'OldPrice').value === '' ? null : Number($(pref + 'OldPrice').value),
      stock: $(pref + 'Stock').value === '' ? 0 : Math.max(0, parseInt($(pref + 'Stock').value, 10)),
      featured: $(pref + 'Featured').checked,
      active: $(pref + 'Active').checked,
      image_url: urls[0] || null,
      images: urls
    };
  }
  async function submitForm(pref) {
    var msgId = pref + 'Msg', btn = $(pref === 'a' ? 'aSubmit' : 'eSubmit');
    var payload = collectPayload(pref);
    if (!payload.name_fr) { showMsg(msgId, t('pf.errName')); return; }
    if (!(payload.price > 0)) { showMsg(msgId, t('pf.errPrice')); return; }
    btn.disabled = true;
    try {
      var g = formState(pref);
      for (var i = 0; i < g.files.length; i++) {
        showMsg(msgId, t('pf.uploading') + ' ' + (i + 1) + '/' + g.files.length + '...');
        var url = await uploadToBucket(g.files[i], 'products');
        payload.images.push(url);
      }
      if (payload.images.length) payload.image_url = payload.images[0];
      var res;
      if (pref === 'e' && editingId) {
        res = await api('PATCH', '/rest/v1/products?id=eq.' + editingId, payload, 'return=minimal');
      } else {
        res = await api('POST', '/rest/v1/products', payload, 'return=representation');
      }
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 140));
      await loadAll();
      if (pref === 'a') { fillForm('a', null); goto_('collections'); }
      else { editingId = null; try { sessionStorage.removeItem('ste_edit_id'); } catch (e) {} goto_('collections'); }
      toast(t(pref === 'a' ? 'prod.created' : 'prod.updated'));
      showMsg(msgId, '');
    } catch (e) { showMsg(msgId, t('pf.errPrefix') + e.message); }
    finally { btn.disabled = false; }
  }

  /* ── EDIT ── */
  function openEdit(id) {
    editingId = id;
    try { sessionStorage.setItem('ste_edit_id', id); } catch (e) {}
    goto_('edit');
    renderEditForm();
  }
  function renderEditForm() {
    if (!editingId) { try { editingId = sessionStorage.getItem('ste_edit_id'); } catch (e) {} }
    var p = products.filter(function (x) { return x.id === editingId; })[0];
    if (!p) { $('editFormContainer').style.display = 'none'; $('editHint').style.display = 'block'; $('editChip').textContent = ''; return; }
    $('editHint').style.display = 'none';
    $('editFormContainer').style.display = 'block';
    $('editChip').textContent = (p.sku || p.name_fr || '').slice(0, 24);
    fillForm('e', p);
  }

  /* ── ORDERS (Rosa card style) ── */
  var S_ICON = { nouvelle: 'fa-clock', confirmee: 'fa-circle-check', expediee: 'fa-truck-fast', livree: 'fa-check-circle', annulee: 'fa-times-circle' };
  function renderOrders() {
    ['all'].concat(STATUSES).forEach(function (s) {
      var el = $('c-' + s);
      if (el) el.textContent = s === 'all' ? orders.length : orders.filter(function (o) { return o.status === s; }).length;
    });
    $all('.s-tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-st') === orderFilter); });
    $('badgeCount').textContent = orders.length;
    var rev = orders.filter(function (o) { return o.status === 'expediee' || o.status === 'livree'; }).reduce(function (n, o) { return n + (parseFloat(o.total) || 0); }, 0);
    $('sRevenue').textContent = fmtDT(rev);
    $('sTotal').textContent = orders.length;
    $('sPending').textContent = orders.filter(function (o) { return o.status === 'nouvelle'; }).length;
    $('sShipped').textContent = orders.filter(function (o) { return o.status === 'expediee'; }).length;
    $('sDelivered').textContent = orders.filter(function (o) { return o.status === 'livree'; }).length;
    $('sCancelled').textContent = orders.filter(function (o) { return o.status === 'annulee'; }).length;

    var list = orders;
    if (orderFilter !== 'all') list = list.filter(function (o) { return o.status === orderFilter; });
    if (oSearchTerm) {
      var q = oSearchTerm.toLowerCase();
      list = list.filter(function (o) { return [o.id, o.customer_name, o.customer_phone, o.city, o.customer_email].some(function (v) { return String(v || '').toLowerCase().indexOf(q) !== -1; }); });
    }
    $('ordersOut').innerHTML = list.length ? list.map(orderCard).join('')
      : '<div class="empty-state"><i class="fas fa-inbox"></i><p>' + t('ord.emptyT') + '</p></div>';
  }
  function orderCard(o) {
    var items = (Array.isArray(o.items) ? o.items : []).map(function (i) {
      return '<div class="item-row"><span class="item-n"><i class="fas fa-crown" style="color:var(--gold);font-size:.6rem;"></i>' +
        esc(i.name || '—') + ' <span class="item-q">×' + esc(i.qty || 1) + '</span></span><span class="item-p">' + fmtDT(Number(i.price || 0) * Number(i.qty || 1)) + '</span></div>';
    }).join('');
    var wa = String(o.customer_phone || '').replace(/[^0-9]/g, '');
    if (wa.length === 8) wa = '216' + wa;
    var opts = STATUSES.map(function (s) { return '<option value="' + s + '"' + (o.status === s ? ' selected' : '') + '>' + t('st.' + s) + '</option>'; }).join('');
    return '<div class="order-card">' +
      '<div class="oc-header"><div>' +
      '<div class="oc-id" data-copy="' + esc(o.id) + '"><i class="fas fa-receipt" style="color:var(--gold);font-size:.7rem;"></i> #' + esc(String(o.id).slice(0, 8).toUpperCase()) + '…<i class="fas fa-copy ci"></i></div>' +
      '<div class="oc-date"><i class="fas fa-calendar-alt"></i> ' + fmtDate(o.created_at) + '</div>' +
      '</div><span class="sbadge st-' + esc(o.status) + '"><i class="fas ' + (S_ICON[o.status] || 'fa-circle') + '"></i> ' + esc(t('st.' + o.status)) + '</span></div>' +
      '<div class="oc-customer">' +
      '<div class="cf"><span class="cl"><i class="fas fa-user"></i> ' + t('ord.client') + '</span><span class="cv">' + esc(o.customer_name || '—') + '</span></div>' +
      '<div class="cf"><span class="cl"><i class="fas fa-phone"></i> ' + t('ord.phone') + '</span><span class="cv"><a href="tel:' + esc(o.customer_phone || '') + '">' + esc(o.customer_phone || '—') + '</a> <a class="wa" target="_blank" rel="noopener" href="https://wa.me/' + esc(wa) + '"><i class="fab fa-whatsapp"></i></a></span></div>' +
      '</div>' +
      ((o.address || o.city) ? '<div class="oc-address"><i class="fas fa-map-marker-alt"></i><span>' + esc([o.address, o.city].filter(Boolean).join(' · ') || '—') + '</span></div>' : '') +
      '<div class="oc-items">' + (items || '<div class="item-row" style="opacity:.6;">—</div>') + '</div>' +
      '<div class="oc-footer"><div class="oc-total">' + t('ord.total') + ' : <span>' + fmtDT(o.total) + '</span></div>' +
      '<select class="status-sel" data-status-for="' + esc(o.id) + '">' + opts + '</select></div>' +
      '<div style="padding:.4rem .85rem .75rem;"><button class="rev-del" data-delorder="' + esc(o.id) + '"><i class="fas fa-trash-alt"></i> ' + t('ord.del') + '</button></div>' +
      '</div>';
  }

  /* ── SETTINGS ── */
  var SETTING_KEYS = ['shop_name', 'whatsapp', 'delivery_fee', 'announcement_fr', 'announcement_en', 'announcement_ar'];
  function renderSettingsTab() {
    SETTING_KEYS.forEach(function (k) {
      var el = document.querySelector('[data-setting="' + k + '"]');
      if (!el) return;
      if (document.activeElement === el) return;   // keep unsaved edits
      var v = settings[k];
      el.value = v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v);
    });
    heroSt.list = Array.isArray(settings.hero_images) ? settings.hero_images.filter(Boolean) : (settings.hero_image ? [settings.hero_image] : []);
    banSt.list = Array.isArray(settings.banner_images) ? settings.banner_images.filter(Boolean) : (settings.banner_image ? [settings.banner_image] : []);
    $('heroAutoplay').checked = settings.hero_autoplay !== false;
    $('bannerAutoplay').checked = settings.banner_autoplay !== false;
    renderMediaStrip('heroStrip', heroSt, function (i) { heroSt.list.splice(i, 1); renderMediaStrip('heroStrip', heroSt); });
    renderMediaStrip('bannerStrip', banSt, function (i) { banSt.list.splice(i, 1); renderMediaStrip('bannerStrip', banSt); });
    var hc = $('heroCountBadge'); if (hc) hc.textContent = heroSt.list.length + '+ / 6';
    var bc = $('bannerCountBadge'); if (bc) bc.textContent = banSt.list.length + '+ / 6';
    var ls = $('logoStrip');
    if (ls) ls.innerHTML = settings.logo_image ? '<div class="g-thumb"><img src="' + esc(mediaUrl(settings.logo_image)) + '" alt="" style="object-fit:contain;background:#fff;"></div>' : '<p class="rev-empty">—</p>';
    loadReviews();
  }
  function renderMediaStrip(boxId, st, delFn) {
    var box = $(boxId); if (!box) return;
    var html = st.list.map(function (u, i) {
      return '<div class="g-thumb"><img src="' + esc(mediaUrl(u)) + '" alt="" loading="lazy"><button type="button" class="g-del" data-mdel="' + boxId + ':' + i + '">✕</button></div>';
    }).join('');
    html += (st.files || []).map(function (f, i) {
      return '<div class="g-thumb g-thumb--new"><img src="' + esc(URL.createObjectURL(f)) + '" alt=""><button type="button" class="g-del" data-mfile="' + boxId + ':' + i + '">✕</button></div>';
    }).join('');
    box.innerHTML = html;
  }
  async function saveSettingsTab() {
    var rows = [];
    SETTING_KEYS.forEach(function (k) {
      var el = document.querySelector('[data-setting="' + k + '"]');
      if (!el) return;
      var raw = el.value.trim();
      if (k === 'delivery_fee') { if (raw === '') return; rows.push({ key: k, value: Number(raw) }); }
      else rows.push({ key: k, value: raw });
    });
    if (!rows.length) { showMsg('settingsMsg', t('set.nothing')); return; }
    var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', rows, 'resolution=merge-duplicates,return=minimal');
    if (res.ok) { renderSettingsTab(); showMsg('settingsMsg', t('set.saved'), true); toast(t('set.saved')); }
    else showMsg('settingsMsg', t('pf.errPrefix') + 'HTTP ' + res.status);
  }
  async function saveMedia(kind) {
    var st = kind === 'hero' ? heroSt : banSt;
    var msgId = kind === 'hero' ? 'heroMsg' : 'bannerMsg';
    var btn = kind === 'hero' ? $('btnSaveHero') : $('btnSaveBanner');
    if (btn) btn.disabled = true;
    try {
      var list = st.list.slice();
      for (var i = 0; i < st.files.length; i++) {
        showMsg(msgId, t('pf.uploading') + ' ' + (i + 1) + '/' + st.files.length + '...');
        list.push(await uploadToBucket(st.files[i], 'site'));
      }
      var key = kind === 'hero' ? 'hero_images' : 'banner_images';
      var apKey = kind === 'hero' ? 'hero_autoplay' : 'banner_autoplay';
      var ap = kind === 'hero' ? $('heroAutoplay') : $('bannerAutoplay');
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', [
        { key: key, value: list },
        { key: apKey, value: !!ap.checked }
      ], 'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      st.list = list; st.files = [];
      renderSettingsTab();
      showMsg(msgId, list.length > 1 ? t(kind === 'hero' ? 'set.heroSavedN' : 'set.bannerSavedN') : t(kind === 'hero' ? 'set.heroSaved1' : 'set.imgUpdated'), true);
    } catch (e) { showMsg(msgId, t('pf.errPrefix') + e.message); }
    finally { if (btn) btn.disabled = false; }
  }
  async function uploadLogo(file) {
    try {
      var url = await uploadToBucket(file, 'site');
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', [{ key: 'logo_image', value: url }], 'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      settings.logo_image = url;
      renderSettingsTab();
      showMsg('logoMsg', t('set.imgUpdated'), true);
    } catch (e) { showMsg('logoMsg', t('pf.errPrefix') + e.message); }
  }

  /* ── REVIEWS ── */
  function loadReviews() {
    var box = $('revBox');
    if (!box) return;
    api('GET', '/rest/v1/reviews?select=id,product_id,user_name,rating,comment,created_at&order=created_at.desc&limit=30')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('')); })
      .then(function (rows) {
        if (!rows.length) { box.innerHTML = '<p class="rev-empty">' + t('rev.empty') + '</p>'; return; }
        box.innerHTML = rows.map(function (rv) {
          var p = products.filter(function (x) { return x.id === rv.product_id; })[0];
          return '<div class="rev-item"><div class="rev-top"><span class="rev-name">' + esc(rv.user_name || 'Client') + '</span>' +
            '<span class="rev-stars">' + '★'.repeat(Number(rv.rating) || 0) + '☆'.repeat(5 - (Number(rv.rating) || 0)) + '</span>' +
            '<span class="rev-date">' + fmtDate(rv.created_at) + '</span>' +
            '<button class="rev-del" data-delrev="' + esc(rv.id) + '">' + t('rev.del') + '</button></div>' +
            (p ? '<p class="rev-prod">' + esc(p.name_fr || '') + '</p>' : '') +
            (rv.comment ? '<p class="rev-comment">' + esc(rv.comment) + '</p>' : '') + '</div>';
        }).join('');
      })
      .catch(function () { box.innerHTML = '<p class="rev-empty">' + t('rev.err') + '</p>'; });
  }

  /* ── realtime / polling (orders) ── */
  function startRealtime() {
    try {
      var sb = window.supabase && window.supabase.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
      if (!sb) throw new Error();
      channel = sb.channel('orders-admin-live')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, function () {
          api('GET', '/rest/v1/orders?select=*&order=created_at.desc&limit=300').then(function (r) {
            return r.ok ? r.json() : orders;
          }).then(function (rows) { orders = rows; renderOverview(); renderOrders(); }).catch(function () {});
        })
        .subscribe(function (s) {
          if (s !== 'SUBSCRIBED') startPolling();
        });
      setTimeout(function () { if (!channel || !channel.state || channel.state !== 'joined') startPolling(); }, 6000);
    } catch (e) { startPolling(); }
  }
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function () {
      if (!user) return;
      api('GET', '/rest/v1/orders?select=*&order=created_at.desc&limit=300').then(function (r) {
        return r.ok ? r.json() : orders;
      }).then(function (rows) { orders = rows; renderOverview(); renderOrders(); }).catch(function () {});
    }, POLL_MS);
  }

  /* ── login / logout ── */
  function enterApp() {
    document.body.classList.add('authed');
    $('ste-login').style.display = 'none';
    loadAll().then(startRealtime).catch(function (e) { toast(t('toast.loadErr') + e.message); });
    showTab(currentTab());
  }
  async function doLogout() {
    try {
      if (user && user.access_token) {
        await fetch(SUPABASE_URL + '/auth/v1/logout', { method: 'POST', headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + user.access_token } });
      }
    } catch (e) {}
    user = null;
    try { localStorage.removeItem('sm_admin_session'); } catch (e) {}
    location.hash = '#overview';
    document.body.classList.remove('authed');
    $('ste-login').style.display = 'grid';
  }

  /* ── bind ── */
  function bind() {
    /* hash router */
    window.addEventListener('hashchange', function () { showTab(currentTab()); });
    $all('.dash-tab').forEach(function (b) {
      b.addEventListener('click', function () { goto_(b.getAttribute('data-dashtab')); });
    });
    /* lang + theme */
    $all('.lang-option').forEach(function (b) {
      b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); applyLang(); });
    });
    var tt = $('themeToggle');
    function paintTheme() {
      document.body.classList.toggle('dark', localStorage.getItem('theme') === 'dark');
      var sun = tt.querySelector('.fa-sun'), moon = tt.querySelector('.fa-moon');
      var dark = document.body.classList.contains('dark');
      if (sun) sun.style.display = dark ? 'none' : 'inline-block';
      if (moon) moon.style.display = dark ? 'inline-block' : 'none';
    }
    if (tt) tt.addEventListener('click', function () {
      try { localStorage.setItem('theme', document.body.classList.contains('dark') ? 'light' : 'dark'); } catch (e) {}
      paintTheme();
    });
    paintTheme();

    /* login */
    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('login-email').value.trim(), pw = $('login-password').value;
      if (!email || !pw) { showMsg('login-msg', t('login.errFields')); return; }
      var btn = $('login-btn'); btn.disabled = true;
      fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pw })
      }).then(function (r) {
        if (!r.ok) throw new Error(t('login.errBad'));
        return r.json();
      }).then(function (j) {
        if (ADMIN_EMAILS.indexOf(String(j.user && j.user.email || email).toLowerCase()) === -1) throw new Error(t('login.errBad'));
        user = { access_token: j.access_token, refresh_token: j.refresh_token, email: (j.user && j.user.email) || email };
        try { localStorage.setItem('sm_admin_session', JSON.stringify(user)); } catch (err) {}
        enterApp();
      }).catch(function (err) { showMsg('login-msg', err.message || t('login.errBad')); })
        .finally(function () { btn.disabled = false; });
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('#btnLogoutSettings')) { e.preventDefault(); doLogout(); }
    });

    /* overview: refresh + audience cards */
    $('ovRefresh').addEventListener('click', function () { loadAll().then(function () { toast(t('toast.refreshed')); }); });
    $all('.aud-card').forEach(function (c) {
      c.addEventListener('click', function () { setCat(c.getAttribute('data-aud')); });
    });

    /* collections: segment + search + row buttons */
    $all('#catSeg button').forEach(function (b) {
      b.addEventListener('click', function () { setCat(b.getAttribute('data-aud')); });
    });
    $('searchInput').addEventListener('input', function () { searchTerm = this.value.trim(); renderCollections(); });
    document.addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]');
      if (ed) { openEdit(ed.getAttribute('data-edit')); return; }
      var dl = e.target.closest('[data-del]');
      if (dl) {
        var p = products.filter(function (x) { return x.id === dl.getAttribute('data-del'); })[0];
        if (p && confirm(t('cf.delProduct') + (p.name_fr || p.sku) + t('cf.delProductSuffix'))) {
          api('DELETE', '/rest/v1/products?id=eq.' + p.id, undefined, 'return=minimal').then(function (r) {
            if (r.ok) return loadAll().then(function () { toast(t('prod.deleted')); });
            throw new Error();
          }).catch(function () { toast(t('ord.delFail')); });
        }
        return;
      }
      /* gallery thumbs (product forms) */
      var gd = e.target.closest('[data-gdel]');
      if (gd) {
        var pfx = gd.closest('#aGallery') ? 'a' : 'e';
        formState(pfx).urls.splice(Number(gd.getAttribute('data-gdel')), 1);
        renderGallery(pfx); return;
      }
      var gdf = e.target.closest('[data-gdelfile]');
      if (gdf) {
        var pfx2 = gdf.closest('#aGallery') ? 'a' : 'e';
        formState(pfx2).files.splice(Number(gdf.getAttribute('data-gdelfile')), 1);
        renderGallery(pfx2); return;
      }
      /* settings strips */
      var md = e.target.closest('[data-mdel]');
      if (md) {
        var parts = md.getAttribute('data-mdel').split(':');
        var st = parts[0] === 'heroStrip' ? heroSt : banSt;
        st.list.splice(Number(parts[1]), 1);
        renderMediaStrip(parts[0], st); return;
      }
      var mf = e.target.closest('[data-mfile]');
      if (mf) {
        var parts2 = mf.getAttribute('data-mfile').split(':');
        var st2 = parts2[0] === 'heroStrip' ? heroSt : banSt;
        st2.files.splice(Number(parts2[1]), 1);
        renderMediaStrip(parts2[0], st2); return;
      }
      /* orders interactions */
      var copy = e.target.closest('[data-copy]');
      if (copy) {
        var cid = copy.getAttribute('data-copy');
        if (navigator.clipboard) navigator.clipboard.writeText(cid).then(function () { toast(cid.slice(0, 8).toUpperCase()); });
        return;
      }
      var dord = e.target.closest('[data-delorder]');
      if (dord) {
        if (confirm(t('cf.delOrder'))) {
          api('DELETE', '/rest/v1/orders?id=eq.' + dord.getAttribute('data-delorder'), undefined, 'return=minimal').then(function (r) {
            if (!r.ok) throw new Error();
            orders = orders.filter(function (x) { return x.id !== dord.getAttribute('data-delorder'); });
            renderOverview(); renderOrders(); toast(t('ord.deleted'));
          }).catch(function () { toast(t('ord.delFail')); });
        }
        return;
      }
      var dr = e.target.closest('[data-delrev]');
      if (dr) {
        if (confirm(t('cf.delReview'))) {
          api('DELETE', '/rest/v1/reviews?id=eq.' + dr.getAttribute('data-delrev'), undefined, 'return=minimal').then(function (r) {
            if (r.ok) { toast(t('rev.deleted')); loadReviews(); }
          });
        }
        return;
      }
      var openP = e.target.closest('[data-open-product]');
      if (openP) { openEdit(openP.getAttribute('data-open-product')); return; }
    });
    document.addEventListener('change', function (e) {
      var sel = e.target.closest('.status-sel');
      if (sel) {
        var oid = sel.getAttribute('data-status-for'), ns = sel.value;
        api('PATCH', '/rest/v1/orders?id=eq.' + oid, { status: ns }, 'return=minimal').then(function (r) {
          if (!r.ok) throw new Error();
          var o = orders.filter(function (x) { return x.id === oid; })[0];
          if (o) o.status = ns;
          renderOrders(); renderOverview(); toast(t('ord.statusOk') + t('st.' + ns));
        }).catch(function () { toast(t('ord.statusFail')); renderOrders(); });
      }
    });
    $('oSearchInput').addEventListener('input', function () { oSearchTerm = this.value.trim(); renderOrders(); });
    $all('.s-tab').forEach(function (b) { b.addEventListener('click', function () { orderFilter = b.getAttribute('data-st'); renderOrders(); }); });
    $('ordersRefresh').addEventListener('click', function () { loadAll().then(function () { toast(t('toast.refreshed')); }); });

    /* add form */
    $all('#aAudSeg button').forEach(function (b) {
      b.addEventListener('click', function () { addAud = b.getAttribute('data-aud'); $all('#aAudSeg button').forEach(function (x) { x.classList.toggle('active', x === b); }); });
    });
    $('aFileInput').addEventListener('change', function () {
      var g = formState('a');
      Array.prototype.slice.call(this.files || []).forEach(function (f) { if (f.size <= 5 * 1024 * 1024) g.files.push(f); });
      renderGallery('a'); this.value = '';
    });
    $('aImageUrl').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var v = this.value.trim();
      if (!v) return;
      if (/^https?:\/\//i.test(v) && aG.urls.indexOf(v) === -1) { aG.urls.push(v); renderGallery('a'); this.value = ''; }
      else showMsg('aMsg', t('pf.imgBad'));
    });
    $('aSubmit').addEventListener('click', function () { submitForm('a'); });

    /* edit form */
    $all('#eAudSeg button').forEach(function (b) {
      b.addEventListener('click', function () { editAud = b.getAttribute('data-aud'); $all('#eAudSeg button').forEach(function (x) { x.classList.toggle('active', x === b); }); });
    });
    $('eFileInput').addEventListener('change', function () {
      var g = formState('e');
      Array.prototype.slice.call(this.files || []).forEach(function (f) { if (f.size <= 5 * 1024 * 1024) g.files.push(f); });
      renderGallery('e'); this.value = '';
    });
    $('eImageUrl').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var v = this.value.trim();
      if (!v) return;
      if (/^https?:\/\//i.test(v) && eG.urls.indexOf(v) === -1) { eG.urls.push(v); renderGallery('e'); this.value = ''; }
      else showMsg('eMsg', t('pf.imgBad'));
    });
    $('eSubmit').addEventListener('click', function () { submitForm('e'); });
    $('eDelete').addEventListener('click', function () {
      var p = products.filter(function (x) { return x.id === editingId; })[0];
      if (p && confirm(t('cf.delProduct') + (p.name_fr || p.sku) + t('cf.delProductSuffix'))) {
        api('DELETE', '/rest/v1/products?id=eq.' + p.id, undefined, 'return=minimal').then(function (r) {
          if (!r.ok) throw new Error();
          editingId = null; try { sessionStorage.removeItem('ste_edit_id'); } catch (e) {}
          return loadAll().then(function () { goto_('collections'); toast(t('prod.deleted')); });
        }).catch(function () { toast(t('prod.delFail')); });
      }
    });

    /* settings */
    $('btnSaveSettings').addEventListener('click', saveSettingsTab);
    $('btnSaveHero').addEventListener('click', function () { saveMedia('hero'); });
    $('btnSaveBanner').addEventListener('click', function () { saveMedia('banner'); });
    $('heroFileInput').addEventListener('change', function () {
      Array.prototype.slice.call(this.files || []).forEach(function (f) { if (f.size <= 5 * 1024 * 1024) heroSt.files.push(f); });
      renderMediaStrip('heroStrip', heroSt); this.value = '';
    });
    $('bannerFileInput').addEventListener('change', function () {
      Array.prototype.slice.call(this.files || []).forEach(function (f) { if (f.size <= 5 * 1024 * 1024) banSt.files.push(f); });
      renderMediaStrip('bannerStrip', banSt); this.value = '';
    });
    $('logoFileInput').addEventListener('change', function () {
      var f = this.files && this.files[0]; this.value = '';
      if (f) uploadLogo(f);
    });
  }

  /* ── boot ── */
  async function boot() {
    bind();
    applyLang();
    fillForm('a', null);
    var ok = await restoreSession();
    if (!ok) ok = await importStorefrontSession();
    if (ok) enterApp();
    else { $('ste-login').style.display = 'grid'; }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
