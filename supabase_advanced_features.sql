-- Script SQL pour les fonctionnalités Avancées du Back-Office (V2)

-- 1. Ajout du champ is_sponsored à la table profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;

-- 2. Création de la table 'reports' (Signalements) si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason text NOT NULL,
    type text NOT NULL, -- 'product' ou 'vendor'
    status text DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    resolved_at timestamp with time zone,
    resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Activation RLS sur reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs connectés peuvent insérer des signalements
CREATE POLICY "Users can create reports" 
ON public.reports FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Seuls les admins peuvent lire/modifier les signalements
CREATE POLICY "Admins can view and manage reports" 
ON public.reports FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- 3. Insertion des Catégories Dynamiques par défaut dans app_settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
    'dynamic_categories',
    '[
      { "id": "telephones", "label": "Téléphones", "icon": "Smartphone", "subcategories": ["Apple", "Samsung", "Tecno", "Infinix", "Accessoires"] },
      { "id": "ordinateurs", "label": "Ordinateurs", "icon": "Laptop", "subcategories": ["PC Portables", "PC Bureau", "Composants", "Accessoires"] },
      { "id": "vetements_homme", "label": "Vêtements Homme", "icon": "Shirt", "subcategories": ["T-shirts", "Pantalons", "Costumes", "Vestes"] },
      { "id": "vetements_femme", "label": "Vêtements Femme", "icon": "Gem", "subcategories": ["Robes", "Hauts", "Pantalons", "Sacs"] },
      { "id": "chaussures", "label": "Chaussures", "icon": "Footprints", "subcategories": ["Baskets", "Chaussures de ville", "Sandales"] },
      { "id": "montres_bijoux", "label": "Montres & Bijoux", "icon": "Watch", "subcategories": ["Montres Homme", "Montres Femme", "Colliers", "Bagues"] },
      { "id": "electromenager", "label": "Électroménager", "icon": "Tv", "subcategories": ["Réfrigérateurs", "Climatiseurs", "Télévisions", "Micro-ondes"] },
      { "id": "meubles", "label": "Meubles", "icon": "Sofa", "subcategories": ["Salons", "Chambres", "Bureaux"] },
      { "id": "vehicules", "label": "Véhicules", "icon": "Car", "subcategories": ["Voitures", "Motos", "Scooters", "Pièces"] },
      { "id": "immobilier", "label": "Immobilier", "icon": "Home", "subcategories": ["Appartements", "Villas", "Terrains", "Locations"] },
      { "id": "beaute_sante", "label": "Beauté & Santé", "icon": "Heart", "subcategories": ["Parfums", "Maquillage", "Soins"] },
      { "id": "services", "label": "Services", "icon": "Briefcase", "subcategories": ["Réparations", "Plomberie", "Électricité", "Ménage"] }
    ]'::jsonb,
    'Liste dynamique des catégories de la plateforme'
) ON CONFLICT (setting_key) DO NOTHING;

-- 4. Insertion de la Notification Globale par défaut
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
    'global_announcement',
    '{
      "is_active": false,
      "title": "Information Importante",
      "message": "Bienvenue sur Colobane Market !",
      "link_url": "",
      "type": "info"
    }'::jsonb,
    'Notification push globale affichée à tous les utilisateurs'
) ON CONFLICT (setting_key) DO NOTHING;
