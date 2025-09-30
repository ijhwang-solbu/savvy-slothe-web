// 목적: 월간 캘린더 그리드 렌더링
// 원리: 전달받은 year/month와 일자별 실행 개수(statsMap)를 기준으로 DayCell 렌더
//디렉토리 : src/components/Calendar/CalendarGrid.jsx
import React from 'react';
import DayCell from './DayCell';

export default function CalendarGrid({ year, month, statsMap, onSelectDay }) {
  // month: 0~11 가정
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = Array.from({ length: last.getDate() }, (_, i) => i + 1);
  const daysInMonth = last.getDate();

  // 📌 1일의 요일 계산 (0=일 ~ 6=토)
  const offset = first.getDay();

  // 📌 KST 변환 함수 (날짜 Key 용)
  const toKstKey = (date) => {
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    return kstDate.toISOString().slice(0, 10);
  };

  // 📌 셀 리스트 구성: 앞쪽 빈 칸(null) + 날짜 객체 배열
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const dateKey = toKstKey(date);
      return { day: i + 1, dateKey, count: statsMap[dateKey] || 0 };
    }),
  ];

  return (
    <div className='grid grid-cols-7 gap-1'>
      {/* 🗓️ 요일 헤더 */}
      {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
        <div key={day} className='text-center font-semibold text-sm text-gray-300'>
          {day}
        </div>
      ))}

      {cells.map((cell, idx) => (cell ? <DayCell key={cell.dateKey} dateKey={cell.dateKey} day={cell.day} count={cell.count} onClick={() => onSelectDay(cell.dateKey)} /> : <div key={`empty-${idx}`} />))}
    </div>
  );
}
