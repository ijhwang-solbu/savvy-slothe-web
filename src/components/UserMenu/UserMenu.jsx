'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import styles from './UserMenu.module.css';

// 필요 시 환경변수 혹은 공용 클라이언트를 사용하세요.
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Kakao 메타데이터 다양한 케이스를 안전하게 처리
function pickAvatarUrl(meta) {
  if (!meta) return null;
  return meta.avatar_url || meta.picture || meta.profile_image_url || meta?.kakao_account?.profile?.profile_image_url || meta?.properties?.profile_image || null;
}

function pickDisplayName(meta) {
  if (!meta) return '';
  return meta.name || meta.nickname || meta.full_name || meta.user_name || meta.email?.split('@')?.[0] || '';
}

function Initials({ name }) {
  const trimmed = (name || '').trim();
  const parts = trimmed ? trimmed.split(/\s+/) : [];
  const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (trimmed[0] || 'U').toUpperCase();
  return (
    <span aria-hidden className={styles.initials}>
      {initials}
    </span>
  );
}

// 단순 햄버거 아이콘
// function HamburgerIcon({ size = 24, stroke = 'currentColor' }) {
//   return (
//     <svg width={size} height={size} viewBox='0 0 24 24' role='img' aria-label='Menu' fill='none' stroke={stroke} strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'>
//       <line x1='4' y1='6' x2='20' y2='6' />
//       <line x1='4' y1='12' x2='20' y2='12' />
//       <line x1='4' y1='18' x2='20' y2='18' />
//     </svg>
//   );
// }

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // 라우트가 바뀌면 메뉴 닫기 (뒤로가기도 포함)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 바깥 클릭/ESC 닫기
  useEffect(() => {
    function onClickOutside(e) {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
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

  // 사용자 프로필 로드 (카카오 아바타 포함)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data?.user?.user_metadata;
      if (!mounted) return;
      setAvatarUrl(pickAvatarUrl(meta));
      setDisplayName(pickDisplayName(meta));
    })();
    return () => {
      mounted = false;
    };
  }, []);

  //뒤로가기 복지 방지
  async function handleLogout() {
    // 1) 세션 종료
    await supabase.auth.signOut();
    // 2) 로그인 화면으로 교체 이동 (뒤로가기 시 복귀 방지)
    router.replace('/login');
  }

  // 확장성: 이후 항목을 이 배열에 추가하면 됩니다.
  const sections = [
    // { key: 'profile', label: '프로필', onClick: () => router.push('/profile') },
    // { key: 'settings', label: '설정', onClick: () => router.push('/settings') },
    { key: 'logout', label: '로그아웃', onClick: handleLogout },
  ];
  const normalizedItems = Array.isArray(sections)
    ? sections
    : sections
    ? Object.values(sections) // 객체면 values를 사용
    : [];

  return (
    <div className={styles.container}>
      <button ref={btnRef} type='button' aria-haspopup='menu' aria-expanded={open} aria-controls='user-menu' onClick={() => setOpen((v) => !v)} className={styles.trigger}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName ? `${displayName} 프로필` : '사용자 프로필'} className={styles.avatarImg} referrerPolicy='no-referrer' />
        ) : (
          <div className={styles.avatarFallback} aria-hidden>
            <Initials name={displayName} />
          </div>
        )}
      </button>

      {open && (
        <div ref={menuRef} id='user-menu' role='menu' className={styles.menu}>
          {/* 상단 사용자 정보 영역 (선택) */}
          {(displayName || avatarUrl) && (
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt='' className={styles.headerAvatar} referrerPolicy='no-referrer' />
                ) : (
                  <div className={styles.headerAvatarFallback} aria-hidden>
                    <Initials name={displayName} />
                  </div>
                )}
              </div>
              <div className={styles.headerRight}>
                <div className={styles.name} title={displayName}>
                  {displayName || 'User'}
                </div>
              </div>
            </div>
          )}
          {/* 섹션들 */}
          {normalizedItems.map((it) => (
            <button key={it.key} role='menuitem' onClick={it.onClick} className={styles.menuItem}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
