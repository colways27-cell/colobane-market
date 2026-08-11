import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        let currentSessionUser = data?.session?.user ?? null;

        // Auto Silent Re-authentication fallback if session is empty but remembered credentials exist
        if (!currentSessionUser) {
          try {
            const rememberedRaw = localStorage.getItem('colobane_remembered_user');
            if (rememberedRaw) {
              const remembered = JSON.parse(rememberedRaw);
              if (remembered?.phone && remembered?.password) {
                const digits = (remembered.phone || '').replace(/\s+/g, '').replace(/^0+/, '');
                const formattedPhone = (remembered.phone || '').startsWith('+') ? remembered.phone : `+221${digits}`;
                const fakeEmail = `${formattedPhone.replace('+', '')}@colobanemarket.local`;

                const res = await supabase.auth.signInWithPassword({
                  email: fakeEmail,
                  password: remembered.password
                });
                if (res.data?.user) {
                  currentSessionUser = res.data.user;
                }
              }
            }
          } catch (autoLoginErr) {
            console.warn("Auto-relogin fallback silent warning:", autoLoginErr);
          }
        }

        if (mounted) {
          setUser(currentSessionUser);
        }
      } catch (err) {
        console.warn("Auth getSession warning:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });
      subscription = data?.subscription;
    } catch (e) {
      console.warn("Auth listener error:", e);
    }

    return () => {
      mounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    signOut: () => {
      try {
        localStorage.removeItem('colobane_remembered_user');
      } catch (_e) {}
      return supabase.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

