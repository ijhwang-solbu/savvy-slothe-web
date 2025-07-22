'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import TaskExecutionPanel from './components/TaskExecutionPanel';
import Link from 'next/link';
import AutoLogoutWrapper from './components/AutoLogoutWrapper';

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
  }, [router]);

  //  ✅로그아웃 함수
  const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push('/login') //refresh(); // 혹은 router.push('/login') 등으로 이동 처리 가능
};

  // 시간대 보정 함수 시작

  const getKstTodayDateString = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 한국 기준 시각
    return kst.toISOString().slice(0, 10); // YYYY-MM-DD 형태
  };

  // 시간대 보정 함수 끝

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
        start_date: getKstTodayDateString(),
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

  // 유저 아이디 확인
  // console.log('유저 ID (프론트):', user.id);
  /* ================================
    ✅ 오늘 체크 or 해제
  ================================= */

  //스타일
  const inputStyle = {
    padding: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    width: '100%',
    fontSize: '1rem',
    outline: 'none',
  };

  const btn = {
    padding: '0.5rem 1rem',
    border: '1px solid #333',
    borderRadius: '5px',
    marginTop: '5px',
    marginRight: '5px',
    color: '#000',
  };
  /* ==========================================
✅ 렌더링
========================================== */
  return (
    <AutoLogoutWrapper>
    <main style={{ padding: '2rem' }}>
      <h1 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>Savvy Sloth
        <button
    onClick={handleLogout}
    style={{
      padding: '0.5rem 1rem',
      border: '1px solid #333',
      borderRadius: '5px',
      backgroundColor: '#e5e7eb',
      marginLeft: '10px',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
    }}
    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d1d5db')}
    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
  >
    로그아웃
  </button>
      </h1>

      <button
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #333',
          borderRadius: '5px',
          background: '#f4e3ffff',
          marginTop: '5px',
          marginBottom: '5px',
          color: '#000',
        }}
        onClick={() => setShowModal(true)}>
        <strong>새 결심 등록하기</strong>
      </button>

      {showModal && (
        <div style={{ border: '1px solid #333', padding: '1rem', marginTop: '0.5rem' }}>
          <h3>새 결심 등록</h3>
          <input style={inputStyle} placeholder='제목' value={title} onChange={(e) => setTitle(e.target.value)} />
          <br />
          <input style={inputStyle} placeholder='주기 (일)' value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} />
          <br />
          <input style={inputStyle} placeholder='목표 횟수' value={targetCount} onChange={(e) => setTargetCount(e.target.value)} />
          <button onClick={insertTask} style={{ ...btn, background: '#f4e3ffff' }}>
            등록
          </button>
          <button onClick={() => setShowModal(false)} style={btn}>
            취소
          </button>
        </div>
      )}

      <hr />

      {tasks.length === 0 && <p>등록된 결심이 없습니다.</p>}

      {tasks.map((task) => {
        const today = new Date(); // 브라우저가 한국 시간대라면 이미 KST임
        const startDate = new Date(task.start_date);
        const daysPassed = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) / (1000 * 60 * 60 * 24)) + 1;
        return (
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
            {/* <p>상태: {task.status}</p> */}
            <p>시작일: {task.start_date}</p>
            <p>경과일: {daysPassed}</p>
            <p>
              실행횟수: {task.execution_count}회{' '}
              <Link
                href={`/history/${task.id}`}
                style={{
                  padding: '2px 6px',
                  fontSize: '0.8rem',
                  border: '1px solid #888',
                  borderRadius: '4px',
                  marginLeft: '8px',
                  textDecoration: 'none',
                  color: '#333',
                  backgroundColor: '#f3f3f3',
                }}>
                히스토리
              </Link>
            </p>
            <p>마지막 실행일: {task.last_check_date || '—'}</p>
            <p>성공률: {(task.success_ratio * 100).toFixed(1)}%</p>
            <TaskExecutionPanel taskId={task.id} userId={user?.id} onComplete={fetchTasks} />
          </div>
        );
      })}
    </main>
    </AutoLogoutWrapper>
  );
}
