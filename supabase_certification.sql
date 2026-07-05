-- Table pour stocker les demandes de certification
CREATE TABLE IF NOT EXISTS public.certification_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  boutique_name text NOT NULL,
  owner_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  activity text NOT NULL,
  photo_boutique_url text,
  photo_identity_url text,
  photo_selfie_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.certification_requests ENABLE ROW LEVEL SECURITY;

-- Politique : l'utilisateur peut voir et créer ses propres demandes
DROP POLICY IF EXISTS "Users can insert own certification requests" ON public.certification_requests;
CREATE POLICY "Users can insert own certification requests" ON public.certification_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own certification requests" ON public.certification_requests;
CREATE POLICY "Users can view own certification requests" ON public.certification_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Politiques administrateur : voir et mettre à jour toutes les demandes
DROP POLICY IF EXISTS "Admins can view all certification requests" ON public.certification_requests;
CREATE POLICY "Admins can view all certification requests" ON public.certification_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update certification requests" ON public.certification_requests;
CREATE POLICY "Admins can update certification requests" ON public.certification_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Bucket de stockage pour les photos (à créer dans Supabase Storage)
-- Nom du bucket : certification-requests
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certification-requests', 'certification-requests', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Politiques de stockage pour le bucket
DROP POLICY IF EXISTS "Certification images are publicly accessible." ON storage.objects;
CREATE POLICY "Certification images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'certification-requests');

DROP POLICY IF EXISTS "Authenticated users can upload certification images." ON storage.objects;
CREATE POLICY "Authenticated users can upload certification images." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'certification-requests' and auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own certification images." ON storage.objects;
CREATE POLICY "Users can update their own certification images." ON storage.objects
  FOR UPDATE USING (bucket_id = 'certification-requests' and auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their own certification images." ON storage.objects;
CREATE POLICY "Users can delete their own certification images." ON storage.objects
  FOR DELETE USING (bucket_id = 'certification-requests' and auth.uid() = owner);
