create table if not exists public.umkm_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.umkm_admins enable row level security;
revoke all on public.umkm_admins from anon, authenticated;

create table if not exists public.umkm_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  category text not null check (char_length(category) between 1 and 60),
  price bigint not null check (price >= 0),
  description text not null check (char_length(description) between 1 and 3000),
  image_url text not null default '',
  stock integer not null default 0 check (stock >= 0),
  whatsapp text not null check (whatsapp ~ '^[0-9]{9,15}$'),
  delivery_info text not null default '' check (char_length(delivery_info) <= 240),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists umkm_products_active_created_idx
  on public.umkm_products (is_active, created_at desc);

alter table public.umkm_products enable row level security;
grant select on public.umkm_products to anon, authenticated;
grant insert, update, delete on public.umkm_products to authenticated;

create or replace function public.is_umkm_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.umkm_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_umkm_admin() from public;
grant execute on function public.is_umkm_admin() to authenticated;

drop policy if exists "Anyone can read active UMKM products" on public.umkm_products;
drop policy if exists "Public can read active UMKM products" on public.umkm_products;
create policy "Public can read active UMKM products"
  on public.umkm_products for select
  to anon
  using (is_active = true);

drop policy if exists "UMKM admins can read all products" on public.umkm_products;
create policy "UMKM admins can read all products"
  on public.umkm_products for select
  to authenticated
  using (is_active = true or (select public.is_umkm_admin()));

drop policy if exists "UMKM admins can insert products" on public.umkm_products;
create policy "UMKM admins can insert products"
  on public.umkm_products for insert
  to authenticated
  with check ((select public.is_umkm_admin()));

drop policy if exists "UMKM admins can update products" on public.umkm_products;
create policy "UMKM admins can update products"
  on public.umkm_products for update
  to authenticated
  using ((select public.is_umkm_admin()))
  with check ((select public.is_umkm_admin()));

drop policy if exists "UMKM admins can delete products" on public.umkm_products;
create policy "UMKM admins can delete products"
  on public.umkm_products for delete
  to authenticated
  using ((select public.is_umkm_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('umkm-products', 'umkm-products', true, 2097152, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view UMKM product photos" on storage.objects;
create policy "Anyone can view UMKM product photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'umkm-products');

drop policy if exists "UMKM admins can upload product photos" on storage.objects;
create policy "UMKM admins can upload product photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'umkm-products' and (select public.is_umkm_admin()));

drop policy if exists "UMKM admins can update product photos" on storage.objects;
create policy "UMKM admins can update product photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'umkm-products' and (select public.is_umkm_admin()))
  with check (bucket_id = 'umkm-products' and (select public.is_umkm_admin()));

drop policy if exists "UMKM admins can delete product photos" on storage.objects;
create policy "UMKM admins can delete product photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'umkm-products' and (select public.is_umkm_admin()));
