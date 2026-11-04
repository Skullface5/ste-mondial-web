-- OPTIONAL cleanup for the removed SKU feature. NOT required.
-- The shop works fine with the products.sku column still present; it is simply
-- unused by the admin and the storefront after this change. Run this ONLY if you
-- want to remove the now-dead column. Nothing here is executed automatically.
alter table public.products drop column if exists sku;
