-- Drop the ratings/reviews feature (safe: reviews table has 0 rows).
drop table if exists public.reviews;
alter table public.products drop column if exists rating;
alter table public.products drop column if exists review_count;
