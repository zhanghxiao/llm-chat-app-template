import React, { useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { getRankChange, getScoreChange } from '@/utils/dataProcessor';
import { exportAsImage, exportAsPDF } from '@/utils/exportUtils';
import { Download, Search, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type SortKey = 'rank0' | 'rank1' | 'rc' | 'sc' | 'name' | 'score0' | 'score1';

export default function RankingTable() {
  const { data } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const { students, examNames } = data;
  const last = examNames.length - 1;
  const [searchParams] = useSearchParams();
  const initSearch = searchParams.get('student') ? students.find(s => s.id === searchParams.get('student'))?.name ?? '' : '';
  const [search, setSearch] = useState(initSearch);
  const [sortKey, setSortKey] = useState<SortKey>('rc');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'same'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    let list = students.map(s => ({
      id: s.id, name: s.name,
      score0: s.exams[0]?.score ?? null,
      rank0: s.exams[0]?.rank ?? null,
      score1: s.exams[last]?.score ?? null,
      rank1: s.exams[last]?.rank ?? null,
      rc: getRankChange(s, 0, last),
      sc: getScoreChange(s, 0, last),
    }));

    if (search) list = list.filter(r => r.name.includes(search) || r.id.includes(search));
    if (filter === 'up') list = list.filter(r => (r.rc ?? 0) > 0);
    if (filter === 'down') list = list.filter(r => (r.rc ?? 0) < 0);
    if (filter === 'same') list = list.filter(r => r.rc === 0);

    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === null) return 1;
      if (vb === null) return -1;
      const v = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return sortDir === 'desc' ? -v : v;
    });
    return list;
  }, [students, sortKey, sortDir, search, filter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const SortHeader = ({ sk, label, align }: { sk: SortKey; label: string; align?: string }) => (
    <div onClick={() => toggleSort(sk)}
      className={`flex items-center gap-1 cursor-pointer select-none hover:text-[#2D2B26] transition-colors ${align === 'right' ? 'justify-end' : ''}`}>
      {label}
      <ArrowUpDown size={12} className={sortKey === sk ? 'text-[#3B5C9F]' : 'text-[#D4CFC4]'} />
    </div>
  );

  return (
    <div ref={ref} className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-tight text-[#2D2B26]">班级排名表</h1>
          <p className="text-sm text-[#6B685A] mt-1">
            {examNames[0]} → {examNames[last]} · {students.length} 人 · 点击行展开详情
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-xs h-8"
            onClick={() => ref.current && exportAsImage(ref.current, '排名表')}>
            <Download size={14} className="mr-1" />图片
          </Button>
          <Button variant="ghost" size="sm" className="text-[#6B685A] text-xs h-8"
            onClick={() => ref.current && exportAsPDF(ref.current, '排名表')}>
            <Download size={14} className="mr-1" />PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A99A]" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索姓名或学号..."
            className="pl-9 h-9 text-sm border-[#E8E4D9] bg-white"
          />
        </div>
        {(['all', 'up', 'down', 'same'] as const).map(f => (
          <Badge key={f} variant="outline"
            onClick={() => setFilter(f)}
            className={`cursor-pointer text-xs px-3 py-1.5 transition-colors border-[#E8E4D9] ${
              filter === f ? 'bg-[#3B5C9F]/10 text-[#3B5C9F] border-[#3B5C9F]/30' : 'text-[#6B685A] hover:bg-[#F5F2EB]'
            }`}>
            {f === 'all' ? '全部' : f === 'up' ? '进步' : f === 'down' ? '退步' : '不变'}
          </Badge>
        ))}
        <span className="text-xs text-[#B0A99A] ml-auto">{rows.length} 人</span>
      </div>

      {/* Table */}
      <Card className="border-[#E8E4D9] shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E8E4D9] hover:bg-transparent">
                <TableHead className="w-12 text-center text-xs text-[#B0A99A] font-normal py-3">#</TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 min-w-[80px]">
                  <SortHeader sk="name" label="姓名" />
                </TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 text-center min-w-[72px]">
                  <SortHeader sk="score0" label={examNames[0]} align="right" />
                </TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 text-center min-w-[56px]">
                  <SortHeader sk="rank0" label="排名" align="right" />
                </TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 text-center min-w-[72px]">
                  <SortHeader sk="score1" label={examNames[last]} align="right" />
                </TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 text-center min-w-[56px]">
                  <SortHeader sk="rank1" label="排名" align="right" />
                </TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 text-center min-w-[80px]">
                  <SortHeader sk="rc" label="排名变化" align="right" />
                </TableHead>
                <TableHead className="text-xs text-[#B0A99A] font-normal py-3 text-center min-w-[72px]">
                  <SortHeader sk="sc" label="分数变化" align="right" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const isExpanded = expanded.has(r.id);
                return (
                  <React.Fragment key={r.id}>
                    <TableRow
                      onClick={() => toggleExpand(r.id)}
                      className={`cursor-pointer transition-colors border-[#E8E4D9] hover:bg-[#F5F2EB] ${isExpanded ? 'bg-[#F5F2EB]' : ''}`}
                      style={i % 2 === 0 && !isExpanded ? { background: '#FDFBF7' } : {}}
                    >
                      <TableCell className="text-center text-xs text-[#B0A99A] font-display py-3">
                        {i + 1}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-[#2D2B26] py-3">
                        {r.name}
                      </TableCell>
                      <TableCell className="text-center font-display text-sm text-[#2D2B26] py-3">
                        {r.score0 ?? '—'}
                      </TableCell>
                      <TableCell className="text-center font-display text-sm text-[#6B685A] py-3">
                        {r.rank0 ?? '—'}
                      </TableCell>
                      <TableCell className="text-center font-display text-sm text-[#2D2B26] py-3">
                        {r.score1 ?? '—'}
                      </TableCell>
                      <TableCell className="text-center font-display text-sm text-[#6B685A] py-3">
                        {r.rank1 ?? '—'}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        {r.rc != null ? (
                          <span className={`inline-flex items-center justify-center gap-1 font-display text-sm font-medium ${r.rc > 0 ? 'text-[#2E7D5A]' : r.rc < 0 ? 'text-[#C4554D]' : 'text-[#B0A99A]'}`}>
                            {r.rc > 0 ? <TrendingUp size={14} /> : r.rc < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                            {r.rc > 0 ? `+${r.rc}` : r.rc < 0 ? String(r.rc) : '—'}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center font-display text-sm py-3">
                        {r.sc != null ? (
                          <span className={`font-medium ${r.sc > 0 ? 'text-[#2E7D5A]' : r.sc < 0 ? 'text-[#C4554D]' : 'text-[#B0A99A]'}`}>
                            {r.sc > 0 ? `+${r.sc}` : r.sc}
                          </span>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="border-[#E8E4D9] bg-[#F5F2EB]">
                        <TableCell colSpan={8} className="px-8 py-6">
                          <div className="grid grid-cols-4 gap-6">
                            <div>
                              <p className="text-xs text-[#B0A99A] mb-1">{examNames[0]}</p>
                              <p className="font-display text-3xl text-[#2D2B26]">{r.score0 ?? '—'}</p>
                              <p className="text-sm text-[#6B685A] mt-1">第 {r.rank0 ?? '—'} 名</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#B0A99A] mb-1">{examNames[last]}</p>
                              <p className="font-display text-3xl text-[#2D2B26]">{r.score1 ?? '—'}</p>
                              <p className="text-sm text-[#6B685A] mt-1">第 {r.rank1 ?? '—'} 名</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#B0A99A] mb-1">排名变化</p>
                              <p className={`font-display text-3xl ${r.rc != null ? (r.rc > 0 ? 'text-[#2E7D5A]' : r.rc < 0 ? 'text-[#C4554D]' : 'text-[#B0A99A]') : ''}`}>
                                {r.rc != null ? (r.rc > 0 ? `↑${r.rc}` : r.rc < 0 ? `↓${Math.abs(r.rc)}` : '—') : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#B0A99A] mb-1">分数变化</p>
                              <p className={`font-display text-3xl ${r.sc != null ? (r.sc > 0 ? 'text-[#2E7D5A]' : r.sc < 0 ? 'text-[#C4554D]' : '') : ''}`}>
                                {r.sc != null ? (r.sc > 0 ? `+${r.sc}` : r.sc) : '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
