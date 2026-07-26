-- ==============================================================================
-- SCRIPT SUPABASE : Table buyer_requests pour Wutal Ma (Accessible à tous)
-- ==============================================================================

-- 1. Création de la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.buyer_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    budget BIGINT NOT NULL DEFAULT 0,
    location TEXT NOT NULL DEFAULT 'Dakar',
    contact TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activation du RLS (Row Level Security)
ALTER TABLE public.buyer_requests ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS (Toutes autorisations publiques)
DROP POLICY IF EXISTS "Public select buyer_requests" ON public.buyer_requests;
CREATE POLICY "Public select buyer_requests" 
ON public.buyer_requests FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public insert buyer_requests" ON public.buyer_requests;
CREATE POLICY "Public insert buyer_requests" 
ON public.buyer_requests FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete buyer_requests" ON public.buyer_requests;
CREATE POLICY "Public delete buyer_requests" 
ON public.buyer_requests FOR DELETE 
USING (true);

-- 4. Attribution des droits aux rôles anon et authenticated
GRANT ALL ON public.buyer_requests TO anon;
GRANT ALL ON public.buyer_requests TO authenticated;
GRANT ALL ON public.buyer_requests TO service_role;
