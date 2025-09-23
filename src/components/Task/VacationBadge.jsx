import React from 'react';

const formatDate = (value) => {
  if (!value) return '';
  const normalized = value.includes('T') ? value.split('T')[0] : value;
  return normalized.replace(/-/g, '.');
};

export default function VacationBadge({ startDate, endDate }) {
  if (!startDate || !endDate) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '9999px',
        backgroundColor: '#fef3c7',
        color: '#92400e',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}>
      <span>방학 중</span>
      <span>
        {formatDate(startDate)} ~ {formatDate(endDate)}
      </span>
    </span>
  );
}
