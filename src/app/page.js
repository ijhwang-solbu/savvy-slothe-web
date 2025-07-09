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

  /* ================================
    ✅ 결심 리스트 가져오기
  ================================= */
  const fetchTasks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('로그인 필요');
      return;
    }

    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id);

    console.log('결심 리스트:', data, error);
    setTasks(data || []);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* ================================
    ✅ 결심 체크 실행
  ================================= */
  const checkTask = async (taskId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('👉 user.id:', user?.id); // 🔑 실제 값
    console.log('👉 auth.uid()랑 비교됨');

    if (!user) {
      alert('로그인 먼저!');
      return;
    }

    const { data, error } = await supabase.from('task_executions').insert([
      {
        task_id: taskId,
        user_id: user.id,
        executed_at: new Date().toISOString(),
      },
    ]);
    // .select();

    console.log('👉 INSERT 요청 payload:', {
      task_id: taskId,
      user_id: user.id,
    });

    console.log('결심 체크:', data, error);
    alert('체크 완료!');
    // 필요하면 fetchTasks() 로 상태 재로딩
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

      <h2>📌 결심 리스트</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <strong>{task.title}</strong>: {task.description} ({task.status})<button onClick={() => checkTask(task.id)}>체크</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
