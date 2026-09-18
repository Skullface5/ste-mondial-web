-- ============================================================================
-- STE MONDIAL — product seed (Lane 1 / Database)
-- 5 human perfumes, audience-segmented (homme/femme/unisexe). Idempotent on sku (upsert).
-- ============================================================================
insert into public.products
  (sku, name_fr, name_en, name_ar, desc_fr, desc_en, desc_ar, audience, price, old_price, image_url, stock, rating, review_count, featured, active)
values
  ('SM-INS-001', 'Oud Wood', 'Oud Wood', 'عود وود',
   'Un oud intense et raffiné, signature d''un luxe oriental intemporel.',
   'Intense, refined oud wood — the signature of timeless oriental luxury.',
   'عود غني وفاخر، توقيع الأناقة الشرقية الخالدة.',
   'unisexe', 49.900, 65.000, NULL, 40, 5.0, 12, true, true),

  ('SM-INS-002', 'J''adore', 'J''adore', 'جادور',
   'Un bouquet floral lumineux et élégant, l''éclat d''une féminité absolue.',
   'A luminous, elegant floral bouquet — the glow of absolute femininity.',
   'باقة زهرية مشرقة وأنيقة تعبّق بالأنوثة الراقية.',
   'femme', 49.900, 65.000, NULL, 35, 5.0, 8, true, true),

  ('SM-INS-003', 'Bleu de Chanel', 'Bleu de Chanel', 'بلو دي شانيل',
   'Une fragrance boisée-aromatique audacieuse, entre élégance et liberté.',
   'A bold woody-aromatic fragrance — elegance and freedom combined.',
   'عطر خشبي عطري جريء يجمع بين الأناقة والحرية.',
   'homme', 49.900, 65.000, NULL, 30, 5.0, 15, true, true),

  ('SM-INS-004', 'Bois de Santal', 'Sandalwood', 'خشب الصندل',
   'La douceur crémeuse du santal, un sillage chaleureux et enveloppant.',
   'The creamy softness of sandalwood — a warm, enveloping trail.',
   'نعومة خشب الصندل الكريمية بأثر دافئ وآسر.',
   'unisexe', 49.900, 65.000, NULL, 25, 4.9, 6, true, true),



  ('SM-MUS-001', 'Musc Blanc', 'White Musk', 'مسك أبيض',
   'La pureté enveloppante du musc blanc, délicatesse absolue.',
   'The enveloping purity of white musk — absolute delicacy.',
   'نقاء المسك الأبيض الفاخر بلمسة ناعمة وجذابة.',
   'unisexe', 20.000, null, NULL, 25, 5.0, 9, false, true)

on conflict (sku) do update set
  name_fr      = excluded.name_fr,
  name_en      = excluded.name_en,
  name_ar      = excluded.name_ar,
  desc_fr      = excluded.desc_fr,
  desc_en      = excluded.desc_en,
  desc_ar      = excluded.desc_ar,
  audience     = excluded.audience,
  price        = excluded.price,
  old_price    = excluded.old_price,
  image_url    = excluded.image_url,
  stock        = excluded.stock,
  rating       = excluded.rating,
  review_count = excluded.review_count,
  featured     = excluded.featured,
  active       = true;

-- sensible default site settings for the shop/admin
insert into public.site_settings (key, value) values
  ('shop_name', '"STE MONDIAL"'::jsonb),
  ('default_language', '"fr"'::jsonb),
  ('whatsapp', '""'::jsonb),
  ('announcement', '"Paiement à la livraison partout en Tunisie"'::jsonb)
on conflict (key) do nothing;
