-- Migration : Créer la fonction RPC increment_views pour un incrément atomique des vues
-- Exécuter ce SQL dans le dashboard Supabase (SQL Editor)

CREATE OR REPLACE FUNCTION increment_views(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autoriser les utilisateurs anonymes à appeler cette fonction
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_views(UUID) TO authenticated;
