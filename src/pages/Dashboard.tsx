import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/context/AppContext';
import {
  getClassAverage,
  getRankChange,
  getScoreChange,
} from '@/utils/dataProcessor';
import { exportAsImage, exportAsPDF } from '@/utils/exportUtils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { Student } from '@/types';

export default function Dashboard() {
  const { data } = useApp();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { students, examNames } = data;
  const last = examNames.length - 1;

  const avg0 = getClassAverage(students, 0);
  const avg1 = getClassAverage(students, last);
  const improved = students.filter(s => (getRankChange(s, 0, last) ?? 0) > 0).length;
  const declined = students.filter(s => (getRankChange(s, 0, last) ?? 0) < 0).length;

  type RankedStudent = Student & { rc: number; sc: number };
  const ranked = [...students]
    .map(s => ({ ...s, rc: getRankChange(s, 0, last) ?? 0, sc: getScoreChange(s, 0, last) ?? 0 }))
    .sort((a, b) => b.rc - a.rc);

  const topImprovers = ranked.filter(s => s.rc > 0).slice(0, 5);
  const topDecliners = ranked.filter(s => s.rc < 0).reverse().slice(0, 5);

  // Score dist comparison
  const bins = ['90+', '80-89', '70-79', '60-69', '50-59', '<50'];
  const ranges: [number, number][] = [[90, 100], [80, 89], [70, 79], [60, 69], [50, 59], [0, 49]];
  const distData = bins.map((label, i) => {
    const [lo, hi] = ranges[i];
    return {
      name: label,
      [examNames[0]]: students.filter(s => { const sc = s.exams[0]?.score; return sc != null && sc >= lo && sc <= hi; }).length,
      [examNames[last]]: students.filter(s => { const sc = s.exams[last]?.score; return sc != null && sc >= lo && sc <= hi; }).length,
    };
  });

  const stats = [
    { label: '班级人数', value: String(students.length), sub: '人', accent: false },
    { label: `${examNames[last]} 均分`, value: avg1.toFixed(1), sub: `${avg1 > avg0 ? '+' : ''}${(avg1 - avg0).toFixed(1)}`, accent: avg1 >= avg0 },
    { label: '进步人数', value: String(improved), sub: `${((improved / students.length) * 100).toFixed(0)}%`, accent: true },
    { label: '退步人数', value: String(declined), sub: `${((declined / students.length) * 100).toFixed(0)}%`, accent: false },
  ];

  const StudentRow = ({ s, rank, color }: { s: RankedStudent; rank: number; color: string }) => (
    <div
      onClick={() => navigate(`/ranking?student=${s.id}`)}
      className="flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer transition-colors hover:bg-[#F5F2EB] group"
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#B0A99A] w-5 text-right font-display">{rank}</span>
        <span className="text-sm text-[#2D2B26] group-hover:text-[#3B5C9F] transition-colors">
          {s.name}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-display" style={{ color }}>
          {s.rc > 0 ? `↑ ${s.rc}` : s.rc < 0 ? `↓ ${Math.abs(s.rc)}` : '—'}
        </span>
        <span className="text-xs text-[#6B685A] w-14 text-right">
          {s.sc > 0 ? `+${s.sc}` : s.sc}
        </span>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-[#2D2B26]">
            班级总览
          </h1>
          <p className="text-sm text-[#6B685A] mt-1">
            {examNames[0]} → {examNames[last]} · {students.length} 名学生
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-[12px] h-8"
            onClick={() => ref.current && exportAsImage(ref.current, '总览')}>
            <Download size={14} className="mr-1" />图片
          </Button>
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-[12px] h-8"
            onClick={() => ref.current && exportAsPDF(ref.current, '总览')}>
            <Download size={14} className="mr-1" />PDF
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 animate-fade-up delay-100">
        {stats.map((st, i) => (
          <Card key={st.label} className="border-[#E8E4D9] shadow-none" style={{ animationDelay: `${100 + i * 80}ms` }}>
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-xs font-normal text-[#B0A99A] uppercase tracking-wider">
                {st.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 px-5">
              <span className={`font-display text-3xl tracking-tight ${st.accent ? 'text-[#2E7D5A]' : 'text-[#2D2B26]'}`}>
                {st.value}
              </span>
              <span className="text-sm text-[#6B685A] ml-1.5">{st.sub}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns: top lists + dist chart */}
      <div className="grid grid-cols-2 gap-6">
        {/* Improvers */}
        <Card className="border-[#E8E4D9] shadow-none animate-fade-up delay-300">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[#2E7D5A] border-[#2E7D5A]/20 bg-[#2E7D5A]/5 text-xs">
                进步
              </Badge>
              <CardTitle className="text-sm font-medium text-[#2D2B26]">进步最大</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {topImprovers.map((s, i) => (
              <StudentRow key={s.id} s={s} rank={i + 1} color="#2E7D5A" />
            ))}
          </CardContent>
        </Card>

        {/* Decliners */}
        <Card className="border-[#E8E4D9] shadow-none animate-fade-up delay-400">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[#C4554D] border-[#C4554D]/20 bg-[#C4554D]/5 text-xs">
                退步
              </Badge>
              <CardTitle className="text-sm font-medium text-[#2D2B26]">退步最大</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            {topDecliners.map((s, i) => (
              <StudentRow key={s.id} s={s} rank={i + 1} color="#C4554D" />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Distribution chart */}
      <Card className="border-[#E8E4D9] shadow-none animate-fade-up delay-500">
        <CardHeader className="pb-2 pt-5 px-5">
          <CardTitle className="text-sm font-medium text-[#2D2B26]">分数段分布对比</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={distData} barGap={4} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6B685A', fontSize: 12 }} axisLine={{ stroke: '#E8E4D9' }} tickLine={false} />
              <YAxis tick={{ fill: '#6B685A', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Bar dataKey={examNames[0]} fill="#B0A99A" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey={examNames[0]} position="top" style={{ fill: '#B0A99A', fontSize: 11 }} />
              </Bar>
              <Bar dataKey={examNames[last]} fill="#3B5C9F" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList dataKey={examNames[last]} position="top" style={{ fill: '#3B5C9F', fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2 text-[11px] text-[#6B685A]">
              <span className="w-3 h-3 rounded-sm bg-[#B0A99A]" />{examNames[0]}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6B685A]">
              <span className="w-3 h-3 rounded-sm bg-[#3B5C9F]" />{examNames[last]}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
