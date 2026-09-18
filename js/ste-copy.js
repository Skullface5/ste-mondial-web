/* ============================================================
   STE COPY — premium behavior layer.
   Extends js/index.js (runs after it). Safe fallbacks everywhere:
   if index.js failed to load, this file still works on its own.
   ============================================================ */
(function () {
  'use strict';

  /* ── 1) TRANSLATIONS for the new sections (fr / en / ar) ── */
  try {
    if (typeof translations === 'object' && translations) {
      var EXTRA = {
        fr: {
          universEyebrow: 'Notre Univers',
          universTitle: 'Une maison,<br><em>une promesse.</em>',
          universText: "Ste Mondial Parfums est née d'une conviction simple : le luxe n'est pas une question de frontières, mais d'exigence. Nous parcourons le monde pour sélectionner des fragrances d'exception, puis nous les offrons à la Tunisie avec un service à la hauteur — transparent, rapide et humain.",
          uniAuthTitle: 'Authenticité garantie',
          uniAuthText: 'Chaque flacon est sourcé auprès de fournisseurs de confiance. Original, certifié, sans compromis.',
          uniShipTitle: 'Livraison 24–48h',
          uniShipText: 'Partout en Tunisie, votre commande arrive à votre porte soigneusement emballée, en un temps record.',
          uniPayTitle: 'Paiement à la livraison',
          uniPayText: "Vous ne payez qu'à la réception de votre commande. Simple, sûr, sans avance.",
          marq1: 'Livraison partout en Tunisie',
          marq2: 'Paiement à la livraison',
          marq3: 'Parfums 100% originaux',
          marq4: 'Service client 7j/7'
        },
        en: {
          universEyebrow: 'Our World',
          universTitle: 'One house,<br><em>one promise.</em>',
          universText: 'Ste Mondial Parfums was born from a simple conviction: luxury is not about borders, it is about standards. We travel the world to select exceptional fragrances and bring them to Tunisia with service to match — transparent, fast and human.',
          uniAuthTitle: 'Guaranteed authenticity',
          uniAuthText: 'Every bottle is sourced from trusted suppliers. Original, certified, uncompromising.',
          uniShipTitle: '24–48h delivery',
          uniShipText: 'Anywhere in Tunisia, your order arrives at your door carefully wrapped, in record time.',
          uniPayTitle: 'Cash on delivery',
          uniPayText: 'You only pay on receipt of your order. Simple, safe, no advance payment.',
          marq1: 'Delivery across Tunisia',
          marq2: 'Cash on delivery',
          marq3: '100% original fragrances',
          marq4: 'Customer care 7 days a week'
        },
        ar: {
          universEyebrow: 'عالمنا',
          universTitle: 'دار واحدة،<br><em>وعدٌ واحد.</em>',
          universText: 'وُلدت Ste Mondial Parfums من قناعة بسيطة: الفخامة ليست مسألة حدود، بل معايير. نجوب العالم لنتقيّ أجمل العطور، ثم نقدّمها لتونس بخدمة تليق بها — شفافة، سريعة، وإنسانية.',
          uniAuthTitle: 'أصالة مضمونة',
          uniAuthText: 'كل قارورة مختارة من موردين موثوقين. أصلية، موثّقة، بلا أي تنازل.',
          uniShipTitle: 'توصيل خلال 24–48 ساعة',
          uniShipText: 'في كل أنحاء تونس، يصلك طلبك مغلفًا بعناية وفي وقت قياسي.',
          uniPayTitle: 'الدفع عند الاستلام',
          uniPayText: 'لا تدفع إلا عند استلام طلبك. بسيط، آمن، وبدون أي دفعة مسبقة.',
          marq1: 'توصيل إلى كل ولايات تونس',
          marq2: 'الدفع عند الاستلام',
          marq3: 'عطور أصلية 100%',
          marq4: 'خدمة العملاء 7/7'
        }
      };
      Object.keys(EXTRA).forEach(function (l) {
        if (translations[l]) Object.assign(translations[l], EXTRA[l]);
      });
      if (typeof applyTranslations === 'function') applyTranslations();
    }
  } catch (e) { /* index.js not loaded — standalone preview still works */ }

  /* ── 2) REVEAL: own observer as safety net + stagger support ── */
  var revealIO = null;
  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { revealIO.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  /* robustness: if anything is still hidden after 2.5s (e.g. index.js crashed), force-reveal */
  setTimeout(function () {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) el.classList.add('in');
    });
  }, 2500);

  /* ── 3) PRODUCT CARDS: staggered entrance whenever they render ── */
  var grid = document.getElementById('productGrid');
  if (grid && 'MutationObserver' in window) {
    var cardIO = revealIO || null;
    new MutationObserver(function () {
      var cards = grid.querySelectorAll('.product-card:not(.reveal-card)');
      cards.forEach(function (card, i) {
        card.classList.add('reveal-card');
        card.style.setProperty('--rd', (i % 8) * 70 + 'ms');
        if (cardIO) cardIO.observe(card);
        else card.classList.add('in');
      });
    }).observe(grid, { childList: true });
  }

  /* ── 4) HEADER SCROLLED STATE ── */
  var header = document.getElementById('siteHeader') || document.querySelector('header');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('header-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ── 5) BACK TO TOP ── */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 6) CART BADGE PULSE when count changes ── */
  var cartCount = document.getElementById('cartCount');
  if (cartCount && 'MutationObserver' in window) {
    new MutationObserver(function () {
      cartCount.classList.remove('pulse');
      void cartCount.offsetWidth; /* restart animation */
      cartCount.classList.add('pulse');
    }).observe(cartCount, { childList: true, characterData: true, subtree: true });
  }
})();


