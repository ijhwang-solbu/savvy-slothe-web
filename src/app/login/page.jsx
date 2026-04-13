'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import LoginKakaoButton from '../../components/LoginKakaoButton';
import PageLayout from '@/components/PageLayout/PageLayout';
import Button from '../../components/Button/Button';

export default function Login() {
  /* ==========================================
 상태 관리 변수
========================================== */
  const router = useRouter(); // ✅ Next.js 라우터 훅
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  //로그인된 사용자 홈으로 보내기
  useEffect(() => {
    const checkAlreadyLoggedIn = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // 이미 로그인된 사용자가 로그인 페이지에 들어온 경우 → 홈으로 보내기
        router.replace('/');
      }
    };

    checkAlreadyLoggedIn();
  }, [router]);

  /* ==========================================
회원 가입 / 로그인 함수
========================================== */
  // ✅ 회원가입 함수
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert('회원가입 실패! 다시 시도해주세요.');
      return;
    }

    if (data?.user) {
      alert('회원가입 성공! 로그인 해주세요.');
      // 👉 가입 후 로그인은 별도니까 이동은 생략해도 OK
      // window.location.href = '/';
    }
  };

  // ✅ 로그인 함수
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('로그인:', data, error);

    if (error) {
      alert('로그인 실패! 이메일과 비밀번호를 확인해주세요.');
      return;
    }

    if (data?.session) {
      router.replace('/');
    }
  };

  const btn = {
    padding: '0.5rem 1rem',
    // border: '1px solid #333',
    borderRadius: '6px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'background-color 0.2s ease',
    marginTop: '5px',
    marginRight: '5px',
    color: '#000',
    cursor: 'pointer',
  };
  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    width: '100%',
    fontSize: '1rem',
    outline: 'none',
  };

  /* ==========================================
✅ 렌더링
========================================== */
  return (
    <PageLayout showLogo={true} showLogout={false} pageTitle=''>
      <main style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* <h1>안녕하세요. Savvy-Sloth입니다.</h1> */}
        <div style={{ marginBottom: '10px', marginTop: '10px' }}>
          <p style={{ marginBottom: '10px', fontSize: '1.1rem' }}>
            <strong>오늘도 미뤄볼까, 벼락치기 페이스메이커</strong>
          </p>
          <p>20일의 여유와 <strong>10일의 몰입</strong>.</p>
          <p>보름의 공백과 <strong>일주일의 질주</strong>.</p>
          <p>무엇이든 당신만의 방법으로 </p>
          <p><strong>3일에 한 번</strong>의 페이스를 만들어보세요.</p>
          <p>&quot;조금 나태해도 괜찮은 이곳은, <strong>작심삼일</strong>. &quot;</p>
        </div>

        {/* <h3>로그인해 주세요.</h3>

        <dev>
          <input type='email' placeholder='이메일' style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type='password' placeholder='비밀번호' style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
        </dev>

        <div>
          <Button onClick={signUp} variant='secondary'>
            회원가입
          </Button>
          <Button onClick={signIn} variant='primary'>
            로그인
          </Button>
        </div> */}
        <LoginKakaoButton />
      </main>
    </PageLayout>
  );
}
