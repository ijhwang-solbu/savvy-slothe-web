'use client';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ✅ 회원가입 함수
  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log('회원가입:', data, error);
  };

  // ✅ 로그인 함수
  const signIn = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('로그인:', data, error);
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Savvy Sloth 테스트</h1>

      <div style={{ marginBottom: '1rem' }}>
        <input type='email' placeholder='이메일' value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input type='password' placeholder='비밀번호' value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      <button onClick={signUp} style={{ marginRight: '1rem' }}>
        회원가입
      </button>

      <button onClick={signIn}>로그인</button>
    </main>
  );
}
