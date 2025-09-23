'use client';
//디렉토리 : app/page.jsx

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import TaskExecutionPanel from '../components/TaskExecutionPanel';
import Link from 'next/link';
import AutoLogoutWrapper from '../components/AutoLogoutWrapper';
import styles from './text.module.css';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import PageLayout from '@/components/PageLayout/PageLayout';
import usePwaInstallPrompt from '@/hooks/usePwaInstallPrompt';
import InstallPrompt from '@/components/InstallPrompt';
import MainCalendarPanel from '@/components/Main/MainCalendarPanel';
import VacationBadge from '@/components/Task/VacationBadge';

export default function Home() {
  //PWA 설치
  const { isVisible, installApp, closePrompt } = usePwaInstallPrompt();

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

  //삭제용 상태 추가
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  // 삭제 모달 랜덤 문구 상태
  const deleteMessages = ['이정도 마음이었니?', '벌써 떠나려는 거야?', '이별을 준비했구나?', '결심은 쉽게 사라지는구나...'];
  const [deleteMessage, setDeleteMessage] = useState(deleteMessages[0]);

  // ✅ 로그인된 유저 가져오기
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
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

    if (error) {
      alert('등록 중 오류가 발생했습니다.');
      return;
    }
    setTitle('');
    setIntervalDays('');
    setTargetCount('');
    setShowModal(false);
    fetchTasks();
  };

  //팝업 닫을 때 초기화
  const closeModal = () => {
    setShowModal(false);
    // ✅ 입력값 초기화
    setTitle('');
    setIntervalDays('');
    setTargetCount('');
  };

  /* ================================
    ✅ 결심 리스트 가져오기
  ================================= */
  const fetchTasks = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('태스크 조회 오류:', error);
      return;
    }

    if (!data) {
      setTasks([]);
      return;
    }

    const { data: vacationData, error: vacationError } = await supabase
      .from('task_vacations')
      .select('task_id, start_date, end_date')
      .eq('user_id', user.id);

    if (vacationError) {
      console.error('방학 정보 조회 오류:', vacationError);
    }

    const today = getKstTodayDateString();
    const activeVacations = new Map();

    (vacationData || []).forEach((vacation) => {
      if (vacation.start_date <= today && vacation.end_date >= today) {
        activeVacations.set(vacation.task_id, vacation);
      }
    });

    const tasksWithVacation = data.map((task) => ({
      ...task,
      activeVacation: activeVacations.get(task.id) || null,
    }));

    // ✅ DB에서 이미 days_passed, expected_count, success_ratio, current_count 컬럼을 관리
    // 클라이언트에서 추가 계산할 필요 없음
    setTasks(tasksWithVacation);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  //삭제 버튼 클릭 -> 모달 표시
  const openDeleteModal = (taskId) => {
    const randomMsg = deleteMessages[Math.floor(Math.random() * deleteMessages.length)];
    setDeleteMessage(randomMsg);
    setDeleteTargetId(taskId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  //삭제 로직
  const deleteTask = async () => {
    if (!deleteTargetId) return;
    const { error } = await supabase.from('tasks').delete().eq('id', deleteTargetId);
    if (error) {
      alert('삭제 실패! 다시 시도해주세요.');
      return;
    }
    alert('결심이 삭제되었습니다.');
    closeDeleteModal();
    fetchTasks();
  };

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

  //달력 컴포넌트 정의
  const handleSelectDay = (dateKey) => {
    // TODO: DayManageDialog 열기 (다음 단계에서 구현)
    console.log('select day', dateKey);
  };

  // 10.달력 바로 동기화
  const [statsMap, setStatsMap] = useState({});
  ////10. ✅ 추가: 실행 완료된 날짜를 즉시 반영하는 로컬 업데이트 함수
  const handleComplete = (dateKey) => {
    setStatsMap((prev) => {
      const current = prev[dateKey] || 0;
      return { ...prev, [dateKey]: current + 1 };
    });
  };

  ////10. ✅ TaskExecutionPanel에서 완료 후 호출되는 콜백
  const handleCalendarUpdate = (dateKey) => {
    handleComplete(dateKey); // 달력 즉시 반영
    fetchTasks?.(); // task 리스트도 새로고침
  };

  /* ==========================================
✅ 렌더링
========================================== */
  return (
    <AutoLogoutWrapper>
      <PageLayout showLogo={true} showLogout={true} pageTitle='' onLogout={() => handleLogout()}>
        <Modal isOpen={showDeleteModal} onClose={closeDeleteModal}>
          <h3 style={{ marginBottom: '0.5rem' }}>{deleteMessage}</h3>
          <p style={{ marginBottom: '1rem' }}>그런거야..?</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant='danger' onClick={deleteTask}>
              네, 지울게요
            </Button>
            <Button variant='secondary' onClick={closeDeleteModal}>
              아니요, 남길래요
            </Button>
          </div>
        </Modal>
        {isVisible && <InstallPrompt onInstall={installApp} onClose={closePrompt} />}
        <main style={{ padding: '1rem', maxWidth: '600px', minWidth: '300px', margin: '0 auto' }}>
          <button
            style={{
              padding: '0.4rem 0.8rem',
              border: '1px solid #333',
              borderRadius: '5px',
              background: '#f4e3ffff',
              marginTop: '5px',
              marginBottom: '5px',
              color: '#000',
            }}
            onClick={() => setShowModal(true)}>
            <strong>+ 새로운 결심</strong>
          </button>
          {/* 등록 모달 */}
          <Modal isOpen={showModal} onClose={closeModal}>
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
              <Button variant='primary' onClick={insertTask}>
                등록
              </Button>
              <Button variant='secondary' onClick={closeModal}>
                취소
              </Button>
            </div>
          </Modal>
          <hr />
          {/* 1) 상단 달력 섹션 */}
          <MainCalendarPanel statsMap={statsMap} setStatsMap={setStatsMap} onSelectDay={handleSelectDay} />

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
                  // Width: '100%px',
                  position: 'relative',
                }}>
                {/* 휴지통 아이콘 */}
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    cursor: 'pointer',
                    fontSize: '18px', // 크기 조정
                    lineHeight: '1', // 세로 맞춤
                  }}
                  onClick={() => openDeleteModal(task.id)}>
                  🗑️
                </div>

                <h3 className={styles.sectionTitle}>{task.title}</h3>
                <p style={{ marginBottom: '5px' }}>
                  <strong>
                    {task.interval_days}일에 {task.target_count}번 씩 하기로 결심!!
                  </strong>
                </p>
                {task.activeVacation && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <VacationBadge startDate={task.activeVacation.start_date} endDate={task.activeVacation.end_date} />
                  </div>
                )}
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
                      <strong>{daysPassed}일</strong> 동안 <strong>{task.current_count}번</strong> 진행했네요.
                    </p>
                  </div>
                  <Link
                    href={`/history/${task.id}`}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      // border: '1px solid #888888',
                      borderRadius: '4px',
                      // marginLeft: '12px',
                      textDecoration: 'none',
                      color: '#191946',
                      backgroundColor: '#ddddddff',
                    }}>
                    히스토리
                  </Link>
                </div>
                {/* <p>마지막 실행일: {task.last_check_date || '—'}</p> */}
                {/* 성공률 */}
                {task.current_count === 0 ? (
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
                        // maxWidth: '400px', // ✅ 최대 길이 제한
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
                      {/* 마커 아래 퍼센트 표시 */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '14px', // 게이지 아래 위치
                          left: `calc(${markerPos}% - 12px)`, // 마커와 동일한 left
                          fontSize: '12px',
                          color: '#333',
                          background: 'rgba(255,255,255,0.8)',
                          padding: '1px 3px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                        }}>
                        {(task.success_ratio * 100).toFixed(0)}%
                      </div>
                    </div>

                    {/* --------------- */}

                    {/* 상태 메시지 */}
                    {task.success_ratio >= 1.3 && <p style={{ color: '#22c55e', marginTop: '15px' }}>매우 빠릅니다!!!! 날아가요!</p>}
                    {task.success_ratio >= 0.98 && task.success_ratio < 1.3 && <p style={{ color: '#60a5fa', marginTop: '15px' }}>완벽 페이스 유지 중!! 이대로 쭉 가자요!</p>}
                    {task.success_ratio >= 0.85 && task.success_ratio < 0.98 && <p style={{ color: '#60a5fa', marginTop: '15px' }}>잘 하고 있어요. 이대로만 해도 충분해요.</p>}
                    {task.success_ratio >= 0.7 && task.success_ratio < 0.5 && <p style={{ color: '#facc15', marginTop: '15px' }}>조금 느려졌어요. 다시 가볼까요?</p>}
                    {task.success_ratio < 0.7 && <p style={{ color: '#ef4444', marginTop: '15px' }}>힘이 빠졌어요. 따라가려면 좀 더 힘을 내야 해요.</p>}
                  </div>
                )}
                {/* <p>성공률: {(task.success_ratio * 100).toFixed(1)}%</p> */}
                <TaskExecutionPanel taskId={task.id} userId={user?.id} onComplete={handleCalendarUpdate} />
              </div>
            );
          })}
        </main>
      </PageLayout>
    </AutoLogoutWrapper>
  );
}
