'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import LoginKakaoButton from '../components/LoginKakaoButton';
import styles from './AuthButtons.module.css';

export default function Login() {
  /* ==========================================
 상태 관리 변수
========================================== */
  const router = useRouter(); // ✅ Next.js 라우터 훅
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      router.push('/');
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
    <main style={{ padding: '2rem' }}>
      <h1>안녕하세요. Savvy-Sloth입니다.</h1>
      <div style={{ marginBottom: '10px', marginTop: '10px' }}>
        <p>
          <strong>작심삼일</strong>은
        </p>
        <p>&quot;대~충 3일에 한 번씩 하고싶은데, 20일 놀고 벼락치기 10일도 성공이라고 해주면 안되나?&quot;</p>
        <p>
          라는 생각에서 시작한 <strong>적당히 나태한 할일 관리 프로젝트입니다.</strong>
        </p>
        <p>
          물론 짧은 주기의 반복이 중요한 건 알지만, 안하는 것보다는 나으니까요. <del>반박 시 님 말이 다 맞음.</del>
        </p>
      </div>

      <h3>로그인해 주세요.</h3>

      <div>
        <input type='email' placeholder='이메일' style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type='password' placeholder='비밀번호' style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <button onClick={signUp} className={`${styles.btn} ${styles.signin}`}>
          회원가입
        </button>
        <button onClick={signIn} className={`${styles.btn} ${styles.lgn}`}>
          로그인
        </button>
        <LoginKakaoButton />
      </div>
    </main>
  );
}
