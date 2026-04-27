import { useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getRankChange, getScoreChange } from '@/utils/dataProcessor';
import { exportAsImage, exportAsPDF } from '@/utils/exportUtils';
import { Download } from 'lucide-react';

export default function RankingRace() {
  const { data } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const { students, examNames } = data;
  const last = examNames.length - 1;
  const [currentExam, setCurrentExam] = useState(last);

  // Show ALL students sorted by score for current exam
  const barData = useMemo(() =>
    students
      .filter(s => s.exams[currentExam])
      .map(s => ({ name: s.name, value: s.exams[currentExam].score }))
      .sort((a, b) => b.value - a.value),
  [students, currentExam]);

  const option = {
    grid: { left: 80, right: 56, top: 8, bottom: 24 },
    xAxis: {
      type: 'value' as const, max: 100,
      axisLabel: { color: '#B0A99A', fontSize: 12 },
      splitLine: { lineStyle: { color: '#E8E4D9', type: 'dashed' as const } },
      axisLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: barData.map(d => d.name).reverse(),
      axisLabel: { color: '#2D2B26', fontSize: 13, fontFamily: 'Noto Sans SC' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: barData.map((d, i) => ({
        value: d.value,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: i < 5 ? '#3B5C9F' : i < 15 ? '#6B8CC4' : i < 30 ? '#A0B5D8' : '#D4CFC4',
        },
      })).reverse(),
      barMaxWidth: 18,
      label: {
        show: true, position: 'right' as const,
        formatter: '{c}', color: '#6B685A', fontSize: 12, fontFamily: 'Playfair Display',
      },
      animationDuration: 800,
      animationDurationUpdate: 1200,
      animationEasing: 'cubicInOut' as const,
      animationEasingUpdate: 'cubicInOut' as const,
    }],
  };

  // All rank changes
  const rankData = useMemo(() =>
    [...students]
      .map(s => ({ name: s.name, id: s.id, rc: getRankChange(s, 0, last) ?? 0, sc: getScoreChange(s, 0, last) ?? 0 }))
      .sort((a, b) => b.rc - a.rc),
  [students]);

  return (
    <div ref={ref} className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-[#2D2B26]">排名赛跑</h1>
          <p className="text-sm text-[#6B685A] mt-1">全班成绩排行 · 点击切换考试</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-xs h-8"
            onClick={() => ref.current && exportAsImage(ref.current, '赛跑图')}>
            <Download size={14} className="mr-1" />图片
          </Button>
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-xs h-8"
            onClick={() => ref.current && exportAsPDF(ref.current, '赛跑图')}>
            <Download size={14} className="mr-1" />PDF
          </Button>
        </div>
      </div>

      {/* Exam switcher */}
      <div className="flex gap-2">
        {examNames.map((name, i) => (
          <Badge key={name} variant="outline"
            onClick={() => setCurrentExam(i)}
            className={`cursor-pointer text-sm px-4 py-1.5 transition-colors border-[#E8E4D9] ${
              currentExam === i ? 'bg-[#3B5C9F]/10 text-[#3B5C9F] border-[#3B5C9F]/30 font-medium' : 'text-[#6B685A] hover:bg-[#F5F2EB]'
            }`}>
            {name}
          </Badge>
        ))}
      </div>

      {/* Bar chart */}
      <Card className="border-[#E8E4D9] shadow-none">
        <CardContent className="pt-4 pb-2">
          <ReactECharts option={option} style={{ height: barData.length * 24 + 60 }} notMerge />
        </CardContent>
      </Card>

      {/* Full rank change list */}
      <Card className="border-[#E8E4D9] shadow-none">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-medium text-[#2D2B26]">
            排名变化总览 · 全班 {rankData.length} 人
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5 px-5">
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            {rankData.map(s => (
              <div key={s.id} className="flex items-center justify-between py-1 border-b border-[#F0EDE6]">
                <span className="text-sm text-[#2D2B26]">{s.name}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-display text-sm ${s.rc > 0 ? 'text-[#2E7D5A]' : s.rc < 0 ? 'text-[#C4554D]' : 'text-[#B0A99A]'}`}>
                    {s.rc > 0 ? `↑${s.rc}` : s.rc < 0 ? `↓${Math.abs(s.rc)}` : '—'}
                  </span>
                  <span className="text-xs text-[#B0A99A] w-10 text-right">
                    {s.sc > 0 ? `+${s.sc}` : s.sc}分
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
