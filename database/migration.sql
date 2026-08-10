-- Migration Script: Hybride Model Update

-- 1. Mettre à jour la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'particulier',
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS boutique_name text,
ADD COLUMN IF NOT EXISTS boutique_description text,
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS business_hours text;

-- 2. Mettre à jour la table products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_boosted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;

-- 3. Mettre à jour les buckets (si les boutiques ont besoin d'uploader des bannières)
insert into storage.buckets (id, name, public) 
values ('boutiques', 'boutiques', true)
on conflict do nothing;

create policy "Boutique images are publicly accessible." on storage.objects
  for select using (bucket_id = 'boutiques');

create policy "Authenticated users can upload boutique images." on storage.objects
  for insert with check (bucket_id = 'boutiques' and auth.role() = 'authenticated');

create policy "Users can update their own boutique images." on storage.objects
  for update using (bucket_id = 'boutiques' and auth.uid() = owner);
