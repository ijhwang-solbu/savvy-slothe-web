'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AutoLogoutWrapper({ children }) {
  const router = useRouter();
  const timerRef = useRef(null);
  const AUTO_LOGOUT_TIME = 5 * 60 * 60 * 1000; // 5시간

  // ✅ 로그아웃 함수
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    alert('로그아웃되었습니다. 다시 로그인 해주세요.');
    router.push('/login');
  }, [router]);

  // ✅ 타이머 리셋
  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, AUTO_LOGOUT_TIME);
  }, [logout]);

  // ✅ 세션 초기 체크 + 유저 없으면 리다이렉트
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
      }
    };
    checkSession();
  }, [router]);

  // ✅ 세션 변경 감시 (로그아웃, 만료 시 이동)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [router]);

  // ✅ 유저 액션 감시 (자동 로그아웃 타이머)
  useEffect(() => {
    resetTimer();
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  return <>{children}</>;
}
