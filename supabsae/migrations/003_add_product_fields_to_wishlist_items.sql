-- ============================================================
-- Thamani - Add Product Fields to Wishlist Items
-- For storing scraped products directly in wishlist
-- ============================================================

alter table wishlist_items 
add column if not exists product_name text,
add column if not exists product_url text,
add column if not exists product_image_url text,
add column if not exists product_price numeric(12, 2),
add column if not exists retailer retailer_name;

-- Make product_id optional
alter table wishlist_items alter column product_id drop not null;
