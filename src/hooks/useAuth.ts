import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

const AUTH_RETURN_PATH_KEY = 'auth_return_path';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && s) {
          const returnPath = localStorage.getItem(AUTH_RETURN_PATH_KEY);
          if (returnPath) {
            localStorage.removeItem(AUTH_RETURN_PATH_KEY);
            window.location.hash = returnPath;
          }
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    localStorage.setItem(AUTH_RETURN_PATH_KEY, window.location.hash || '#/');
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });
  };

  return { user, session, loading, signIn, signUp, signOut, signInWithGoogle };
}
