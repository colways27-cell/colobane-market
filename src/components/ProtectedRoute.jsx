import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '3px solid #F1F5F9',
      borderTop: '3px solid var(--primary, #8a1c1c)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checkingAdmin, setCheckingAdmin] = useState(requireAdmin);
  const [isAdmin, setIsAdmin] = useState(false);

  // Admin Login Form state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      if (!user || !requireAdmin) {
        if (isMounted) setCheckingAdmin(false);
        return;
      }
      try {
        // Vérification admin UNIQUEMENT via le champ is_admin en base de données
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted) {
          setIsAdmin(!!profile?.is_admin);
        }
      } catch (err) {
        console.error("Admin verification error:", err);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) setCheckingAdmin(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [user, requireAdmin]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error('Veuillez entrer votre numéro et mot de passe');
      return;
    }
    setLoggingIn(true);
    toast.loading('Vérification des identifiants...', { id: 'admin-login' });
    try {
      // Formater le numéro de téléphone
      const digits = phone.replace(/\s+/g, '').replace(/^0+/, '');
      const formattedPhone = phone.startsWith('+') ? phone : `+221${digits}`;
      const fakeEmail = `${formattedPhone.replace('+', '')}@colobanemarket.local`;

      // Tenter la connexion avec le numéro de téléphone
      let loginRes = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password.trim()
      });

      // Fallback : chercher l'email réel dans les profils
      if (loginRes.error) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .or(`whatsapp_number.eq.${formattedPhone},phone_number.eq.${formattedPhone}`)
          .limit(1);

        if (profiles && profiles.length > 0 && profiles[0].email && !profiles[0].email.endsWith('@colobanemarket.local')) {
          loginRes = await supabase.auth.signInWithPassword({
            email: profiles[0].email,
            password: password.trim()
          });
        }
      }

      if (loginRes.error && !loginRes.data?.user) {
        throw loginRes.error;
      }

      const loggedUser = loginRes.data?.user;

      if (loggedUser) {
        // Vérifier les droits admin en base de données
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', loggedUser.id)
          .maybeSingle();

        if (profile?.is_admin) {
          toast.success('Bienvenue dans le Back-Office Admin ! 🎉', { id: 'admin-login' });
          setIsAdmin(true);
        } else {
          // Déconnecter immédiatement si pas admin
          await supabase.auth.signOut();
          toast.error("Ce compte n'a pas les droits administrateur.", { id: 'admin-login' });
        }
      } else {
        toast.error('Identifiants incorrects.', { id: 'admin-login' });
      }
    } catch (err) {
      console.error(err);
      const msg = err.message?.includes('Invalid login credentials')
        ? 'Numéro ou mot de passe incorrect.'
        : (err.message || 'Identifiants incorrects');
      toast.error(msg, { id: 'admin-login' });
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSwitchAccount = async () => {
    await signOut();
    navigate('/auth');
  };

  // Wait for initial session restoration before deciding redirects
  if (authLoading) {
    return <PageLoader />;
  }

  // Standard non-admin protection: redirect to /auth
  if (!requireAdmin && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin route protection
  if (requireAdmin) {
    if (checkingAdmin) {
      return <PageLoader />;
    }

    // Unauthenticated Admin Access — Login Form
    if (!user) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#FFF1F2',
              color: '#E11D48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              🛡️
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>
              Colobane Admin
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5' }}>
              Connectez-vous avec votre numéro de téléphone et mot de passe administrateur.
            </p>

            <form onSubmit={handleAdminLogin} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Numéro de téléphone</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '12px 10px', background: '#F1F5F9', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>🇸🇳 +221</span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '12px',
                  background: 'var(--primary, #8a1c1c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: loggingIn ? 'wait' : 'pointer'
                }}
              >
                {loggingIn ? 'Connexion en cours...' : 'Se connecter au Back-Office 🔐'}
              </button>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
              >
                ← Retour au site public
              </button>
            </div>
          </div>
        </div>
      );
    }

    // User is Logged In BUT Not Admin
    if (!isAdmin) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 16px'
            }}>
              ⛔
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 900, color: '#0F172A' }}>
              Accès Administrateur Restreint
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#64748B', lineHeight: '1.5' }}>
              Ce compte ne possède pas les droits d'accès au Back-Office Admin.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleSwitchAccount}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--primary, #8a1c1c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🔑 Changer de compte
              </button>

              <button
                onClick={() => navigate('/')}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🏠 Retour au site Colobane Market
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
