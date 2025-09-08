// 목적: 메인 상단에서 월간 집계 표시 + 월 전환
// 원리: year/month 상태로 Supabase 쿼리(집계) 결과를 statsMap으로 내려서 CalendarGrid 렌더
// 디렉토리 : src/components/Main/MainCalendarPanel.jsx
'use client';
import { useEffect, useState } from 'react';
import CalendarGrid from '../Calendar/CalendarGrid';
import { supabase } from '@/lib/supabase'; // 레포 경로에 맞게 조정

export default function MainCalendarPanel({ statsMap, setStatsMap, onSelectDay }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0~11
  // const [statsMap, setStatsMap] = useState({}); // {'2025-09-04': 3, ...}
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  // 목적: 월 범위의 일자별 실행 개수를 로드
  useEffect(() => {
    // 원리: task_executions에서 해당 월 범위로 distinct task_id count 그룹화
    const load = async () => {
      const from = monthStart.toISOString();
      const to = monthEnd.toISOString();
      const { data, error } = await supabase.from('task_executions').select('task_id, executed_at').gte('executed_at', from).lt('executed_at', to);

      if (error) {
        console.error(error);
        return;
      }

      // ✅ KST 기준으로 날짜별 distinct task_id 집계
      const map = {};
      data.forEach((row) => {
        const dateKey = row.executed_at.slice(0, 10);
        if (!map[dateKey]) map[dateKey] = new Set();
        map[dateKey].add(row.task_id);
      });

      const finalized = Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.size]));
      setStatsMap(finalized);
    };
    load();
  }, [year, month]);

  //
  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <section className='mb-4'>
      <div className='flex items-center justify-between mb-2'>
        <button onClick={prevMonth} aria-label='이전 달'>
          ◀
        </button>
        <h2 className='text-lg font-semibold'>
          {year}년 {month + 1}월
        </h2>
        <button onClick={nextMonth} aria-label='다음 달'>
          ▶
        </button>
      </div>

      <CalendarGrid year={year} month={month} statsMap={statsMap} onSelectDay={onSelectDay} />
    </section>
  );
}
