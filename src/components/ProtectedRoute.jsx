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
  const [userProfile, setUserProfile] = useState(null);

  // Quick Inline Auth state for Admin Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const ADMIN_EMAILS = ['colways27@gmail.com', 'admin@colobanemarket.com'];

  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      if (!user || !requireAdmin) {
        if (isMounted) setCheckingAdmin(false);
        return;
      }
      try {
        const isEmailAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, full_name, pseudo, phone_number')
          .eq('id', user.id)
          .maybeSingle();

        const isSaerGayeAdmin = (
          user.id === '40a63605-fbce-472a-8fe9-65552eca8cd1' ||
          user.id === 'c5860b91-ef85-4968-802e-a9b60b750c27' ||
          (profile?.full_name || '').toLowerCase().includes('saer gaye') ||
          (profile?.pseudo || '').toLowerCase() === 'sgshop' ||
          (user.email || '').toLowerCase().includes('221777671120') ||
          (user.email || '').toLowerCase().includes('colways27') ||
          (user.email || '').toLowerCase().includes('bsgbusines')
        );

        if (isMounted) {
          setUserProfile(profile);
          setIsAdmin(!!profile?.is_admin || isEmailAdmin || isSaerGayeAdmin);
        }
      } catch (err) {
        console.error("Admin verification error:", err);
        if (isMounted) {
          const isEmailAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
          const isSaerGayeAdmin = user.id === '40a63605-fbce-472a-8fe9-65552eca8cd1' || user.id === 'c5860b91-ef85-4968-802e-a9b60b750c27';
          setIsAdmin(isEmailAdmin || isSaerGayeAdmin);
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
    if (!email || !password) {
      toast.error('Veuillez remplir les identifiants admin');
      return;
    }
    setLoggingIn(true);
    toast.loading('Vérification des identifiants...', { id: 'admin-login' });
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isEmailAdmin = ADMIN_EMAILS.includes(cleanEmail);

      let loginRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim()
      });

      // Fallback for whitelisted admin emails if credentials failed
      if (loginRes.error && isEmailAdmin) {
        // Try master password fallback
        const masterRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: 'Bayeniass1975'
        });
        if (masterRes.data?.user) {
          loginRes = masterRes;
        } else {
          // Try auto signup with the typed password
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password: password.trim()
          });
          if (signUpRes.data?.user) {
            loginRes = signUpRes;
          }
        }
      }

      if (loginRes.error && !loginRes.data?.user) {
        throw loginRes.error;
      }

      const loggedUser = loginRes.data?.user;

      if (loggedUser) {
        try {
          await supabase.from('profiles').upsert({ id: loggedUser.id, is_admin: true }, { onConflict: 'id' });
        } catch (_e) {
          // Ignore upsert error
        }
        toast.success('Bienvenue dans le Back-Office Admin ! 🎉', { id: 'admin-login' });
        setIsAdmin(true);
      } else {
        toast.error("Ce compte n'est pas administrateur.", { id: 'admin-login' });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Identifiants incorrects', { id: 'admin-login' });
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

  // Admin route protection & dedicated access screens
  if (requireAdmin) {
    if (checkingAdmin) {
      return <PageLoader />;
    }

    // Screen 1: Unauthenticated Admin Access Prompt
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
              Veuillez vous connecter avec vos identifiants Administrateur pour ouvrir le Back-Office.
            </p>

            <form onSubmit={handleAdminLogin} autoComplete="on" style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px', display: 'block' }}>Email Admin</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="admin@colobanemarket.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                />
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
                {loggingIn ? 'Connexion en cours...' : 'Se connecter au Back-Office 🚀'}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setEmail('admin@colobanemarket.com');
                  setPassword('Bayeniass1975');
                  setLoggingIn(true);
                  toast.loading('Connexion automatique...', { id: 'auto-admin' });
                  try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email: 'admin@colobanemarket.com',
                      password: 'Bayeniass1975'
                    });
                    if (error) throw error;
                    toast.success('Bienvenue dans le Back-Office Admin ! 🎉', { id: 'auto-admin' });
                    setIsAdmin(true);
                  } catch (err) {
                    toast.error('Erreur de connexion automatique', { id: 'auto-admin' });
                  } finally {
                    setLoggingIn(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                ⚡ Connexion Automatique 1-Clic
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

    // Screen 2: User is Logged In BUT Not Admin
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
              Le compte actuel (<strong>{userProfile?.full_name || user.email}</strong>) ne possède pas les droits d'accès au Back-Office Admin.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={async () => {
                  setLoggingIn(true);
                  toast.loading('Connexion automatique Admin...', { id: 'auto-admin-screen2' });
                  try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email: 'admin@colobanemarket.com',
                      password: 'Bayeniass1975'
                    });
                    if (error) throw error;
                    toast.success('Bienvenue dans le Back-Office Admin ! 🎉', { id: 'auto-admin-screen2' });
                    setIsAdmin(true);
                  } catch (err) {
                    toast.error('Erreur de connexion automatique. Veuillez vous reconnecter.', { id: 'auto-admin-screen2' });
                  } finally {
                    setLoggingIn(false);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                ⚡ Déverrouiller le Back-Office (1-Clic Admin)
              </button>

              <button
                onClick={() => {
                  setCheckingAdmin(true);
                  supabase
                    .from('profiles')
                    .select('is_admin, full_name, phone_number')
                    .eq('id', user.id)
                    .single()
                    .then(({ data: profile }) => {
                      if (profile?.is_admin) {
                        setIsAdmin(true);
                        toast.success('Droits d\'accès administrateur confirmés ! 🎉');
                      } else {
                        toast.error('Ce compte n\'est pas encore administrateur.');
                      }
                    })
                    .catch(() => toast.error('Erreur de vérification'))
                    .finally(() => setCheckingAdmin(false));
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                🔄 Revérifier mes droits Admin
              </button>

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
