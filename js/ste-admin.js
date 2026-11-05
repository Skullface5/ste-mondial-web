/* ═══════════════════════════════════════════════════════════════
   Mondial Perfume — admin (Rosa-skinned)
   Same chrome as Rosa Fragrances admin (tabs, hash routing, Jost/
   Cormorant, bottom nav on mobile) over the STE Supabase schema
   (trilingual products, audience, site_settings, orders).
   Plain REST, no build step.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://xuwumbdyfywmxuzlvvul.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_qF8l43W4lTYJMXGfVDx-9g_6n6y1pH_';
  var ADMIN_EMAILS = ['azizmelti@gmail.com'];
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
      'login.btn': 'Connexion', 'login.foot': 'Accès réservé — Mondial Perfume',
      'login.errFields': 'Email et mot de passe requis.', 'login.errBad': 'Identifiants incorrects',
      'dtab.ov': 'Aperçu', 'dtab.add': 'Ajouter', 'dtab.cat': 'Collections', 'dtab.ord': 'Commandes', 'dtab.set': 'Paramètres',
      'top.refresh': 'Rafraîchir', 'top.logout': 'Déconnexion',
      'dash.title': 'Tableau de bord', 'dash.t1': "Aujourd'hui", 'dash.t1h': 'commandes',
      'dash.t2': 'CA du jour', 'dash.t2h': 'hors annulées', 'dash.t3': 'En attente', 'dash.t3h': 'nouvelle + confirmée',
      'dash.t4': 'Stock faible', 'dash.t4h': 'stock ≤ 5', 'dash.recent': 'Dernières commandes', 'dash.lowcard': 'Stock faible (≤ 5)',
      'dash.emptyRecent': 'Pas encore de commandes.',
      'aud.homme': 'Homme', 'aud.femme': 'Femme', 'aud.unisexe': 'Unisexe', 'aud.enfants': 'Enfants',
      'cat.all': 'Tous', 'catTitle.all': 'Tous les produits',
      'prod.new': '+ Nouveau produit', 'prod.count': 'produit(s)', 'prod.search': 'Rechercher un produit...',
      'prod.created': 'Produit créé ✓', 'prod.updated': 'Produit mis à jour ✓', 'prod.deleted': 'Produit supprimé',
      'prod.name': 'Produit', 'prod.price': 'Prix', 'prod.stock': 'Stock', 'prod.actions': 'Actions',
      'inStock': 'En stock', 'lowStock': 'Stock faible', 'outOfStock': 'Rupture', 'off': 'Inactif', 'feat': 'En vedette',
      'addProduct': 'Ajouter un produit', 'loading': 'Chargement...', 'back': 'Retour', 'editHint': 'Choisissez un produit dans Collections → Modifier.',
      'edit': 'Modifier', 'del': 'Supprimer', 'saveChanges': 'Enregistrer les modifications',
      'pf.new': 'Nouveau produit', 'pf.edit': 'Modifier le produit',
      'pf.name': 'Nom du produit', 'pf.desc': 'Description',
      'pf.foldTr': 'Traductions — optionnel', 'pf.foldAdv': 'Options avancées',
      'pf.nameFR': 'Nom (FR) *', 'pf.nameEN': 'Nom (EN)', 'pf.nameAR': 'Nom (AR)',
      'pf.descFR': 'Description (FR)', 'pf.descEN': 'Description (EN)', 'pf.descAR': 'Description (AR)',
      'pf.aud': 'Public *', 'pf.price': 'Prix (DT) *', 'pf.oldPrice': 'Ancien prix — promo (optionnel)',
      'pf.promoPercent': 'Remise % (badge promo)',
      'pf.promoPercentHint': "Laissez vide : le % se calcule automatiquement depuis l'ancien prix. Sinon, il remplace celui du badge.",
      'pf.stock': 'Stock', 'pf.featured': 'Mis en avant', 'pf.active': 'Actif', 'pf.variants': 'Variantes (tailles)',
      'pf.images': 'Images du produit', 'pf.imgHelp': 'La 1re image = principale.',
      'pf.save': 'Enregistrer le produit', 'pf.cancel': 'Annuler', 'pf.delete': 'Supprimer',
      'pf.errName': 'Le nom (FR) est obligatoire.', 'pf.errPrice': 'Prix invalide.',
      'pf.uploading': "Envoi de l'image", 'pf.errPrefix': 'Erreur : ',
      'ord.title': 'Gestion des commandes', 'ord.search': 'ID, nom, téléphone, ville...', 'ord.all': 'Toutes',
      'badgeWord': 'commandes',
      'stRevenue': "Chiffre d'affaires", 'stRevenueSub': 'expédiées + livrées', 'stTotal': 'Total commandes',
      'stPending': 'En attente', 'stShipped': 'Expédiées', 'stDelivered': 'Livrées', 'stCancelled': 'Annulées',
      'st.nouvelle': 'Nouvelle', 'st.confirmee': 'Confirmée', 'st.expediee': 'Expédiée', 'st.livree': 'Livrée', 'st.annulee': 'Annulée',
      'ord.client': 'Client', 'ord.phone': 'Tél', 'ord.wa': 'WhatsApp', 'ord.items': 'Articles', 'ord.total': 'Total',
      'ord.call': 'Appeler', 'ord.received': 'Reçue', 'ord.emptyT': 'Aucune commande', 'ord.emptyS': 'Les commandes du site arrivent ici.',
      'ord.statusOk': 'Statut → ', 'ord.statusFail': "Échec du changement de statut", 'ord.deleted': 'Commande supprimée', 'ord.delFail': 'Échec de la suppression',
      'ord.del': 'Supprimer la commande', 'cf.delOrder': 'Supprimer définitivement cette commande ?',
      'set.shopCard': 'Boutique & livraison', 'set.sub': 'Nom, WhatsApp, frais, annonce.', 'set.shopName': 'Nom de la boutique',
      'set.whatsapp': 'WhatsApp (ex: 21612345678)', 'set.delivery': 'Frais de livraison (DT)',
      'set.annFr': 'Bandeau annonce (FR)', 'set.annEn': 'Bandeau annonce (EN)', 'set.annAr': 'Bandeau annonce (AR)',
      'set.linkLbl': 'Lien (optionnel)', 'set.save': 'Enregistrer', 'set.saved': 'Réglages enregistrés ✓', 'set.nothing': 'Rien à enregistrer.',
      'set.heroCard': 'Images héro (diaporama)', 'set.heroHelp': "Images (JPG, PNG, WebP, AVIF) ou vidéos (MP4, WebM, MOV) — 6 max. Cliquez une vignette pour lui attacher un lien. La 1re est l'image principale.",
      'set.saveHero': 'Enregistrer le héro', 'set.heroSaved1': 'Image héro enregistrée ✓', 'set.heroSavedN': 'Diaporama héro enregistré ✓',
      'set.bannerCard': 'Bannière promo', 'set.bannerHelp': "Images ou vidéos de la section promotion de l'accueil — 6 max. Cliquez une vignette pour lui attacher un lien.",
      'set.saveBanner': 'Enregistrer la bannière', 'set.bannerSavedN': 'Bannière enregistrée ✓',
      'set.autoplay': 'Défilement automatique', 'set.imgUpdated': 'Image mise à jour ✓', 'set.defaultApplied': 'Aucune image — défaut appliqué.',
      'set.mediaAdd': 'Ajouter une image ou une vidéo', 'set.mediaRemove': 'Retirer ce média',
      'set.mediaLimit': 'Maximum 6 médias par carte.', 'set.mediaTooBig': 'Vidéo trop lourde (max 25 Mo).',
      'set.mediaSaved': 'Enregistré ✓',
      'toast.refreshed': 'Données actualisées ✓', 'toast.loadErr': 'Erreur de chargement : ', 'prod.delFail': 'Échec de la suppression'
    },
    en: {
      'login.sub': 'Admin area', 'login.email': 'Email', 'login.password': 'Password',
      'login.btn': 'Sign in', 'login.foot': 'Restricted access — Mondial Perfume',
      'login.errFields': 'Email and password required.', 'login.errBad': 'Incorrect credentials',
      'dtab.ov': 'Overview', 'dtab.add': 'Add', 'dtab.cat': 'Collections', 'dtab.ord': 'Orders', 'dtab.set': 'Settings',
      'top.refresh': 'Refresh', 'top.logout': 'Log out',
      'dash.title': 'Dashboard', 'dash.t1': 'Today', 'dash.t1h': 'orders',
      'dash.t2': "Today's revenue", 'dash.t2h': 'excl. cancelled', 'dash.t3': 'Pending', 'dash.t3h': 'new + confirmed',
      'dash.t4': 'Low stock', 'dash.t4h': 'stock ≤ 5', 'dash.recent': 'Latest orders', 'dash.lowcard': 'Low stock (≤ 5)',
      'dash.emptyRecent': 'No orders yet.',
      'aud.homme': 'Men', 'aud.femme': 'Women', 'aud.unisexe': 'Unisex', 'aud.enfants': 'Kids',
      'cat.all': 'All', 'catTitle.all': 'All products',
      'prod.new': '+ New product', 'prod.count': 'product(s)', 'prod.search': 'Search products...',
      'prod.created': 'Product created ✓', 'prod.updated': 'Product updated ✓', 'prod.deleted': 'Product deleted',
      'prod.name': 'Product', 'prod.price': 'Price', 'prod.stock': 'Stock', 'prod.actions': 'Actions',
      'inStock': 'In stock', 'lowStock': 'Low', 'outOfStock': 'Out', 'off': 'Hidden', 'feat': 'Featured',
      'addProduct': 'Add product', 'loading': 'Loading...', 'back': 'Back', 'editHint': 'Pick a product in Collections → Edit.',
      'edit': 'Edit', 'del': 'Delete', 'saveChanges': 'Save changes',
      'pf.new': 'New product', 'pf.edit': 'Edit product',
      'pf.name': 'Product name', 'pf.desc': 'Description',
      'pf.foldTr': 'Translations — optional', 'pf.foldAdv': 'Advanced options',
      'pf.nameFR': 'Name (FR) *', 'pf.nameEN': 'Name (EN)', 'pf.nameAR': 'Name (AR)',
      'pf.descFR': 'Description (FR)', 'pf.descEN': 'Description (EN)', 'pf.descAR': 'Description (AR)',
      'pf.aud': 'Audience *', 'pf.price': 'Price (DT) *', 'pf.oldPrice': 'Old price — promo (optional)',
      'pf.promoPercent': 'Discount % (promo badge)',
      'pf.promoPercentHint': 'Leave empty: the % is computed automatically from the old price. Otherwise it replaces the badge one.',
      'pf.stock': 'Stock', 'pf.featured': 'Featured', 'pf.active': 'Active', 'pf.variants': 'Variants (sizes)',
      'pf.images': 'Product images', 'pf.imgHelp': '1st image = main.',
      'pf.save': 'Save product', 'pf.cancel': 'Cancel', 'pf.delete': 'Delete',
      'pf.errName': 'Name (FR) is required.', 'pf.errPrice': 'Invalid price.',
      'pf.uploading': 'Uploading image', 'pf.errPrefix': 'Error: ',
      'ord.title': 'Order management', 'ord.search': 'ID, name, phone, city...', 'ord.all': 'All',
      'badgeWord': 'orders',
      'stRevenue': 'Revenue', 'stRevenueSub': 'shipped + delivered', 'stTotal': 'Total orders',
      'stPending': 'Pending', 'stShipped': 'Shipped', 'stDelivered': 'Delivered', 'stCancelled': 'Cancelled',
      'st.nouvelle': 'New', 'st.confirmee': 'Confirmed', 'st.expediee': 'Shipped', 'st.livree': 'Delivered', 'st.annulee': 'Cancelled',
      'ord.client': 'Customer', 'ord.phone': 'Phone', 'ord.wa': 'WhatsApp', 'ord.items': 'Items', 'ord.total': 'Total',
      'ord.call': 'Call', 'ord.received': 'Received', 'ord.emptyT': 'No orders', 'ord.emptyS': 'Orders from the site arrive here.',
      'ord.statusOk': 'Status → ', 'ord.statusFail': 'Status change failed', 'ord.deleted': 'Order deleted', 'ord.delFail': 'Delete failed',
      'ord.del': 'Delete order', 'cf.delOrder': 'Permanently delete this order?',
      'set.shopCard': 'Shop & delivery', 'set.sub': 'Name, WhatsApp, fees, announcement.', 'set.shopName': 'Shop name',
      'set.whatsapp': 'WhatsApp (e.g. 21612345678)', 'set.delivery': 'Delivery fee (DT)',
      'set.annFr': 'Announcement banner (FR)', 'set.annEn': 'Announcement banner (EN)', 'set.annAr': 'Announcement banner (AR)',
      'set.linkLbl': 'Link (optional)', 'set.save': 'Save', 'set.saved': 'Settings saved ✓', 'set.nothing': 'Nothing to save.',
      'set.heroCard': 'Hero images (slideshow)', 'set.heroHelp': 'Images (JPG, PNG, WebP, AVIF) or videos (MP4, WebM, MOV) — 6 max. Click a thumbnail to attach a link to it. The 1st is the main one.',
      'set.saveHero': 'Save hero', 'set.heroSaved1': 'Hero image saved ✓', 'set.heroSavedN': 'Hero slideshow saved ✓',
      'set.bannerCard': 'Promo banner', 'set.bannerHelp': 'Images or videos for the home promo section — 6 max. Click a thumbnail to attach a link to it.',
      'set.saveBanner': 'Save banner', 'set.bannerSavedN': 'Banner saved ✓',
      'set.autoplay': 'Auto-play slideshow', 'set.imgUpdated': 'Image updated ✓', 'set.defaultApplied': 'No images — default applied.',
      'set.mediaAdd': 'Add an image or a video', 'set.mediaRemove': 'Remove this media',
      'set.mediaLimit': 'Maximum 6 media per card.', 'set.mediaTooBig': 'Video too heavy (max 25 MB).',
      'set.mediaSaved': 'Saved ✓',
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
      'dash.emptyRecent': 'لا طلبات بعد.',
      'aud.homme': 'رجالي', 'aud.femme': 'نسائي', 'aud.unisexe': 'للجنسين', 'aud.enfants': 'أطفال',
      'cat.all': 'الكل', 'catTitle.all': 'كل المنتجات',
      'prod.new': '+ منتج جديد', 'prod.count': 'منتج', 'prod.search': 'البحث عن منتج...',
      'prod.created': 'تم إنشاء المنتج ✓', 'prod.updated': 'تم تحديث المنتج ✓', 'prod.deleted': 'تم حذف المنتج',
      'prod.name': 'المنتج', 'prod.price': 'السعر', 'prod.stock': 'المخزون', 'prod.actions': 'إجراءات',
      'inStock': 'متوفر', 'lowStock': 'منخفض', 'outOfStock': 'نفد', 'off': 'مخفي', 'feat': 'مميز',
      'addProduct': 'إضافة منتج', 'loading': 'جاري التحميل...', 'back': 'رجوع', 'editHint': 'اختر منتجًا من المجموعات ← تعديل.',
      'edit': 'تعديل', 'del': 'حذف', 'saveChanges': 'حفظ التعديلات',
      'pf.new': 'منتج جديد', 'pf.edit': 'تعديل المنتج',
      'pf.name': 'اسم المنتج', 'pf.desc': 'الوصف',
      'pf.foldTr': 'الترجمات — اختياري', 'pf.foldAdv': 'خيارات متقدمة',
      'pf.nameFR': 'الاسم (FR) *', 'pf.nameEN': 'الاسم (EN)', 'pf.nameAR': 'الاسم (AR)',
      'pf.descFR': 'الوصف (FR)', 'pf.descEN': 'الوصف (EN)', 'pf.descAR': 'الوصف (AR)',
      'pf.aud': 'الفئة المستهدفة *', 'pf.price': 'السعر (د.ت) *', 'pf.oldPrice': 'السعر القديم — عرض (اختياري)',
      'pf.promoPercent': 'نسبة الخصم % (شارة العرض)',
      'pf.promoPercentHint': 'اتركه فارغاً ليُحسب تلقائياً من السعر القديم، وإلا فسيحلّ محل نسبة الشارة.',
      'pf.stock': 'المخزون', 'pf.featured': 'مميز', 'pf.active': 'نشط', 'pf.variants': 'الأحجام',
      'pf.images': 'صور المنتج', 'pf.imgHelp': 'الصورة الأولى = الأساسية.',
      'pf.save': 'حفظ المنتج', 'pf.cancel': 'إلغاء', 'pf.delete': 'حذف',
      'pf.errName': 'الاسم (FR) مطلوب.', 'pf.errPrice': 'سعر غير صالح.',
      'pf.uploading': 'رفع الصورة', 'pf.errPrefix': 'خطأ: ',
      'ord.title': 'إدارة الطلبات', 'ord.search': 'المعرّف، الاسم، الهاتف، المدينة...', 'ord.all': 'الكل',
      'badgeWord': 'طلب',
      'stRevenue': 'رقم المعاملات', 'stRevenueSub': 'مُرسلة + مستلمة', 'stTotal': 'إجمالي الطلبات',
      'stPending': 'في الانتظار', 'stShipped': 'مُرسلة', 'stDelivered': 'مستلمة', 'stCancelled': 'ملغاة',
      'st.nouvelle': 'جديدة', 'st.confirmee': 'مؤكدة', 'st.expediee': 'مُرسلة', 'st.livree': 'مستلمة', 'st.annulee': 'ملغاة',
      'ord.client': 'الزبون', 'ord.phone': 'الهاتف', 'ord.wa': 'واتساب', 'ord.items': 'المواد', 'ord.total': 'المجموع',
      'ord.call': 'اتصال', 'ord.received': 'وصلت', 'ord.emptyT': 'لا طلبات', 'ord.emptyS': 'طلبات الموقع تصل هنا.',
      'ord.statusOk': 'الحالة ← ', 'ord.statusFail': 'فشل تغيير الحالة', 'ord.deleted': 'تم حذف الطلب', 'ord.delFail': 'فشل الحذف',
      'ord.del': 'حذف الطلب', 'cf.delOrder': 'حذف هذا الطلب نهائيًا؟',
      'set.shopCard': 'المتجر والتوصيل', 'set.sub': 'الاسم، واتساب، الرسوم، الإعلان.', 'set.shopName': 'اسم المتجر',
      'set.whatsapp': 'واتساب (مثال: 21612345678)', 'set.delivery': 'رسوم التوصيل (د.ت)',
      'set.annFr': 'شريط الإعلان (FR)', 'set.annEn': 'شريط الإعلان (EN)', 'set.annAr': 'شريط الإعلان (AR)',
      'set.linkLbl': 'رابط (اختياري)', 'set.save': 'حفظ', 'set.saved': 'تم الحفظ ✓', 'set.nothing': 'لا شيء للحفظ.',
      'set.heroCard': 'صور الواجهة', 'set.heroHelp': 'صور (JPG، PNG، WebP، AVIF) أو فيديوهات (MP4، WebM، MOV) — 6 كحد أقصى. اضغط على صورة مصغّرة لإرفاق رابط بها. الأولى هي الأساسية.',
      'set.saveHero': 'حفظ الواجهة', 'set.heroSaved1': 'تم حفظ الصورة ✓', 'set.heroSavedN': 'تم حفظ العرض ✓',
      'set.bannerCard': 'لافتة ترويجية', 'set.bannerHelp': 'صور أو فيديوهات لقسم الترويج بالرئيسية — 6 كحد أقصى. اضغط على صورة مصغّرة لإرفاق رابط بها.',
      'set.saveBanner': 'حفظ البانر', 'set.bannerSavedN': 'تم حفظ البانر ✓',
      'set.autoplay': 'تبديل تلقائي', 'set.imgUpdated': 'تم تحديث الصورة ✓', 'set.defaultApplied': 'لا صور — الافتراضي مطبق.',
      'set.mediaAdd': 'إضافة صورة أو فيديو', 'set.mediaRemove': 'إزالة هذا الملف',
      'set.mediaLimit': '6 ملفات كحد أقصى لكل بطاقة.', 'set.mediaTooBig': 'الفيديو ثقيل جدًا (25 ميغا كحد أقصى).',
      'set.mediaSaved': 'تم الحفظ ✓',
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
  var heroSt = { list: [], files: [], sel: -1, saving: false }, banSt = { list: [], files: [], sel: -1, saving: false };
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
      // Prefer the stored access token (no refresh round-trip = no rotation race).
      if (cached.access) {
        user = { access_token: cached.access, refresh_token: cached.refresh, email: cached.email };
        var res = await fetch(SUPABASE_URL + '/rest/v1/orders?select=id&limit=1', { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + user.access_token } });
        if (res.status !== 401) {
          try { localStorage.setItem('sm_admin_session', JSON.stringify(user)); } catch (e) {}
          return true;
        }
      }
      // Access token dead/absent -> refresh (fallback)
      user = { access_token: null, refresh_token: cached.refresh, email: cached.email };
      var ok = await refreshSession();
      if (!ok) { user = null; return false; }
      try { cached.refresh = user.refresh_token; cached.access = user.access_token; localStorage.setItem('sm_user2', JSON.stringify(cached)); } catch (e) {}
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
    }).join('') : '<p class="sc-help">' + t('dash.emptyRecent') + '</p>';
    $('dashLow').innerHTML = low.length ? low.map(function (p) {
      return '<button class="mini-row" data-open-product="' + esc(p.id) + '"><span class="mr-name">' + esc(p.name_fr || '—') + '</span><span>' + esc(audLabel(p.audience)) + '</span><span class="mini-chip st-warn">stock ' + esc(p.stock) + '</span></button>';
    }).join('') : '';
    var lp = $('lowPanel'); if (lp) lp.hidden = low.length === 0;
    var em = $('sessionEmailChip'); if (em && user) em.textContent = '· ' + user.email;
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
      list = list.filter(function (p) { return [p.name_fr, p.name_en, p.name_ar].some(function (v) { return String(v || '').toLowerCase().indexOf(q) !== -1; }); });
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
        '<td><strong>' + esc(p.name_fr || '—') + '</strong>' + flags + '</td>' +
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
    $(pref + 'Price').value = p ? p.price : '';
    $(pref + 'OldPrice').value = (p && p.old_price != null) ? p.old_price : '';
    $(pref + 'PromoPercent').value = (p && p.promo_percent != null) ? p.promo_percent : '';
    $(pref + 'Stock').value = p ? (p.stock != null ? p.stock : 10) : 10;
    $(pref + 'Featured').checked = !!(p && p.featured);
    $(pref + 'Active').checked = p ? p.active !== false : true;
    var aud = p && p.audience ? p.audience : (pref === 'a' ? addAud : editAud);
    if (pref === 'a') { addAud = aud; } else { editAud = aud; }
    $all('#' + pref + 'AudSeg button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-aud') === aud); });
    renderGallery(pref);
    var varList = $(pref === 'a' ? 'variantsList' : 'eVariantsList');
    if (varList && window.SteAdminVariants) {
      window.SteAdminVariants.setRows(varList, (p && p.variants) ? p.variants : []);
    }
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
  function uploadToBucket(file, pathPrefix, extOverride) {
    return new Promise(function (resolve, reject) {
      var nm = String((file && file.name) || '');
      var ext = extOverride || (nm.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
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
  /* Manual promo badge percent. Empty -> null (badge falls back to the value
     computed from old_price); keep only a finite, strictly-positive number. */
  function normalizePromoPercent(raw) {
    if (raw === '' || raw == null) return null;
    var n = Number(raw);
    return (isFinite(n) && n >= 1 && n <= 99) ? n : null;
  }
  function collectPayload(pref) {
    var g = formState(pref);
    var urls = g.urls.slice();
    return {
      name_fr: $(pref + 'NameFr').value.trim(),
      name_en: $(pref + 'NameEn').value.trim() || $(pref + 'NameFr').value.trim(),
      name_ar: $(pref + 'NameAr').value.trim() || $(pref + 'NameFr').value.trim(),
      desc_fr: $(pref + 'DescFr').value.trim() || null,
      desc_en: $(pref + 'DescEn').value.trim() || null,
      desc_ar: $(pref + 'DescAr').value.trim() || null,
      audience: currentAud(pref),
      price: Number($(pref + 'Price').value),
      old_price: $(pref + 'OldPrice').value === '' ? null : Number($(pref + 'OldPrice').value),
      promo_percent: normalizePromoPercent($(pref + 'PromoPercent').value),
      stock: $(pref + 'Stock').value === '' ? 0 : Math.max(0, parseInt($(pref + 'Stock').value, 10)),
      featured: $(pref + 'Featured').checked,
      active: $(pref + 'Active').checked,
      image_url: urls[0] || null,
      images: urls,
      variants: (window.SteAdminVariants && $(pref === 'a' ? 'variantsList' : 'eVariantsList'))
        ? window.SteAdminVariants.readRows($(pref === 'a' ? 'variantsList' : 'eVariantsList'))
        : []
    };
  }
  async function submitForm(pref) {
    var msgId = pref + 'Msg', btn = $(pref === 'a' ? 'aSubmit' : 'eSubmit');
    /* A hidden submit means the form is not open — after a successful save the
       panel switches to collections but the button stays in the DOM. Without
       this guard a second click re-submits with editingId already cleared,
       which POSTs a duplicate product. */
    if (!btn || !btn.offsetParent) return;
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
      var method = (pref === 'e' && editingId) ? 'PATCH' : 'POST';
      var path = method === 'PATCH' ? '/rest/v1/products?id=eq.' + editingId : '/rest/v1/products';
      var prefer = method === 'PATCH' ? 'return=minimal' : 'return=representation';
      var res = await api(method, path, payload, prefer);
      if (!res.ok) {
        var errTxt = await res.text();
        // Defensive: the promo_percent column may not be migrated yet on a given
        // deployment — retry the save without it instead of failing outright.
        if (/promo_percent/.test(errTxt) && Object.prototype.hasOwnProperty.call(payload, 'promo_percent')) {
          delete payload.promo_percent;
          res = await api(method, path, payload, prefer);
          errTxt = res.ok ? '' : await res.text();
        }
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + errTxt.slice(0, 140));
      }
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
    $('editChip').textContent = (p.name_fr || '').slice(0, 24);
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

  /* ── promo appearance settings ── */
  var PROMO_KEYS = ['promo_badge_color', 'promo_price_color', 'promo_badge_shape', 'buy_cart_icon'];
  var promoState = {};
  var PROMO_REACTIVE = { promo_badge_color: 'promoBadgeColor', promo_price_color: 'promoPriceColor' };
  var PROMO_SEGS = { promo_badge_shape: 'promoBadgeShape', buy_cart_icon: 'promoCartIcon' };
  // admin.html now loads js/ste-promo.js before this file, so window.StePromo is
  // the single source for defaults / colours / icons. The tiny literals below are
  // a last-resort fallback for the degenerate "module missing" case only — they
  // are never the normal path, so nothing drifts from the storefront.
  function promoDefaults() {
    var RP = window.StePromo;
    return (RP && RP.DEFAULTS) || { promo_badge_color: 'green', promo_price_color: 'red', promo_badge_shape: 'pill', buy_cart_icon: 'plus-cart' };
  }
  function promoColors() {
    var RP = window.StePromo;
    return (RP && RP.COLORS) || { green: '#03B557', red: '#E0231F', gold: '#B08D4A', black: '#2B1D12' };
  }
  function promoIconHtml() {
    var RP = window.StePromo;
    if (RP && RP.buyIcon) { try { return RP.buyIcon(); } catch (e) {} }
    return '';
  }
  // Real badge percent of the shop's first promo product (so a manual
  // promo_percent shows through), else the static sample.
  function previewBadgeText() {
    try {
      var RP = window.StePromo;
      if (RP && RP.percent && Array.isArray(products)) {
        for (var i = 0; i < products.length; i++) {
          var pct = RP.percent(products[i]);
          if (pct != null) return '-' + pct + '%';
        }
      }
    } catch (e) {}
    return '-40%';
  }
  function promoValueFor(k) {
    var v = promoState[k];
    if (v === undefined || v === null || v === '') v = promoDefaults()[k];
    return v;
  }

  function paintPromo() {
    var RP = window.StePromo;
    if (RP) RP.setSettings(promoState);
    Object.keys(PROMO_REACTIVE).forEach(function (key) {
      var box = $(PROMO_REACTIVE[key]);
      if (!box) return;
      box.querySelectorAll('.promo-sw').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.value === promoState[key]);
      });
    });
    Object.keys(PROMO_SEGS).forEach(function (key) {
      var box = $(PROMO_SEGS[key]);
      if (!box) return;
      box.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('is-active', b.dataset.value === promoState[key]);
      });
    });
    var badge = $('promoPreviewBadge');
    if (badge) {
      var bg = promoColors();
      badge.style.background = bg[promoState.promo_badge_color] || '#03B557';
      badge.className = 'rp-badge rp-badge--' + (promoState.promo_badge_shape || 'pill');
      badge.textContent = previewBadgeText();
    }
    var price = $('promoPreviewPrice');
    if (price) {
      var pc = promoColors();
      price.style.color = pc[promoState.promo_price_color] || '#E0231F';
    }
    var icon = $('promoPreviewIcon');
    if (icon) icon.innerHTML = promoIconHtml();
  }

  function bindPromo() {
    Object.keys(PROMO_REACTIVE).forEach(function (key) {
      var box = $(PROMO_REACTIVE[key]);
      if (!box || box.__promoBound) return;
      box.__promoBound = true;
      box.addEventListener('click', function (e) {
        var b = e.target.closest('.promo-sw');
        if (!b) return;
        promoState[key] = b.dataset.value;
        paintPromo();
      });
    });
    Object.keys(PROMO_SEGS).forEach(function (key) {
      var box = $(PROMO_SEGS[key]);
      if (!box || box.__promoBound) return;
      box.__promoBound = true;
      box.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-value]');
        if (!b) return;
        promoState[key] = b.dataset.value;
        paintPromo();
      });
    });
    var save = $('btnSavePromo');
    if (save && !save.__promoBound) {
      save.__promoBound = true;
      save.addEventListener('click', savePromo);
    }
  }

  async function loadPromo() {
    try {
      var res = await api('GET', '/rest/v1/site_settings?select=key,value');
      if (!res.ok) return;
      // api() returns a raw fetch Response — it has no `.data`. Read the body
      // with res.json(); `res.data` was always undefined, so the saved promo
      // values never came back and the card silently showed the defaults on
      // every reload (the other half of the owner's "I see no change").
      var rows = [];
      try { rows = await res.json(); } catch (e) { rows = []; }
      var map = {};
      (rows || []).forEach(function (r) { map[r.key] = r.value; });
      PROMO_KEYS.forEach(function (k) {
        var v = map[k];
        if (v && typeof v === 'object' && v.value != null) v = v.value;
        if (typeof v === 'string' && v) promoState[k] = v;
      });
      paintPromo();
    } catch (e) { /* silent */ }
  }

  async function savePromo() {
    var btn = $('btnSavePromo');
    if (btn) btn.disabled = true;
    try {
      var rows = PROMO_KEYS.map(function (k) {
        return { key: k, value: promoValueFor(k) };
      });
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', rows, 'resolution=merge-duplicates,return=minimal');
      if (res.ok) { showMsg('promoMsg', t('set.saved'), true); }
      else {
        var msg = '';
        try {
          var txt = await res.clone().text();
          var parsed = txt ? JSON.parse(txt) : null;
          if (parsed) msg = parsed.message || parsed.hint || '';
        } catch (e) { msg = ''; }
        showMsg('promoMsg', t('pf.errPrefix') + 'HTTP ' + res.status + (msg ? ' — ' + msg : ''));
      }
    } catch (e) { showMsg('promoMsg', t('pf.errPrefix') + e.message); }
    finally { if (btn) btn.disabled = false; }
  }
  function renderSettingsTab() {
    SETTING_KEYS.forEach(function (k) {
      var el = document.querySelector('[data-setting="' + k + '"]');
      if (!el) return;
      if (document.activeElement === el) return;   // keep unsaved edits
      var v = settings[k];
      if (k === 'delivery_fee' && v == null) v = 7;   // default shown in the field
      el.value = v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v);
    });
    heroSt.list = normMedia(settings.hero_images, settings.hero_image);
    banSt.list = normMedia(settings.banner_images, settings.banner_image);
    heroSt.sel = -1; banSt.sel = -1;
    $('heroAutoplay').checked = settings.hero_autoplay !== false;
    $('bannerAutoplay').checked = settings.banner_autoplay !== false;
    renderMediaStrip('heroStrip', heroSt);
    renderMediaStrip('bannerStrip', banSt);
    // Repaint the promo preview here too: this runs after every loadAll(), so the
    // preview badge figure follows the real product rows (incl. manual promo_percent).
    paintPromo();
  }
  /* ── media cards (hero slideshow + promo banner) ──────────────────────────
     Item shape stored in site_settings: { src, type: 'image'|'video', link }
     Legacy shapes still load: plain URL strings, and {src, link} objects.
     Images are downscaled to 1600px on the long edge and re-encoded to WebP
     before upload; videos are uploaded untouched.                              */
  var MEDIA_MAX = 6;
  var VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i;
  var VIDEO_MAX_BYTES = 25 * 1024 * 1024;
  function isVideoSrc(u) { return VIDEO_EXT.test(String(u || '')); }
  function mediaType(file) {
    var mt = (file && file.type) || '';
    if (/^video\//i.test(mt)) return 'video';
    if (/^image\//i.test(mt)) return 'image';
    return isVideoSrc(file && file.name) ? 'video' : 'image';
  }
  function normMedia(arr, legacy) {
    var raw = Array.isArray(arr) ? arr : (legacy ? [legacy] : []);
    return raw.filter(Boolean).map(function (it) {
      if (typeof it === 'string') return { src: it, type: isVideoSrc(it) ? 'video' : 'image', link: '' };
      var src = String(it.src || it.url || '');
      return { src: src, type: (it.type === 'video' || isVideoSrc(src)) ? 'video' : 'image', link: String(it.link || '') };
    }).filter(function (it) { return it.src; }).slice(0, MEDIA_MAX);
  }
  function mediaKey(boxId) { return boxId === 'heroStrip' ? 'hero' : 'banner'; }
  function mediaState(kind) { return kind === 'hero' ? heroSt : banSt; }
  function mediaBox(kind) { return kind === 'hero' ? 'heroStrip' : 'bannerStrip'; }
  function linkEls(boxId) {
    var k = mediaKey(boxId);
    return { row: $(k + 'LinkRow'), inp: $(k + 'LinkInput'), tgt: $(k + 'LinkTarget') };
  }
  function selItem(boxId, st) {
    if (st.sel < 0) return null;
    if (st.sel < st.list.length) return st.list[st.sel];
    var f = st.files[st.sel - st.list.length];
    return (f && f.file) ? f : null;
  }
  function syncLinkRow(boxId, st) {
    var le = linkEls(boxId); if (!le.row) return;
    var it = selItem(boxId, st);
    le.row.hidden = !it;
    if (it) {
      le.tgt.textContent = '#' + (st.sel + 1) + '/' + (st.list.length + st.files.length);
      if (document.activeElement !== le.inp) le.inp.value = it.link || '';
    } else if (le.inp) {
      le.inp.value = '';
    }
  }
  function mediaMsg(kind, text, ok) {
    var el = $(kind + 'Msg'); if (!el) return;
    el.textContent = text || '';
    el.className = 'hero-admin-msg' + (text ? ' show' + (ok ? ' ok' : ' err') : '');
  }
  function flashSaved(kind) {
    var b = $(kind + 'SavedBadge'); if (!b) return;
    b.hidden = false;
    clearTimeout(flashSaved['_t' + kind]);
    flashSaved['_t' + kind] = setTimeout(function () { b.hidden = true; }, 3500);
  }
  /* canvas downscale to 1600px on the long edge -> WebP; falls back to the raw file */
  function compressImage(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      function fallback() { resolve({ blob: file, ext: (String(file.name || 'jpg').split('.').pop() || 'jpg').toLowerCase() }); }
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        try {
          var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          if (!w || !h) { fallback(); return; }
          if (Math.max(w, h) > 1600) { var k = 1600 / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
          var canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          canvas.toBlob(function (blob) {
            if (blob && blob.type === 'image/webp') resolve({ blob: blob, ext: 'webp' });
            else fallback();
          }, 'image/webp', 0.85);
        } catch (e) { fallback(); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); fallback(); };
      img.src = url;
    });
  }
  function renderMediaStrip(boxId, st) {
    var box = $(boxId); if (!box) return;
    var total = st.list.length + st.files.length;
    if (st.sel >= total) st.sel = -1;
    function thumbHtml(it, li, isNew, delAttr) {
      var v = it.type === 'video';
      var src = isNew ? (it.url || (it.url = URL.createObjectURL(it.file))) : mediaUrl(it.src);
      var media = v
        ? '<video src="' + esc(src) + '" muted preload="metadata" playsinline></video><span class="g-vid-tag" aria-hidden="true"><i class="fas fa-play"></i></span>'
        : '<img src="' + esc(src) + '" alt=""' + (isNew ? '' : ' loading="lazy"') + '>';
      return '<div class="g-thumb' + (v ? ' g-thumb--vid' : '') + (isNew ? ' g-thumb--new' : '') +
        (st.sel === li ? ' g-thumb--active' : '') + '" data-gsel="' + li + '">' + media +
        (it.link ? '<span class="g-link-tag" aria-hidden="true"><i class="fas fa-link"></i></span>' : '') +
        '<button type="button" class="g-del" ' + delAttr + ' aria-label="' + esc(t('set.mediaRemove')) + '">&#10005;</button></div>';
    }
    var html = st.list.map(function (it, i) {
      return thumbHtml(it, i, false, 'data-mdel="' + boxId + ':' + i + '"');
    }).join('');
    html += (st.files || []).map(function (f, i) {
      return thumbHtml(f, st.list.length + i, true, 'data-mfile="' + boxId + ':' + i + '"');
    }).join('');
    if (total < MEDIA_MAX) {
      html += '<label class="g-add" for="' + mediaKey(boxId) + 'FileInput" aria-label="' + esc(t('set.mediaAdd')) + '">+</label>';
    }
    box.innerHTML = html;
    var badge = $(mediaKey(boxId) + 'CountBadge');
    if (badge) badge.textContent = total + '/' + MEDIA_MAX;
    syncLinkRow(boxId, st);
  }
  function addMediaFiles(kind, fileList) {
    var st = mediaState(kind);
    var msg = '';
    Array.prototype.slice.call(fileList || []).forEach(function (file) {
      if (st.list.length + st.files.length >= MEDIA_MAX) { msg = t('set.mediaLimit'); return; }
      var type = mediaType(file);
      if (type === 'video' && file.size > VIDEO_MAX_BYTES) { msg = t('set.mediaTooBig'); return; }
      st.files.push({ file: file, type: type, link: '' });
    });
    if (st.files.length) st.sel = st.list.length + st.files.length - 1;
    if (msg) mediaMsg(kind, '⚠ ' + msg, false);
    renderMediaStrip(mediaBox(kind), st);
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
    var st = mediaState(kind);
    var btn = $(kind === 'hero' ? 'btnSaveHero' : 'btnSaveBanner');
    if (st.saving) return;
    st.saving = true;
    if (btn) btn.disabled = true;
    try {
      var list = st.list.map(function (it) {
        return { src: it.src, type: it.type === 'video' ? 'video' : 'image', link: it.link || '' };
      });
      for (var i = 0; i < st.files.length; i++) {
        var fi = st.files[i];
        mediaMsg(kind, t('pf.uploading') + ' ' + (i + 1) + '/' + st.files.length + '...', true);
        var src;
        if (fi.type === 'video') {
          src = await uploadToBucket(fi.file, 'site');           // videos are uploaded untouched
        } else {
          var c = await compressImage(fi.file);                  // images: 1600px max, WebP
          src = await uploadToBucket(c.blob, 'site', c.ext);
        }
        list.push({ src: src, type: fi.type === 'video' ? 'video' : 'image', link: (fi.link || '').trim() });
      }
      var key = kind === 'hero' ? 'hero_images' : 'banner_images';
      var apKey = kind === 'hero' ? 'hero_autoplay' : 'banner_autoplay';
      var ap = $(kind === 'hero' ? 'heroAutoplay' : 'bannerAutoplay');
      var apVal = !(ap && ap.checked === false);
      var res = await api('POST', '/rest/v1/site_settings?on_conflict=key', [
        { key: key, value: list },
        { key: apKey, value: apVal }
      ], 'resolution=merge-duplicates,return=minimal');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      // keep the local settings cache in sync, otherwise renderAll() repaints
      // the strips from the pre-save values
      settings[key] = list; settings[apKey] = apVal;
      st.list = list; st.files = []; st.sel = -1;
      renderSettingsTab();
      mediaMsg(kind, list.length > 1 ? t(kind === 'hero' ? 'set.heroSavedN' : 'set.bannerSavedN') : t(kind === 'hero' ? 'set.heroSaved1' : 'set.imgUpdated'), true);
      flashSaved(kind);
      toast(t('set.mediaSaved'));
    } catch (e) {
      mediaMsg(kind, t('pf.errPrefix') + (e && e.message ? e.message : ''));
    }
    finally { st.saving = false; if (btn) btn.disabled = false; }
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
    /* lang */
    $all('.lang-option').forEach(function (b) {
      b.addEventListener('click', function () { lang = b.getAttribute('data-lang'); applyLang(); });
    });

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
        if (p && confirm(t('cf.delProduct') + (p.name_fr) + t('cf.delProductSuffix'))) {
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
      var gsel = e.target.closest('[data-gsel]');
      if (gsel && !e.target.closest('.g-del')) {
        var gbox = gsel.closest('.g-strip');
        if (gbox) {
          var gst = gbox.id === 'heroStrip' ? heroSt : banSt;
          var gi = +gsel.getAttribute('data-gsel');
          gst.sel = (gst.sel === gi) ? -1 : gi;
          renderMediaStrip(gbox.id, gst);
          return;
        }
      }
      var lclear = e.target.closest('#heroLinkClear, #bannerLinkClear');
      if (lclear) {
        var lbox = lclear.id === 'heroLinkClear' ? 'heroStrip' : 'bannerStrip';
        var lst = lbox === 'heroStrip' ? heroSt : banSt;
        var lit = selItem(lbox, lst);
        if (lit) lit.link = '';
        var lle = linkEls(lbox); if (lle.inp) lle.inp.value = '';
        renderMediaStrip(lbox, lst);
        return;
      }
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
    $('eSubmit').addEventListener('click', function () { submitForm('e'); });
    $('eDelete').addEventListener('click', function () {
      var p = products.filter(function (x) { return x.id === editingId; })[0];
      if (p && confirm(t('cf.delProduct') + (p.name_fr) + t('cf.delProductSuffix'))) {
        api('DELETE', '/rest/v1/products?id=eq.' + p.id, undefined, 'return=minimal').then(function (r) {
          if (!r.ok) throw new Error();
          editingId = null; try { sessionStorage.removeItem('ste_edit_id'); } catch (e) {}
          return loadAll().then(function () { goto_('collections'); toast(t('prod.deleted')); });
        }).catch(function () { toast(t('prod.delFail')); });
      }
    });

    /* settings */
    $('btnSaveSettings').addEventListener('click', saveSettingsTab);
    bindPromo();
    loadPromo();
    $('btnSaveHero').addEventListener('click', function () { saveMedia('hero'); });
    $('btnSaveBanner').addEventListener('click', function () { saveMedia('banner'); });
    $('heroFileInput').addEventListener('change', function () {
      addMediaFiles('hero', this.files);
      this.value = '';
    });
    $('bannerFileInput').addEventListener('change', function () {
      addMediaFiles('banner', this.files);
      this.value = '';
    });
    ['hero', 'banner'].forEach(function (k) {
      var inp = $(k + 'LinkInput'); if (!inp) return;
      inp.addEventListener('input', function () {
        var st = mediaState(k);
        var it = selItem(mediaBox(k), st);
        if (it) it.link = inp.value.trim();
        var th = $(mediaBox(k)) && $(mediaBox(k)).querySelector('[data-gsel="' + st.sel + '"]');
        if (th) {
          var tag = th.querySelector('.g-link-tag');
          if (it && it.link && !tag) th.insertAdjacentHTML('beforeend', '<span class="g-link-tag" aria-hidden="true"><i class="fas fa-link"></i></span>');
          if ((!it || !it.link) && tag) tag.remove();
        }
      });
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
