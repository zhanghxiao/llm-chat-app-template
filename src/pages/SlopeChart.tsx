import { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getRankChange } from '@/utils/dataProcessor';
import { exportAsImage, exportAsPDF } from '@/utils/exportUtils';
import { Download } from 'lucide-react';

type SlopeData = {
  id: string; name: string;
  rank0: number; rank1: number;
  score0: number; score1: number;
  rc: number;
};

export default function SlopeChart() {
  const { data } = useApp();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { students, examNames } = data;
  const last = examNames.length - 1;
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'same'>('all');
  const [hovered, setHovered] = useState<string | null>(null);

  const slopeData: SlopeData[] = useMemo(() =>
    students.map(s => ({
      id: s.id, name: s.name,
      rank0: s.exams[0]?.rank ?? 0,
      rank1: s.exams[last]?.rank ?? 0,
      score0: s.exams[0]?.score ?? 0,
      score1: s.exams[last]?.score ?? 0,
      rc: getRankChange(s, 0, last) ?? 0,
    })),
  [students]);

  // Sort by rank0 for left column labels
  const leftSorted = useMemo(() => [...slopeData].sort((a, b) => a.rank0 - b.rank0), [slopeData]);
  const rightSorted = useMemo(() => [...slopeData].sort((a, b) => a.rank1 - b.rank1), [slopeData]);

  const filtered = useMemo(() => {
    if (filter === 'all') return slopeData;
    if (filter === 'up') return slopeData.filter(d => d.rc > 0);
    if (filter === 'down') return slopeData.filter(d => d.rc < 0);
    return slopeData.filter(d => d.rc === 0);
  }, [slopeData, filter]);

  const counts = {
    all: slopeData.length,
    up: slopeData.filter(d => d.rc > 0).length,
    down: slopeData.filter(d => d.rc < 0).length,
    same: slopeData.filter(d => d.rc === 0).length,
  };

  // SVG layout — wide enough for names on both sides
  const rowH = 22;
  const totalRows = slopeData.length;
  const padTop = 40;
  const padBottom = 10;
  const nameW = 90;
  const scoreW = 36;
  const rankW = 28;
  const lineAreaW = 260;
  const svgW = nameW + scoreW + rankW + lineAreaW + rankW + scoreW + nameW;
  const svgH = padTop + totalRows * rowH + padBottom;

  const leftLineX = nameW + scoreW + rankW;
  const rightLineX = leftLineX + lineAreaW;

  const yPos = (idx: number) => padTop + idx * rowH + rowH / 2;

  const getColor = (d: SlopeData) => d.rc > 0 ? '#2E7D5A' : d.rc < 0 ? '#C4554D' : '#B0A99A';

  const getLineColor = (d: SlopeData) => {
    if (hovered && d.id !== hovered) return '#E8E4D9';
    return getColor(d);
  };

  const getLineOpacity = (d: SlopeData) => {
    if (hovered && d.id !== hovered) return 0.3;
    if (hovered && d.id === hovered) return 1;
    return 0.5;
  };

  const getLineWidth = (d: SlopeData) => {
    if (hovered && d.id === hovered) return 2.5;
    if (hovered) return 0.8;
    return 1.2;
  };

  const getTextOpacity = (d: SlopeData) => {
    if (!hovered) return 1;
    return d.id === hovered ? 1 : 0.25;
  };

  // Map from student id to their index in left/right sorted arrays
  const leftIdxMap = new Map(leftSorted.map((d, i) => [d.id, i]));
  const rightIdxMap = new Map(rightSorted.map((d, i) => [d.id, i]));

  return (
    <div ref={ref} className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-[#2D2B26]">排名坡度图</h1>
          <p className="text-sm text-[#6B685A] mt-1">
            左: {examNames[0]} → 右: {examNames[last]} · 线条连接同一学生的两次排名
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-xs h-8"
            onClick={() => ref.current && exportAsImage(ref.current, '坡度图')}>
            <Download size={14} className="mr-1" />图片
          </Button>
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-xs h-8"
            onClick={() => ref.current && exportAsPDF(ref.current, '坡度图')}>
            <Download size={14} className="mr-1" />PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        {([
          { key: 'all', label: '全部' },
          { key: 'up', label: '进步' },
          { key: 'down', label: '退步' },
          { key: 'same', label: '不变' },
        ] as const).map(f => (
          <Badge key={f.key} variant="outline"
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer text-xs px-3 py-1 transition-colors border-[#E8E4D9] ${
              filter === f.key ? 'bg-[#3B5C9F]/10 text-[#3B5C9F] border-[#3B5C9F]/30' : 'text-[#6B685A] hover:bg-[#F5F2EB]'
            }`}>
            {f.label} ({counts[f.key]})
          </Badge>
        ))}
      </div>

      {/* SVG */}
      <Card className="border-[#E8E4D9] shadow-none overflow-x-auto">
        <CardContent className="p-4">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ minWidth: 600 }}>
            <defs>
              <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" /></filter>
            </defs>

            {/* Column headers */}
            <text x={nameW / 2} y={18} textAnchor="middle" fill="#2D2B26" fontSize={13} fontWeight={600} fontFamily="Noto Sans SC">
              {examNames[0]}
            </text>
            <text x={svgW - nameW / 2} y={18} textAnchor="middle" fill="#2D2B26" fontSize={13} fontWeight={600} fontFamily="Noto Sans SC">
              {examNames[last]}
            </text>
            <text x={nameW + scoreW / 2} y={18} textAnchor="middle" fill="#B0A99A" fontSize={10}>分数</text>
            <text x={leftLineX - rankW / 2} y={18} textAnchor="middle" fill="#B0A99A" fontSize={10}>名次</text>
            <text x={rightLineX + rankW / 2} y={18} textAnchor="middle" fill="#B0A99A" fontSize={10}>名次</text>
            <text x={rightLineX + rankW + scoreW / 2} y={18} textAnchor="middle" fill="#B0A99A" fontSize={10}>分数</text>

            {/* Horizontal grid lines */}
            {leftSorted.map((_, i) => (
              <line key={`grid-${i}`}
                x1={leftLineX} y1={yPos(i)} x2={rightLineX} y2={yPos(i)}
                stroke="#F0EDE6" strokeWidth={0.5} />
            ))}

            {/* Left column: names + scores + ranks (sorted by rank0) */}
            {leftSorted.map((d, i) => {
              const y = yPos(i);
              const op = getTextOpacity(d);
              const isH = hovered === d.id;
              return (
                <g key={`left-${d.id}`} opacity={op}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => navigate(`/ranking?student=${d.id}`)}>
                  <text x={nameW - 4} y={y + 4} textAnchor="end"
                    fill={isH ? getColor(d) : '#2D2B26'} fontSize={12}
                    fontWeight={isH ? 600 : 400} fontFamily="Noto Sans SC">
                    {d.name}
                  </text>
                  <text x={nameW + scoreW / 2} y={y + 4} textAnchor="middle"
                    fill="#6B685A" fontSize={11} fontFamily="Playfair Display">
                    {d.score0}
                  </text>
                  <text x={leftLineX - rankW / 2} y={y + 4} textAnchor="middle"
                    fill={isH ? getColor(d) : '#B0A99A'} fontSize={11} fontWeight={isH ? 600 : 400}
                    fontFamily="Playfair Display">
                    {d.rank0}
                  </text>
                </g>
              );
            })}

            {/* Right column: ranks + scores + names (sorted by rank1) */}
            {rightSorted.map((d, i) => {
              const y = yPos(i);
              const op = getTextOpacity(d);
              const isH = hovered === d.id;
              return (
                <g key={`right-${d.id}`} opacity={op}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(d.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => navigate(`/ranking?student=${d.id}`)}>
                  <text x={rightLineX + rankW / 2} y={y + 4} textAnchor="middle"
                    fill={isH ? getColor(d) : '#B0A99A'} fontSize={11} fontWeight={isH ? 600 : 400}
                    fontFamily="Playfair Display">
                    {d.rank1}
                  </text>
                  <text x={rightLineX + rankW + scoreW / 2} y={y + 4} textAnchor="middle"
                    fill="#6B685A" fontSize={11} fontFamily="Playfair Display">
                    {d.score1}
                  </text>
                  <text x={svgW - nameW + 4} y={y + 4} textAnchor="start"
                    fill={isH ? getColor(d) : '#2D2B26'} fontSize={12}
                    fontWeight={isH ? 600 : 400} fontFamily="Noto Sans SC">
                    {d.name}
                  </text>
                </g>
              );
            })}

            {/* Connecting lines */}
            {filtered.map(d => {
              const leftIdx = leftIdxMap.get(d.id) ?? 0;
              const rightIdx = rightIdxMap.get(d.id) ?? 0;
              const y0 = yPos(leftIdx);
              const y1 = yPos(rightIdx);
              const midX = (leftLineX + rightLineX) / 2;
              const path = `M ${leftLineX} ${y0} C ${midX} ${y0}, ${midX} ${y1}, ${rightLineX} ${y1}`;
              return (
                <g key={`line-${d.id}`}>
                  <path d={path} fill="none"
                    stroke={getLineColor(d)} strokeWidth={getLineWidth(d)}
                    opacity={getLineOpacity(d)} strokeLinecap="round" />
                  {/* Wider invisible hit area */}
                  <path d={path} fill="none" stroke="transparent" strokeWidth={10}
                    className="cursor-pointer"
                    onMouseEnter={() => setHovered(d.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => navigate(`/ranking?student=${d.id}`)} />
                  {/* Dots at endpoints */}
                  <circle cx={leftLineX} cy={y0} r={hovered === d.id ? 4 : 2}
                    fill={getLineColor(d)} opacity={hovered && d.id !== hovered ? 0.3 : 1} />
                  <circle cx={rightLineX} cy={y1} r={hovered === d.id ? 4 : 2}
                    fill={getLineColor(d)} opacity={hovered && d.id !== hovered ? 0.3 : 1} />
                </g>
              );
            })}

            {/* Hovered tooltip */}
            {hovered && (() => {
              const d = slopeData.find(s => s.id === hovered);
              if (!d) return null;
              const rightIdx = rightIdxMap.get(d.id) ?? 0;
              const y1 = yPos(rightIdx);
              const tooltipX = (leftLineX + rightLineX) / 2;
              const tooltipY = Math.max(30, Math.min(svgH - 50, (yPos(leftIdxMap.get(d.id) ?? 0) + y1) / 2));
              return (
                <g>
                  <rect x={tooltipX - 60} y={tooltipY - 22} width={120} height={44}
                    rx={6} fill="white" stroke="#E8E4D9" strokeWidth={1} filter="url(#shadow)" />
                  <text x={tooltipX} y={tooltipY - 4} textAnchor="middle"
                    fill="#2D2B26" fontSize={13} fontWeight={600} fontFamily="Noto Sans SC">
                    {d.name}
                  </text>
                  <text x={tooltipX} y={tooltipY + 14} textAnchor="middle"
                    fill={getColor(d)} fontSize={12} fontWeight={600} fontFamily="Playfair Display">
                    {d.rc > 0 ? `↑ ${d.rc} 名` : d.rc < 0 ? `↓ ${Math.abs(d.rc)} 名` : '排名不变'}
                  </text>
                </g>
              );
            })()}
          </svg>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex justify-center gap-8 text-xs text-[#6B685A]">
        <div className="flex items-center gap-2">
          <span className="w-5 h-0.5 rounded bg-[#2E7D5A]" />进步
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-0.5 rounded bg-[#C4554D]" />退步
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-0.5 rounded bg-[#B0A99A]" />不变
        </div>
      </div>
    </div>
  );
}
