-- ═══════════════════════════════════════════════════════════════════════════
-- Auto-expiration des Boosts Produits
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Fonction qui désactive les boosts expirés
CREATE OR REPLACE FUNCTION expire_product_boosts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET is_boosted = false,
      boost_end_date = NULL
  WHERE is_boosted = true
    AND boost_end_date IS NOT NULL
    AND boost_end_date < NOW();
    
  RAISE NOTICE 'Boosts expirés désactivés à %', NOW();
END;
$$;

-- 2. Activer l'extension pg_cron (si pas déjà activée)
-- IMPORTANT : A faire UNE SEULE FOIS dans Supabase Dashboard > Database > Extensions
-- Chercher "pg_cron" et activer

-- 3. Planifier le job toutes les heures
-- (décommenter et exécuter après avoir activé pg_cron)
/*
SELECT cron.schedule(
  'expire-product-boosts',     -- nom du job
  '0 * * * *',                  -- chaque heure (minute 0)
  $$SELECT expire_product_boosts()$$
);
*/

-- 4. Pour vérifier les jobs planifiés :
-- SELECT * FROM cron.job;

-- 5. Pour supprimer le job si besoin :
-- SELECT cron.unschedule('expire-product-boosts');

-- ═══════════════════════════════════════════════════════════════════════════
-- Test manuel : exécuter la fonction immédiatement
-- SELECT expire_product_boosts();
-- ═══════════════════════════════════════════════════════════════════════════

-- 6. Vue utile : voir les boosts et leur statut
CREATE OR REPLACE VIEW boosts_status AS
SELECT
  p.id,
  p.title,
  p.is_boosted,
  p.boost_end_date,
  CASE
    WHEN p.boost_end_date IS NULL THEN 'permanent'
    WHEN p.boost_end_date < NOW() THEN 'expiré'
    ELSE 'actif'
  END AS statut,
  EXTRACT(EPOCH FROM (p.boost_end_date - NOW())) / 3600 AS heures_restantes,
  pr.full_name AS vendeur,
  pr.phone_number
FROM products p
LEFT JOIN profiles pr ON p.seller_id = pr.id
WHERE p.is_boosted = true
ORDER BY p.boost_end_date ASC;

-- Pour consulter : SELECT * FROM boosts_status;
