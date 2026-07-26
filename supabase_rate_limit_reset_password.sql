-- ==============================================================================
-- RATE LIMITING ON PASSWORD RESET (reset_password_by_phone)
-- Max 3 attempts per phone number per hour
-- ==============================================================================

-- 1. Create table to store password reset attempts
CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by phone and attempted_at timestamp
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_phone_time 
ON public.password_reset_attempts(phone, attempted_at);

-- Enable RLS
ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Service role / authenticated users policy
CREATE POLICY "Allow system insert on password_reset_attempts" 
ON public.password_reset_attempts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow system select on password_reset_attempts" 
ON public.password_reset_attempts FOR SELECT USING (true);


-- 2. RPC function reset_password_by_phone with rate limiting
CREATE OR REPLACE FUNCTION public.reset_password_by_phone(
    p_phone TEXT,
    p_full_name TEXT,
    p_new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempts INT;
    v_user_id UUID;
BEGIN
    -- Check rate limiting: max 3 attempts per phone number in the last 1 hour
    SELECT COUNT(*) INTO v_attempts
    FROM public.password_reset_attempts
    WHERE phone = p_phone
      AND attempted_at >= NOW() - INTERVAL '1 hour';

    IF v_attempts >= 3 THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Trop de tentatives de réinitialisation pour ce numéro (max 3 par heure). Veuillez réespérer 1 heure.'
        );
    END IF;

    -- Record attempt in password_reset_attempts
    INSERT INTO public.password_reset_attempts (phone, attempted_at)
    VALUES (p_phone, NOW());

    -- Verify identity (match phone and full name)
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE (phone_number = p_phone OR whatsapp_number = p_phone)
      AND LOWER(TRIM(full_name)) = LOWER(TRIM(p_full_name))
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Numéro de téléphone ou nom complet incorrect.'
        );
    END IF;

    -- Update encrypted password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Mot de passe réinitialisé avec succès !'
    );
END;
$$;
