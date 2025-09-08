// 목적: 날짜 셀 UI와 상태(오늘/개수)를 단순 시각화
// 원리: count>0이면 점 또는 숫자 노출
import React from 'react';

export default function DayCell({ dateKey, day, count, onClick }) {
  const isToday = dateKey === new Date().toISOString().slice(0, 10);

  const maxDots = 3; // ✅ 여기서 먼저 선언해줍니다
  const overflowCount = count > maxDots ? count - maxDots : 0;

  return (
    <button onClick={onClick} aria-label={`${dateKey} 실행 ${count}개`} className={`rounded border h-13 flex flex-col items-center justify-start p-1 text-sm ${isToday ? 'border-black' : 'border-gray-200'}`}>
      <div className='font-medium mb-1'>{day}</div>
      <div className='flex items-center justify-center gap-[-4px]'>
        {[...Array(Math.min(count, maxDots))].map((_, i) => (
          <div key={i} className='w-2.5 h-2.5 rounded-full bg-green-500 border border-white -ml-1 first:ml-0' style={{ zIndex: 10 - i }}></div>
        ))}
        {overflowCount > 0 && <span className='text-[10px] text-gray-600 ml-1'>+{overflowCount}</span>}
      </div>
      {/* <div className='text-xs'>{count > 0 ? `✅${count}` : ''}</div> */}
    </button>
  );
}
