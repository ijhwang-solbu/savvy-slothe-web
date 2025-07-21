'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

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
    border: '1px solid #333',
    borderRadius: '5px',
    marginTop: '5px',
    marginRight: '5px',
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
      <h3>로그인해 주세요.</h3>

      <div>
        <input type='email' placeholder='이메일' style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type='password' placeholder='비밀번호' style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <button onClick={signUp} style={{ ...btn, background: '#f4e3ffff' }}>
          회원가입
        </button>
        <button onClick={signIn} style={{ ...btn, background: '#ccffd7ff' }}>
          로그인
        </button>
      </div>
    </main>
  );
}
