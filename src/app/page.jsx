'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import TaskExecutionPanel from './components/TaskExecutionPanel';
import Link from 'next/link';
import AutoLogoutWrapper from './components/AutoLogoutWrapper';
import styles from './text.module.css';
import modal from './components/modal/modal';
import Modal from './components/modal/modal';

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

    if (error) {
      console.error('태스크 조회 오류:', error);
      return;
    }

    if (data) {
      const today = new Date();

      const updatedTasks = data.map((task) => {
        // 경과일 계산
        const daysPassed = Math.floor((today.setHours(0, 0, 0, 0) - new Date(task.start_date).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)) + 1;

        // 예상 실행 횟수
        const expectedCount = (daysPassed / task.interval_days) * task.target_count;

        // 성공률 계산
        const successRatio = expectedCount > 0 ? task.execution_count / expectedCount : 0;

        return {
          ...task,
          success_ratio: successRatio,
        };
      });

      setTasks(updatedTasks);
    }
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
      <main style={{ padding: '1rem' }}>
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

        {/* 등록 모달 */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <h3 className={styles.sectionTitle}>새로운 결심</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', margin: '1rem 0rem' }}>
            <input style={{ ...inputStyle, width: '8rem' }} placeholder='20분 공원 뛰기' value={title} onChange={(e) => setTitle(e.target.value)} />
            <span> ☆ </span>

            <input style={{ ...inputStyle, width: '4rem' }} placeholder='5' value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} type='number' min='1' />
            <span>일에</span>

            <input style={{ ...inputStyle, width: '4rem' }} placeholder='2' value={targetCount} onChange={(e) => setTargetCount(e.target.value)} type='number' min='1' />
            <span>번 씩 만이라도 해보까?</span>
          </div>

          <div>
            <button onClick={insertTask} style={{ ...btn, background: '#f4e3ffff' }}>
              등록
            </button>
            <button onClick={() => setShowModal(false)} style={btn}>
              취소
            </button>
          </div>
        </Modal>

        <hr />

        {tasks.length === 0 && <p>등록된 결심이 없습니다.</p>}

        {tasks.map((task) => {
          const today = new Date(); // 브라우저가 한국 시간대라면 이미 KST임
          const startDate = new Date(task.start_date);
          const daysPassed = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())) / (1000 * 60 * 60 * 24)) + 1;
          const rawPercent = task.success_ratio * 100; //게이지 계산
          const cappedPercent = Math.min(rawPercent, 200); //게이지 계산
          let markerPos;
          if (cappedPercent <= 100) {
            markerPos = (cappedPercent / 100) * 65;
          } else {
            markerPos = 65 + ((cappedPercent - 100) / 100) * 30;
          }
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
                  {/* <p>
                    <strong>{task.start_date}</strong>에 시작해서
                  </p> */}
                  <p>
                    <strong>총 {daysPassed}일</strong> 동안 <strong>{task.execution_count}번</strong> 진행했네요.
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
                  {/* <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>현재 페이스: {(task.success_ratio * 100).toFixed(1)}%</p> */}
                  <p style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    페이스: {(task.success_ratio * task.target_count).toFixed(1)}회 / {task.interval_days}일
                  </p>

                  {/* 게이지 바 */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '14px',
                      background: 'linear-gradient(to right, #eb5050ff, #22c55e 50%, #3b82f6)',
                      borderRadius: '7px',
                    }}>
                    {/* 100% 기준선 */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: `65%`, // 100% 위치를 게이지의 75% 지점에 매핑
                        width: '2px',
                        height: '100%',
                        backgroundColor: '#fff',
                        opacity: 0.8,
                      }}
                    />

                    {/* 마커 */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: `calc(${markerPos}% - 4px)`,
                        width: '10px',
                        height: '10px',
                        background: '#f52828ff',
                        border: '2px solid #ffffffff',
                        transform: 'rotate(45deg)',
                        borderRadius: '2px',
                        boxShadow: '0 0 6px 3px rgba(179, 0, 149, 0.8)',
                        transition: 'left 0.5s ease',
                      }}
                    />
                  </div>

                  {/* --------------- */}

                  {/* 상태 메시지 */}
                  {task.success_ratio >= 1.3 && <p style={{ color: '#22c55e', marginTop: '4px' }}>매우 빠릅니다!!!! 날아가요!</p>}
                  {task.success_ratio >= 1.0 && task.success_ratio < 1.3 && <p style={{ color: '#60a5fa', marginTop: '4px' }}>완벽 페이스 유지 중!! 이대로 쭉 가자요!</p>}
                  {task.success_ratio >= 0.85 && task.success_ratio < 1.0 && <p style={{ color: '#60a5fa', marginTop: '4px' }}>잘 하고 있어요. 이대로만 해도 충분해요.</p>}
                  {task.success_ratio >= 0.7 && task.success_ratio < 0.85 && <p style={{ color: '#facc15', marginTop: '4px' }}>조금 느려졌어요. 다시 가볼까요?</p>}
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
