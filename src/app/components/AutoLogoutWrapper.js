'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AutoLogoutWrapper({ children }) {
  const router = useRouter();
  const timerRef = useRef(null);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    alert('5시간 동안 활동이 없어 자동 로그아웃되었습니다.');
    router.push('/login');
  }, [router]);

  const resetTimer = useCallback(() => {
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(logout, 5 * 60 * 60 * 1000); // 5시간
}, [logout]);

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
