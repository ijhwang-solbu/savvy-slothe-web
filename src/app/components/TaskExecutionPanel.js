import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TaskExecutionPanel({ taskId, userId, onComplete }) {
  const getKstDate = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10); // yyyy-mm-dd

  const [selectedDate, setSelectedDate] = useState(getKstDate());
  const [isExecuted, setIsExecuted] = useState(false);

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

  return (
    <div style={{ marginTop: '0.5rem', padding: '0.5rem', borderTop: '1px dashed #ccc' }}>
      <input type='date' value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ padding: '0.3rem', marginRight: '0.5rem' }} />
      <button
        disabled={isExecuted}
        onClick={handleExecute}
        style={{
          padding: '0.5rem 1rem',
          border: '1px solid #333',
          borderRadius: '5px',
          backgroundColor: isExecuted ? '#eee' : '#fff',
          color: isExecuted ? '#999' : '#000',
          cursor: isExecuted ? 'not-allowed' : 'pointer',
        }}>
        {isExecuted ? '완료됨' : '완료하기'}
      </button>
    </div>
  );
}
