'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AutoLogoutWrapper from '@/app/components/AutoLogoutWrapper';

export default function TaskHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.taskId;
  // console.log('params:', params);

  const [taskTitle, setTaskTitle] = useState('');
  const [executions, setExecutions] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // ✅ 히스토리 불러오기
  const fetchHistory = useCallback(async () => {
    if (!taskId) return;
    const { data: task } = await supabase.from('tasks').select('title').eq('id', taskId).single();
    const { data: history } = await supabase.from('task_executions').select('executed_at').eq('task_id', taskId).order('executed_at', { ascending: true });

    setTaskTitle(task?.title || '');
    setExecutions(history || []);
    setSelectedDates([]);
    // console.log('taskId:', taskId);
    // console.log('executions:', history);
  }, [taskId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);


  const toggleDate = (date) => {
    setSelectedDates((prev) => (prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]));
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('task_executions').delete().in('executed_at', selectedDates).eq('task_id', taskId);

    if (error) {
      alert('삭제 실패');
    } else {
      setShowModal(false);
      fetchHistory(); // 새로고침
    }
  };

  const thStyle = {
    border: '1px solid #ccc',
    padding: '8px',
    backgroundColor: '#f9f9f9',
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
    <div style={{ padding: '2rem' }}>
      <h2>{taskTitle} - 히스토리</h2>
      <p>기록 수: {executions.length}건</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
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

      <button
        disabled={selectedDates.length === 0}
        onClick={() => setShowModal(true)}
        style={{
          marginRight: '1rem',
          padding: '0.5rem 1rem',
          border: '1px solid red',
          backgroundColor: selectedDates.length === 0 ? '#eee' : '#fff',
          color: selectedDates.length === 0 ? '#aaa' : 'red',
          cursor: selectedDates.length === 0 ? 'not-allowed' : 'pointer',
        }}>
        삭제
      </button>

      <button onClick={() => router.push('/')}>목록</button>

      {/* ✅ 모달 */}
      {showModal && (
        <div style={{ padding: '1rem', border: '1px solid #aaa', marginTop: '1rem' }}>
          <p>정말 삭제하시겠습니까?</p>
          <button onClick={handleDelete} style={{ marginRight: '1rem' }}>
            삭제
          </button>
          <button onClick={() => setShowModal(false)}>취소</button>
        </div>
      )}
    </div>
    </AutoLogoutWrapper>
  );
}
