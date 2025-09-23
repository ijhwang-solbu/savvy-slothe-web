'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AutoLogoutWrapper from '@/components/AutoLogoutWrapper';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import PageLayout from '@/components/PageLayout/PageLayout';
import VacationBadge from '@/components/Task/VacationBadge';
import VacationDialog from '@/components/Task/VacationDialog';

const getKstTodayDateString = () => {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(utcTime + kstOffset);
  return kstDate.toISOString().slice(0, 10);
};

export default function TaskHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId;
  // console.log('params:', params);

  const [user, setUser] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [executions, setExecutions] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeVacation, setActiveVacation] = useState(null);
  const [scheduledVacation, setScheduledVacation] = useState(null);
  const [isVacationDialogOpen, setIsVacationDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setUser(user);
    };

    fetchUser();
  }, [router]);

  // ✅ 히스토리 불러오기
  const fetchHistory = useCallback(async () => {
    if (!taskId || !user?.id) return;

    const { data: task, error: taskError } = await supabase.from('tasks').select('title').eq('id', taskId).eq('user_id', user.id).single();

    if (taskError) {
      console.error('태스크 조회 실패:', taskError);
      setTaskTitle('');
    } else {
      setTaskTitle(task?.title || '');
    }

    const { data: history, error: historyError } = await supabase.from('task_executions').select('executed_at').eq('task_id', taskId).eq('user_id', user.id).order('executed_at', { ascending: true });

    if (historyError) {
      console.error('히스토리 조회 실패:', historyError);
      setExecutions([]);
      return;
    }

    setExecutions(history || []);
    setSelectedDates([]);
    // console.log('taskId:', taskId);
    // console.log('executions:', history);
  }, [taskId, user?.id]);

  const fetchVacation = useCallback(async () => {
    if (!taskId || !user?.id) return;

    const { data, error } = await supabase.from('task_vacations').select('id, start_date, end_date').eq('task_id', taskId).eq('user_id', user.id).order('start_date', { ascending: true });

    if (error) {
      console.error('방학 정보 조회 실패:', error);
      setActiveVacation(null);
      setScheduledVacation(null);
      return;
    }

    const today = getKstTodayDateString();
    const current = data?.find((v) => v.start_date <= today && v.end_date >= today) || null;
    const scheduled = data?.find((v) => v.start_date > today) || null;
    setActiveVacation(current || null);
    setScheduledVacation(scheduled || null);
  }, [taskId, user?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    fetchVacation();
  }, [fetchVacation]);

  const toggleDate = (date) => {
    setSelectedDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
  };

  const handleDelete = async () => {
    if (!user?.id) return;

    const { error } = await supabase.from('task_executions').delete().in('executed_at', selectedDates).eq('task_id', taskId).eq('user_id', user.id);

    if (error) {
      alert('삭제 실패');
    } else {
      setShowModal(false);
      fetchHistory(); // 새로고침
    }
  };

  const handleOpenVacationDialog = () => {
    // 다이얼로그 열 때 현재 예정된 방학을 기반으로 모드/초기값을 결정
    setIsVacationDialogOpen(true);
  };

  const handleCloseVacationDialog = () => {
    setIsVacationDialogOpen(false);
  };

  const handleSaveVacation = async ({ startDate, endDate }) => {
    if (!user?.id) {
      throw new Error('로그인 정보가 필요합니다. 다시 로그인 후 시도해주세요.');
    }

    // 공통 제약: 시작일은 내일 이후
    const todayStr = getKstTodayDateString();
    const toDate = (s) => new Date((s || '').split('T')[0]);
    const today = toDate(todayStr);
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    if (toDate(startDate) < tomorrow) {
      throw new Error('시작일은 내일 이후만 가능합니다.');
    }

    // 예정된 방학이 있으면 UPDATE, 없으면 INSERT
    if (scheduledVacation) {
      // 이미 시작된 방학은 수정 불가 (방어적 체크)
      if (toDate(scheduledVacation.start_date) <= today) {
        throw new Error('이미 시작된 방학은 수정할 수 없습니다.');
      }

      const { error } = await supabase.from('task_vacations').update({ start_date: startDate, end_date: endDate }).eq('id', scheduledVacation.id).eq('task_id', taskId).eq('user_id', user.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('task_vacations').insert([
        {
          task_id: taskId,
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
        },
      ]);

      if (error) throw error;
    }

    await fetchVacation();
    await fetchHistory();
  };

  const thStyle = {
    border: '1px solid #ccc',
    padding: '8px',
    backgroundColor: '#e9e9e9ff',
    color: '#303030',
    fontWeight: 'bold',
    textAlign: 'center',
  };

  const tdStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'center',
  };

  const tdStyle_check = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'center',
    width: '80px',
  };

  return (
    <AutoLogoutWrapper>
      <PageLayout showLogo={true} showLogout={false} pageTitle='히스토리 상세'>
        <div style={{ padding: '0rem 0.5rem' }}>
          <h2 style={{ fontSize: '1.2rem' }}>
            <strong>[제목 : {taskTitle}]</strong>
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
            }}>
            {activeVacation ? (
              <>
                <VacationBadge startDate={activeVacation.start_date} endDate={activeVacation.end_date} />
                <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>방학 기간에도 체크는 가능하며 성공률 계산에서 제외돼요.</span>
              </>
            ) : (
              <>
                <Button variant='primary' onClick={handleOpenVacationDialog}>
                  {scheduledVacation ? '방학 수정' : '방학 신청'}
                </Button>
                <span style={{ fontSize: '0.85rem', color: '#4b5563' }}>방학기간(50일)동안 밀린 페이스를 끌어올려봐요. like 계절학기</span>
              </>
            )}
          </div>
          <p>기록 수: {executions.length}건</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', marginBottom: '1rem' }}>
            <thead>
              <tr>
                <th style={thStyle}>선택</th>
                <th style={thStyle}>날짜</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((e) => (
                <tr key={e.executed_at}>
                  <td style={tdStyle_check}>
                    <input type='checkbox' checked={selectedDates.includes(e.executed_at)} onChange={() => toggleDate(e.executed_at)} />
                  </td>
                  <td style={tdStyle}>{e.executed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Button variant='danger' disabled={selectedDates.length === 0} onClick={() => setShowModal(true)}>
            삭제
          </Button>
          <Button variant='secondary' onClick={() => router.push('/')}>
            목록
          </Button>

          {/* ✅ 모달 */}
          <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
            <p>정말 삭제하시겠습니까?</p>
            <div style={{ marginTop: '1rem' }}>
              <Button variant='danger' onClick={handleDelete}>
                삭제
              </Button>
              <Button variant='secondary' onClick={() => setShowModal(false)}>
                취소
              </Button>
            </div>
          </Modal>
          <VacationDialog open={isVacationDialogOpen} onClose={handleCloseVacationDialog} onSave={handleSaveVacation} mode={scheduledVacation ? 'update' : 'create'} defaultStartDate={scheduledVacation ? scheduledVacation.start_date : undefined} />
        </div>
      </PageLayout>
    </AutoLogoutWrapper>
  );
}
