"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session, AuthApiError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useRouter } from 'next/navigation';
import { alert } from '@/lib/alerts';
import { buildAppUrl } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  syncProfileFromUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  }, []);

  const syncProfileFromUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;
    if (!currentUser) return;

    const fullName =
      (currentUser.user_metadata as any)?.full_name ||
      (currentUser.user_metadata as any)?.name ||
      currentUser.email?.split('@')[0] ||
      'ผู้ใช้';

    const avatarUrl =
      (currentUser.user_metadata as any)?.avatar_url ||
      (currentUser.user_metadata as any)?.picture ||
      null;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        full_name: fullName,
        avatar_url: avatarUrl,
      });

    if (error) {
      console.error('syncProfileFromUser error:', error);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      let duplicateEmailExists = false;
      let duplicateCheckAvailable = true;
      try {
        const { data, error } = await supabase.rpc('email_exists', {
          target_email: normalizedEmail,
        });
        if (error) {
          duplicateCheckAvailable = false;
          console.warn('[signUp] email_exists RPC unavailable', error.message);
        } else {
          duplicateEmailExists = Boolean(data);
        }
      } catch (rpcError: any) {
        duplicateCheckAvailable = false;
        console.warn('[signUp] email_exists RPC threw', rpcError?.message ?? rpcError);
      }

      if (duplicateEmailExists) {
        alert.error('คุณเคยใช้บัญชีนี้สมัครแล้ว', {
          description: 'กรุณาเข้าสู่ระบบ หรือกด “ลืมรหัสผ่าน” เพื่อรับลิงก์รีเซ็ต',
        });
        return { error: new Error('EMAIL_ALREADY_REGISTERED') };
      }

      if (!duplicateCheckAvailable) {
        console.info('[signUp] Skipping duplicate pre-check because RPC is missing or failed.');
      }

      const redirectUrl = buildAppUrl('/login');

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName || normalizedEmail
          }
        }
      });

      if (error) {
        // If the email is already registered, stop immediately and show a SweetAlert error.
        const msg = error.message || '';
        if (
          msg.includes('User already registered') ||
          msg.toLowerCase().includes('already registered') ||
          (error.status === 400 && msg)
        ) {
          alert.error('อีเมลนี้ถูกใช้งานแล้ว', {
            description: 'บัญชีนี้ถูกลงทะเบียนไว้แล้ว กรุณาเข้าสู่ระบบหรือใช้ฟีเจอร์ “ลืมรหัสผ่าน”',
          });
          return { error: new Error('EMAIL_ALREADY_REGISTERED') };
        }

        throw error;
      }

      if (data.session) {
        await supabase.auth.signOut();
      }

      alert.success('ยืนยันอีเมลก่อนเริ่มใช้งาน', {
        description: `เราได้ส่งลิงก์ยืนยันไปที่ ${normalizedEmail} กรุณากดลิงก์ในอีเมลก่อนเข้าสู่ระบบครั้งแรก`
      });
      return { error: null };
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error('EMAIL_NOT_CONFIRMED');
      }

      alert.success('เข้าสู่ระบบสำเร็จ!', {
        description: 'ยินดีต้อนรับกลับ'
      });

      await syncProfileFromUser();

      router.push('/');
      return { error: null };
    } catch (error: any) {
      let description = error.message;

      if (error.message === 'EMAIL_NOT_CONFIRMED') {
        description = 'โปรดยืนยันอีเมลในกล่องจดหมายก่อนเข้าสู่ระบบ';
      } else if (error instanceof AuthApiError && error.status === 400) {
        description = 'ไม่พบบัญชีนี้หรือรหัสผ่านไม่ถูกต้อง กรุณาสมัครสมาชิกใหม่ก่อน';
      }

      alert.error('เข้าสู่ระบบไม่สำเร็จ', {
        description,
      });

      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      alert.success('ออกจากระบบสำเร็จ');
      router.push('/');
    } catch (error: any) {
      alert.error('เกิดข้อผิดพลาด', {
        description: error.message
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, refreshUser, syncProfileFromUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
