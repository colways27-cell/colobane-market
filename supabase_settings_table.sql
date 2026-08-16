-- Création de la table pour les paramètres dynamiques de l'application
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Activation de RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
-- Tout le monde peut lire les paramètres (pour afficher la bannière côté client par exemple)
CREATE POLICY "Allow public read access to app_settings"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- Seuls les administrateurs peuvent modifier les paramètres
CREATE POLICY "Allow admin to update app_settings"
  ON public.app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insertion des valeurs par défaut pour les forfaits (Plans)
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'pricing_plans',
  '{
    "boost_product_1j": { "price": 500, "duration_days": 1, "ads_count": 1, "label": "1 Annonce - 24H" },
    "boost_product_7j": { "price": 1500, "duration_days": 7, "ads_count": 2, "label": "2 Annonces - 1 Semaine" },
    "boost_product_30j": { "price": 5000, "duration_days": 30, "ads_count": 5, "label": "5 Annonces - 1 Mois" },
    "boost_product_12_30j": { "price": 10000, "duration_days": 30, "ads_count": 12, "label": "12 Annonces - 1 Mois" },
    "forfait_boutique": { "price": 5000, "duration_days": 30, "label": "Boutique Pro (1 Mois)" },
    "forfait_premium": { "price": 10000, "duration_days": 30, "ads_count": 5, "label": "Boutique Premium + 5 Boosts (1 Mois)" },
    "boost_reel_7j": { "price": 1500, "duration_days": 7, "ads_count": 1, "label": "Reel en page d''accueil (7 Jours)" },
    "Certification": { "price": 1500, "label": "Badge Vendeur Certifié" }
  }',
  'Configuration des prix et des forfaits'
) ON CONFLICT (setting_key) DO NOTHING;

-- Insertion de la bannière promotionnelle par défaut
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'promo_banner',
  '{
    "is_active": false,
    "message": "🎉 Promo Spéciale : -50% sur tous les boosts ce week-end !",
    "bg_color": "#DC2626",
    "text_color": "#FFFFFF",
    "link_url": ""
  }',
  'Bannière promotionnelle affichée en haut de l''application'
) ON CONFLICT (setting_key) DO NOTHING;
