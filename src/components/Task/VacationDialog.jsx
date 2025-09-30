import React, { useEffect, useMemo, useState } from 'react';

const DATE_LENGTH = 50;

const toDateString = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateInput = (value) => {
  if (!value) return null;
  const source = value.includes('T') ? value.split('T')[0] : value;
  const parts = source.split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getTomorrowString = () => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return toDateString(now);
};

export default function VacationDialog({ open, onClose, onSave, defaultStartDate, mode = 'create' }) {
  const minimumStartDate = useMemo(() => getTomorrowString(), []);

  const [startDate, setStartDate] = useState(minimumStartDate);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      setStartDate(defaultStartDate || minimumStartDate);
      setErrorMessage('');
      setIsSaving(false);
    }
  }, [open, defaultStartDate, minimumStartDate]);

  const endDate = useMemo(() => {
    const parsed = parseDateInput(startDate);
    if (!parsed) return '';
    parsed.setDate(parsed.getDate() + DATE_LENGTH - 1);
    return toDateString(parsed);
  }, [startDate]);

  const handleStartDateChange = (event) => {
    const value = event.target.value;
    setStartDate(value);
  };

  const handleSave = async () => {
    if (!startDate) {
      setErrorMessage('방학 시작일을 선택해주세요.');
      return;
    }
    if (!endDate) {
      setErrorMessage('종료일 계산에 실패했습니다. 다시 시도해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage('');
      await onSave?.({ startDate, endDate });
    } catch (error) {
      const label = mode === 'update' ? '방학 수정' : '방학 신청';
      setErrorMessage(error?.message || `${label}에 실패했습니다. 다시 시도해주세요.`);
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div
      role='dialog'
      aria-modal='true'
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 1000,
      }}>
      <div
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(17, 24, 39, 0.25)',
        }}>
        <header style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{mode === 'update' ? '방학 수정' : '방학 신청'}</h2>
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: '#4b5563' }}>방학 기간은 50일이며, 방학이 끝난 뒤 2개월 후 다시 방학을 할 수 있어요.</p>
        </header>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }} htmlFor='vacation-start-date'>
            시작일
          </label>
          <input
            id='vacation-start-date'
            type='date'
            value={startDate || ''}
            onChange={handleStartDateChange}
            min={minimumStartDate} // ✅내일부터만 선택 가능
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '0.95rem',
              color: '#000',
            }}
          />

          <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
            종료일은 자동으로 <strong>{endDate || '-'}</strong> 로 설정됩니다.
          </div>
        </section>

        {errorMessage && <div style={{ marginBottom: '16px', color: '#b91c1c', fontSize: '0.85rem' }}>{errorMessage}</div>}

        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type='button'
            onClick={() => {
              if (!isSaving) {
                onClose?.();
              }
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}>
            취소
          </button>
          <button
            type='button'
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: isSaving ? '#9ca3af' : '#2563eb',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 600,
              border: 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}>
            {isSaving ? (mode === 'update' ? '수정 중...' : '저장 중...') : mode === 'update' ? '수정' : '저장'}
          </button>
        </footer>
      </div>
    </div>
  );
}
