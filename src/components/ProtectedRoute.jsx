import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
  const { user } = useAuth();
  const location = useLocation();
  const [checkingAdmin, setCheckingAdmin] = useState(requireAdmin);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      if (!user || !requireAdmin) {
        if (isMounted) setCheckingAdmin(false);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (isMounted) {
          setIsAdmin(!!profile?.is_admin);
        }
      } catch (err) {
        console.error("Admin verification error:", err);
        if (isMounted) setIsAdmin(false);
      } finally {
        if (isMounted) setCheckingAdmin(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [user, requireAdmin]);

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin) {
    if (checkingAdmin) {
      return <PageLoader />;
    }
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
