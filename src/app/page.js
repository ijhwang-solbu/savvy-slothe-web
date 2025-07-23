'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import TaskExecutionPanel from './components/TaskExecutionPanel';
import Link from 'next/link';
import AutoLogoutWrapper from './components/AutoLogoutWrapper';
import styles from './text.module.css';

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
    router.push('/login'); //refresh(); // 혹은 router.push('/login') 등으로 이동 처리 가능
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
        <h1 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Savvy Sloth
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
              color: '#000',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#d1d5db')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}>
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
            <h3 className={styles.sectionTitle}>새로운 결심</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', margin: '1rem 0rem' }}>
              <input style={{ ...inputStyle, width: '8rem' }} placeholder='무엇을' value={title} onChange={(e) => setTitle(e.target.value)} />
              <span>을 </span>

              <input style={{ ...inputStyle, width: '4rem' }} placeholder='5' value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} type='number' min='1' />
              <span>일에</span>

              <input style={{ ...inputStyle, width: '4rem' }} placeholder='2' value={targetCount} onChange={(e) => setTargetCount(e.target.value)} type='number' min='1' />
              <span>번씩만이라도 해보까?</span>
            </div>

            <div>
              <button onClick={insertTask} style={{ ...btn, background: '#f4e3ffff' }}>
                등록
              </button>
              <button onClick={() => setShowModal(false)} style={btn}>
                취소
              </button>
            </div>
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
              <h3 className={styles.sectionTitle}>{task.title}</h3>
              <p style={{ marginBottom: '5px' }}>
                <strong>
                  {task.interval_days}일에 {task.target_count}번 씩 하기
                </strong>
                로 했는데요.
              </p>
              {/* <p>상태: {task.status}</p> */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap', // ✅ 작아지면 줄바꿈
                  rowGap: '0.5rem',
                }}>
                <div style={{ marginRight: '10px' }}>
                  <p>
                    <strong>{task.start_date}</strong>에 시작해서
                  </p>
                  <p>
                    <strong>{daysPassed}일</strong> 동안 <strong>{task.execution_count}번</strong> 진행했네요.
                  </p>
                </div>
                <Link
                  href={`/history/${task.id}`}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    border: '1px solid #888',
                    borderRadius: '4px',
                    // marginLeft: '12px',
                    textDecoration: 'none',
                    color: '#333',
                    backgroundColor: '#f3f3f3',
                  }}>
                  히스토리
                </Link>
              </div>
              {/* <p>마지막 실행일: {task.last_check_date || '—'}</p> */}

              {/* 성공률 */}
              {task.execution_count === 0 ? (
                // 처음 시작일 때 메시지
                <p style={{ marginTop: '0.5rem', fontWeight: '500', color: '#6B7280' }}>이제 시작해 볼까요?</p>
              ) : (
                // 실행한 적 있는 경우: 게이지 + 메시지
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>현재 페이스: {(task.success_ratio * 100).toFixed(1)}%</p>

                  <div
                    style={{
                      width: '100%',
                      height: '10px',
                      backgroundColor: '#eee',
                      borderRadius: '5px',
                      overflow: 'hidden',
                    }}>
                    <div
                      style={{
                        width: `${(task.success_ratio * 100).toFixed(1)}%`,
                        height: '100%',
                        backgroundColor: task.success_ratio >= 1.1 ? '#22c55e' : task.success_ratio >= 0.8 ? '#60a5fa' : task.success_ratio >= 0.6 ? '#facc15' : '#ef4444',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {/* 상태 메시지 */}
                  {task.success_ratio >= 1.1 && <p style={{ color: '#22c55e', marginTop: '4px' }}>완벽 페이스 유지 중! 날아가요!</p>}
                  {task.success_ratio >= 0.9 && task.success_ratio < 1.1 && <p style={{ color: '#60a5fa', marginTop: '4px' }}>잘 하고 있어요. 이대로만 해도 충분해요.</p>}
                  {task.success_ratio >= 0.7 && task.success_ratio < 0.9 && <p style={{ color: '#facc15', marginTop: '4px' }}>조금 느려졌어요. 다시 가볼까요?</p>}
                  {task.success_ratio < 0.7 && <p style={{ color: '#ef4444', marginTop: '4px' }}>힘이 빠졌어요. 따라가려면 좀 더 힘을 내야 해요.</p>}
                </div>
              )}

              {/* <p>성공률: {(task.success_ratio * 100).toFixed(1)}%</p> */}
              <TaskExecutionPanel taskId={task.id} userId={user?.id} onComplete={fetchTasks} />
            </div>
          );
        })}
      </main>
    </AutoLogoutWrapper>
  );
}
