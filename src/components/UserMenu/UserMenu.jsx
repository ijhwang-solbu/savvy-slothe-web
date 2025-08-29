// src/components/UserMenu.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import styles from './UserMenu.module.css';

// 필요 시 환경변수 혹은 공용 클라이언트를 사용하세요.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 단순 햄버거 아이콘
function HamburgerIcon({ size = 24, stroke = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' role='img' aria-label='Menu' fill='none' stroke={stroke} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
      <line x1='4' y1='6' x2='20' y2='6' />
      <line x1='4' y1='12' x2='20' y2='12' />
      <line x1='4' y1='18' x2='20' y2='18' />
    </svg>
  );
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // 라우트가 바뀌면 메뉴 닫기 (뒤로가기도 포함)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 바깥 클릭 닫기
  useEffect(() => {
    function onClickOutside(e) {
      if (!open) return;
      const target = e.target;
      if (menuRef.current && !menuRef.current.contains(target) && btnRef.current && !btnRef.current.contains(target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    // 1) 세션 종료
    await supabase.auth.signOut();
    // 2) 로그인 화면으로 교체 이동 (뒤로가기 시 복귀 방지)
    router.replace('/login');
  }

  // 확장성: 이후 항목을 이 배열에 추가하면 됩니다.
  const items = [
    { key: 'profile', label: '프로필', onClick: () => router.push('/profile') },
    { key: 'settings', label: '설정', onClick: () => router.push('/settings') },
    { key: 'logout', label: '로그아웃', onClick: handleLogout },
  ];

  return (
    <div className={styles.container}>
      <button ref={btnRef} type='button' aria-haspopup='menu' aria-expanded={open} aria-controls='user-menu' onClick={() => setOpen((v) => !v)} className={styles.trigger}>
        <HamburgerIcon />
      </button>

      {open && (
        <div ref={menuRef} id='user-menu' role='menu' className={styles.menu}>
          {items.map((it) => (
            <button key={it.key} role='menuitem' onClick={it.onClick} className={styles.menuItem}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
