'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export default function Home() {
  /* ==========================================
 상태 관리 변수
========================================== */

  const router = useRouter(); // ✅ Next.js 라우터 훅
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);

  /* ==========================================
 모달 폼 입력 값
========================================== */
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [intervalDays, setIntervalDays] = useState('');
  const [targetCount, setTargetCount] = useState('');

  //   /* ==========================================
  // 회원 가입 / 로그인 함수
  // ========================================== */
  //   // ✅ 회원가입 함수
  //   const signUp = async () => {
  //     const { data, error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //     });
  //     console.log('회원가입:', data, error);
  //   };

  //   // ✅ 로그인 함수
  //   const signIn = async () => {
  //     const { data, error } = await supabase.auth.signInWithPassword({
  //       email,
  //       password,
  //     });
  //     console.log('로그인:', data, error);
  //   };

  // ✅ 로그인된 유저 가져오기
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
      }
    };
    getUser();
  }, []);

  /* ================================
    ✅ 결심 등록
  ================================= */
  const insertTask = async () => {
    if (!title || !intervalDays || !targetCount) {
      alert('필수 값을 모두 입력해주세요!');
      return;
    }

    const { data, error } = await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title,
        description,
        interval_days: parseInt(intervalDays),
        target_count: parseInt(targetCount),
        status: '진행중',
      },
    ]);
    setShowModal(false);
    fetchTasks();
  };

  /* ================================
    ✅ 결심 리스트 가져오기
  ================================= */
  const fetchTasks = async () => {
    const { data, error } = await supabase.from('v_user_tasks').select('*').order('created_at', { ascending: false });
    setTasks(data || []);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  /* ================================
    ✅ 오늘 체크 or 해제
  ================================= */

  const toggleCheck = async (taskId, isChecked) => {
    if (isChecked) {
      const { data, error } = await supabase.from('task_executions').insert([
        {
          task_id: taskId,
          user_id: user.id,
          executed_at: new Date(), // ← ISO 문자열 대신 Date 객체 사용
        },
      ]);

      if (error) {
        console.error('체크 실패:', error);
        alert('체크 중 오류 발생!');
        return;
      }
    } else {
      const { data, error } = await supabase.rpc('delete_today_execution', {
        task_id_input: taskId,
        user_id_input: user.id,
      });

      if (error) {
        console.error('해제 실패:', error);
        alert('체크 해제 중 오류 발생!');
        return;
      }
    }

    fetchTasks();
  };
  /* ==========================================
✅ 렌더링
========================================== */
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Savvy Sloth</h1>

      <button onClick={() => setShowModal(true)}>새 결심 등록하기</button>

      {showModal && (
        <div style={{ border: '1px solid #333', padding: '1rem', marginTop: '1rem' }}>
          <h3>새 결심 등록</h3>
          <input placeholder='제목' value={title} onChange={(e) => setTitle(e.target.value)} />
          <br />
          <input placeholder='주기 (일)' value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} />
          <br />
          <input placeholder='목표 횟수' value={targetCount} onChange={(e) => setTargetCount(e.target.value)} />
          <button onClick={insertTask}>등록</button>
          <button onClick={() => setShowModal(false)}>취소</button>
        </div>
      )}

      <hr />

      {tasks.length === 0 && <p>등록된 결심이 없습니다.</p>}

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            border: '1px solid #ddd',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
          <h3>{task.title}</h3>
          <p>
            주기: {task.interval_days}일, 목표: {task.target_count}회
          </p>
          <p>상태: {task.status}</p>
          <p>시작일: {task.start_date}</p>
          <p>마지막 실행일: {task.last_check_date || '—'}</p>
          <p>성공률: {(task.success_ratio * 100).toFixed(1)}%</p>
          <label>
            <input type='checkbox' checked={task.is_checked} onChange={(e) => toggleCheck(task.id, e.target.checked)} /> 오늘 체크
          </label>
        </div>
      ))}
    </main>
  );
}
