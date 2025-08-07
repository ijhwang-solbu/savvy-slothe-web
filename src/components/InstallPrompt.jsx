'use client';
import React from 'react';

export default function InstallPrompt({ onInstall, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#3b82f6',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 999,
      }}>
      <p style={{ margin: 0 }}>홈 화면에 작심삼일을 설치해보세요!</p>
      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
        <button
          onClick={onInstall}
          style={{
            background: 'white',
            color: '#4CAF50',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
          설치
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: 'white',
            border: '1px solid white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}>
          닫기
        </button>
      </div>
    </div>
  );
}
