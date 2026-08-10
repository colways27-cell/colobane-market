-- ColobaneMarket Supabase Schema

-- 1. Create a table for User Profiles
create table public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  phone_number text,
  whatsapp_number text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security for profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- 2. Create a table for Products (Annonces)
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  price numeric not null,
  currency text default 'FCFA',
  negotiable boolean default false,
  category text not null,
  subcategory text,
  condition text,
  location text not null,
  images text[] default '{}',
  metadata jsonb default '{}'::jsonb, -- To store flexible attributes like size, brand, etc.
  status text default 'available', -- 'available', 'sold', 'hidden'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Row Level Security for products
alter table public.products enable row level security;

-- Policies for products
create policy "Products are viewable by everyone." on public.products
  for select using (true);

create policy "Authenticated users can insert products" on public.products
  for insert with check (auth.role() = 'authenticated');

create policy "Users can update their own products." on public.products
  for update using (auth.uid() = seller_id);

create policy "Users can delete their own products." on public.products
  for delete using (auth.uid() = seller_id);

-- 3. Set up Storage for product images
insert into storage.buckets (id, name, public) values ('products', 'products', true);

create policy "Product images are publicly accessible." on storage.objects
  for select using (bucket_id = 'products');

create policy "Authenticated users can upload images." on storage.objects
  for insert with check (bucket_id = 'products' and auth.role() = 'authenticated');

create policy "Users can update their own images." on storage.objects
  for update using (bucket_id = 'products' and auth.uid() = owner);

create policy "Users can delete their own images." on storage.objects
  for delete using (bucket_id = 'products' and auth.uid() = owner);
