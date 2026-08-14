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
        const currentSessionUser = data?.session?.user ?? null;

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
