-- ============================================================
-- Thamani - Initial Schema
-- Run this in Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type retailer_name as enum ('jumia', 'kilimall', 'jiji');
create type alert_type as enum ('price_drop', 'back_in_stock', 'any_change');

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with app-specific data
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  currency      text not null default 'KES',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================

create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  parent_id   uuid references categories(id) on delete set null,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- RETAILERS
-- ============================================================

create table retailers (
  id          uuid primary key default uuid_generate_v4(),
  name        retailer_name not null unique,
  display_name text not null,
  website_url text not null,
  logo_url    text,
  country     text not null default 'KE',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Seed retailers
insert into retailers (name, display_name, website_url) values
  ('jumia',    'Jumia Kenya',   'https://www.jumia.co.ke'),
  ('kilimall', 'Kilimall',      'https://www.kilimall.co.ke'),
  ('jiji',     'Jiji Kenya',    'https://jiji.co.ke');

-- ============================================================
-- PRODUCTS
-- ============================================================

create table products (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text,
  brand         text,
  model         text,
  category_id   uuid references categories(id) on delete set null,
  image_url     text,
  specs         jsonb default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index products_name_idx on products using gin(to_tsvector('english', name));
create index products_category_idx on products(category_id);

-- ============================================================
-- PRODUCT_RETAILERS
-- Junction: one product listed at multiple retailers
-- ============================================================

create table product_retailers (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null references products(id) on delete cascade,
  retailer_id         uuid not null references retailers(id) on delete cascade,
  retailer_product_url text not null,
  current_price       numeric(12, 2),
  original_price      numeric(12, 2),
  is_in_stock         boolean not null default true,
  is_on_sale          boolean not null default false,
  last_scraped_at     timestamptz,
  scrape_error        text,
  scrape_count        integer not null default 0,
  is_scrapable        boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (product_id, retailer_id)
);

create index product_retailers_product_idx on product_retailers(product_id);
create index product_retailers_retailer_idx on product_retailers(retailer_id);
create index product_retailers_last_scraped_idx on product_retailers(last_scraped_at);

-- ============================================================
-- PRICE_HISTORY
-- One row per price change event
-- ============================================================

create table price_history (
  id                  uuid primary key default uuid_generate_v4(),
  product_retailer_id uuid not null references product_retailers(id) on delete cascade,
  price               numeric(12, 2) not null,
  original_price      numeric(12, 2),
  is_on_sale          boolean not null default false,
  recorded_at         timestamptz not null default now()
);

create index price_history_product_retailer_idx on price_history(product_retailer_id);
create index price_history_recorded_at_idx on price_history(recorded_at desc);

-- ============================================================
-- USER_TRACKED_PRODUCTS
-- Products a user is watching
-- ============================================================

create table user_tracked_products (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  product_id          uuid not null references products(id) on delete cascade,
  target_price        numeric(12, 2),
  alert_type          alert_type not null default 'price_drop',
  is_active           boolean not null default true,
  last_notified_at    timestamptz,
  created_at          timestamptz not null default now(),
  unique (user_id, product_id)
);

create index user_tracked_products_user_idx on user_tracked_products(user_id);

-- ============================================================
-- WISHLISTS
-- ============================================================

create table wishlists (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'My Wishlist',
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table wishlist_items (
  id          uuid primary key default uuid_generate_v4(),
  wishlist_id uuid not null references wishlists(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  added_at    timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles: users can only read/update their own
alter table profiles enable row level security;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Products, categories, retailers: public read
alter table products enable row level security;
create policy "products_public_read" on products for select using (true);

alter table categories enable row level security;
create policy "categories_public_read" on categories for select using (true);

alter table retailers enable row level security;
create policy "retailers_public_read" on retailers for select using (true);

alter table product_retailers enable row level security;
create policy "product_retailers_public_read" on product_retailers for select using (true);

alter table price_history enable row level security;
create policy "price_history_public_read" on price_history for select using (true);

-- Tracked products: private to owner
alter table user_tracked_products enable row level security;
create policy "tracked_select_own" on user_tracked_products for select using (auth.uid() = user_id);
create policy "tracked_insert_own" on user_tracked_products for insert with check (auth.uid() = user_id);
create policy "tracked_update_own" on user_tracked_products for update using (auth.uid() = user_id);
create policy "tracked_delete_own" on user_tracked_products for delete using (auth.uid() = user_id);

-- Wishlists: owner sees all; others see public
alter table wishlists enable row level security;
create policy "wishlists_select" on wishlists for select using (auth.uid() = user_id or is_public = true);
create policy "wishlists_insert_own" on wishlists for insert with check (auth.uid() = user_id);
create policy "wishlists_update_own" on wishlists for update using (auth.uid() = user_id);
create policy "wishlists_delete_own" on wishlists for delete using (auth.uid() = user_id);

alter table wishlist_items enable row level security;
create policy "wishlist_items_select" on wishlist_items for select
  using (exists (
    select 1 from wishlists w
    where w.id = wishlist_id and (w.user_id = auth.uid() or w.is_public = true)
  ));
create policy "wishlist_items_modify_own" on wishlist_items for all
  using (exists (
    select 1 from wishlists w
    where w.id = wishlist_id and w.user_id = auth.uid()
  ));

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_products_updated_at
  before update on products
  for each row execute procedure set_updated_at();

create trigger set_product_retailers_updated_at
  before update on product_retailers
  for each row execute procedure set_updated_at();

create trigger set_profiles_updated_at
  before update on profiles
  for each row execute procedure set_updated_at();