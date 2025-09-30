'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/Modal/Modal';
import Button from '@/components/Button/Button';
import { supabase } from '@/lib/supabase';

const formatDateKeyToTitle = (dateKey) => {
  if (!dateKey) return '';
  const [year = '', month = '', day = ''] = dateKey.split('-');
  return `${year.slice(-2)}-${month}-${day}`;
};

export default function DayManageDialog({ isOpen, dateKey, tasks = [], userId, onClose, onSaved }) {
  const [checkedTaskIds, setCheckedTaskIds] = useState(() => new Set());
  const [initialTaskIds, setInitialTaskIds] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const taskIds = useMemo(() => tasks.map((task) => task.id).filter((id) => id !== undefined && id !== null), [tasks]);

  useEffect(() => {
    if (!isOpen || !dateKey) return;

    let isCancelled = false;

    const loadExecutions = async () => {
      if (taskIds.length === 0) {
        if (!isCancelled) {
          const emptySet = new Set();
          setCheckedTaskIds(emptySet);
          setInitialTaskIds(emptySet);
          setIsLoading(false);
          setErrorMessage('');
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        let query = supabase.from('task_executions').select('task_id').eq('executed_at', dateKey);
        if (userId) {
          query = query.eq('user_id', userId);
        }
        query = query.in('task_id', taskIds);

        const { data, error } = await query;
        if (isCancelled) return;

        if (error) {
          console.error('Failed to load executions:', error);
          setErrorMessage('체크 정보를 불러오는데 실패했어요. 잠시 후 다시 시도해주세요.');
          const emptySet = new Set();
          setCheckedTaskIds(emptySet);
          setInitialTaskIds(emptySet);
        } else {
          const existingIds = new Set((data || []).map((row) => row.task_id));
          setInitialTaskIds(existingIds);
          setCheckedTaskIds(new Set(existingIds));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadExecutions();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, dateKey, taskIds, userId]);

  useEffect(() => {
    if (!isOpen) {
      setCheckedTaskIds(new Set());
      setInitialTaskIds(new Set());
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleToggleTask = (taskId) => {
    if (isLoading || isSaving) return;
    setCheckedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!dateKey || isSaving || isLoading) return;

    const currentIds = new Set(checkedTaskIds);
    const added = [...currentIds].filter((id) => !initialTaskIds.has(id));
    const removed = [...initialTaskIds].filter((id) => !currentIds.has(id));

    if (added.length === 0 && removed.length === 0) {
      onClose?.();
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (added.length > 0) {
        const rows = added.map((taskId) => ({
          task_id: taskId,
          executed_at: dateKey,
          ...(userId ? { user_id: userId } : {}),
        }));
        const { error: insertError } = await supabase.from('task_executions').insert(rows);
        if (insertError) throw insertError;
      }

      if (removed.length > 0) {
        let deleteQuery = supabase.from('task_executions').delete().eq('executed_at', dateKey).in('task_id', removed);
        if (userId) {
          deleteQuery = deleteQuery.eq('user_id', userId);
        }
        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
      }

      const finalIds = Array.from(currentIds);
      setInitialTaskIds(new Set(currentIds));
      setCheckedTaskIds(new Set(currentIds));
      onSaved?.(dateKey, finalIds);
      onClose?.();
    } catch (error) {
      console.error('Failed to save day management changes:', error);
      setErrorMessage('저장 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ minWidth: '280px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>{formatDateKeyToTitle(dateKey)}</h2>

        {isLoading ? (
          <p style={{ marginBottom: '1rem' }}>불러오는 중...</p>
        ) : tasks.length === 0 ? (
          <p style={{ marginBottom: '1rem' }}>등록된 결심이 없어요.</p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              maxHeight: '240px',
              overflowY: 'auto',
              marginBottom: '1rem',
            }}>
            {tasks.map((task) => (
              <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type='checkbox' checked={checkedTaskIds.has(task.id)} onChange={() => handleToggleTask(task.id)} disabled={isSaving || isLoading} />
                <span style={{ flex: 1 }}>{task.title}</span>
              </label>
            ))}
          </div>
        )}

        {errorMessage && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{errorMessage}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant='secondary' onClick={onClose} disabled={isSaving || isLoading}>
            취소
          </Button>
          <Button variant='primary' onClick={handleSave} disabled={isSaving || isLoading || tasks.length === 0}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
