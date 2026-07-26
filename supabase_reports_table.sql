-- ==============================================================================
-- TABLE REPORTS (SYSTEME DE SIGNALEMENT DISCRET)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'product', -- 'product' ou 'vendor'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par statut et produit/vendeur
CREATE INDEX IF NOT EXISTS idx_reports_product_id ON public.reports(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_seller_id ON public.reports(seller_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- Activer RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : Tout utilisateur peut insérer un signalement
CREATE POLICY "Allow public insert on reports" 
ON public.reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public select on reports" 
ON public.reports FOR SELECT USING (true);

CREATE POLICY "Allow public update on reports" 
ON public.reports FOR UPDATE USING (true);
