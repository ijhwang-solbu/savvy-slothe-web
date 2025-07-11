'use client';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function Home() {
  /* ==========================================
 상태 관리 변수
========================================== */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);

  /* ==========================================
회원 가입 / 로그인 함수
========================================== */
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

  // ✅ 로그인된 유저 가져오기
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log('👉 로그인 유저:', user);
      setUser(user);
    };
    getUser();
  }, []);

  /* ================================
    ✅ 결심 등록
  ================================= */
  const insertTask = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('로그인 먼저!');
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          status: 'in_progress',
        },
      ])
      .select();

    console.log('결심 등록:', data, error);
    fetchTasks(); // 등록 후 리스트 갱신
  };

  // ✅ tasks 가져오기
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });

    console.log('👉 tasks:', data, error);
    setTasks(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // ✅ 오늘 체크하기
  const handleCheck = async (taskId) => {
    if (!user) {
      console.log('로그인 필요');
      return;
    }

    const payload = {
      task_id: taskId,
      user_id: user.id,
      executed_at: new Date().toISOString(),
    };

    console.log('👉 INSERT payload:', payload);

    const { data, error } = await supabase.from('task_executions').insert([payload]);

    console.log('👉 INSERT result:', data, error);

    // 다시 tasks 갱신
    fetchTasks();
  };

  /* ==========================================
✅ 렌더링
========================================== */
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Savvy Sloth 테스트</h1>

      <div>
        <input type='email' placeholder='이메일' value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type='password' placeholder='비밀번호' value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={signUp}>회원가입</button>
        <button onClick={signIn}>로그인</button>
      </div>

      <hr />

      <h2>✅ 결심 등록</h2>
      <input placeholder='제목' value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder='설명' value={description} onChange={(e) => setDescription(e.target.value)} />
      <button onClick={insertTask}>등록하기</button>

      <hr />

      <h1>Savvy Sloth 결심 리스트</h1>

      {tasks.length === 0 && <p>아직 등록된 결심이 없습니다.</p>}

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            border: '1px solid #ddd',
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: task.status === '유지' ? '#e6ffe6' : task.status === '경고' ? '#fff5e6' : '#ffe6e6',
          }}>
          <h3>{task.title}</h3>
          <p>상태: {task.status}</p>
          <p>성공률: {(task.success_ratio * 100).toFixed(1)}%</p>
          <button onClick={() => handleCheck(task.id)}>오늘 체크하기</button>
        </div>
      ))}
    </main>
  );
}
