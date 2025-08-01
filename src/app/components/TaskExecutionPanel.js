import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/app/components/modal_temp/Modal';
import Button from '@/app/components/common/Button/Button';

export default function TaskExecutionPanel({ taskId, userId, onComplete }) {
  const getKstDate = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10); // yyyy-mm-dd

  const [selectedDate, setSelectedDate] = useState(getKstDate());
  const [isExecuted, setIsExecuted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkExecution = async () => {
      const { data, error } = await supabase.from('task_executions').select('id').eq('task_id', taskId).eq('executed_at', selectedDate);
      setIsExecuted(data.length > 0);
    };
    checkExecution();
  }, [selectedDate, taskId]);

  const handleExecute = async () => {
    //userID Null 방어
    if (!userId) {
      alert('로그인 정보가 없습니다');
      return;
    }

    const { error } = await supabase.from('task_executions').insert([
      {
        task_id: taskId,
        executed_at: selectedDate,
        user_id: userId,
      },
    ]);
    if (!error) {
      setIsExecuted(true);
      alert('완료 처리되었습니다!');
      if (onComplete) onComplete();
    } else {
      alert('실행 중 오류 발생!');
      console.error(error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderTop: '1px dashed #ccc' }}>
      <input
        type='date'
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        style={{
          padding: '0.4rem 0.6rem',
          border: '1px solid #ccc',
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#333',
          backgroundColor: '#fff',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          marginRight: '10px',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
        onBlur={(e) => (e.target.style.borderColor = '#ccc')}
      />

      <Button disabled={isExecuted} onClick={handleExecute}>
        {isExecuted ? '완료됨' : '완료하기'}
      </Button>
    </div>
  );
}
