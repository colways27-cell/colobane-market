-- Fonction de réinitialisation de mot de passe par téléphone
-- Vérifie l'identité via le numéro + nom complet uniquement (pas de ville)
-- À exécuter dans Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION reset_password_by_phone(
  p_phone TEXT,
  p_full_name TEXT,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_stored_name TEXT;
BEGIN
  -- Chercher l'utilisateur par numéro de téléphone
  SELECT p.id, p.full_name
  INTO v_user_id, v_stored_name
  FROM profiles p
  WHERE p.whatsapp_number = p_phone OR p.phone_number = p_phone
  LIMIT 1;

  -- Vérifier que le numéro existe
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Aucun compte trouvé avec ce numéro.');
  END IF;

  -- Vérifier le nom complet (insensible à la casse)
  IF LOWER(TRIM(v_stored_name)) != LOWER(TRIM(p_full_name)) THEN
    RETURN json_build_object('success', false, 'message', 'Le nom ne correspond pas à ce compte.');
  END IF;

  -- Vérifier la longueur du mot de passe
  IF LENGTH(p_new_password) < 6 THEN
    RETURN json_build_object('success', false, 'message', 'Le mot de passe doit contenir au moins 6 caractères.');
  END IF;

  -- Mettre à jour le mot de passe dans auth.users
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'message', 'Mot de passe réinitialisé avec succès !');
END;
$$;
