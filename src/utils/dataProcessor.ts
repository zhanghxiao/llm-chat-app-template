import * as XLSX from 'xlsx';
import type { ClassData, Student, ExamRecord } from '../types';

export function parseExcel(buffer: ArrayBuffer): ClassData {
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const header = raw[0] as string[];
  // Find exam column pairs: each pair is [nameCol, scoreCol, rankCol]
  const examPairs: { name: string; nameCol: number; scoreCol: number; rankCol: number }[] = [];

  for (let c = 1; c < header.length; c++) {
    const h = String(header[c] || '');
    if (h === '姓名') {
      const scoreName = String(header[c + 1] || '');
      if (scoreName && scoreName !== '姓名' && scoreName !== '班排' && scoreName !== '学号') {
        examPairs.push({ name: scoreName, nameCol: c, scoreCol: c + 1, rankCol: c + 2 });
      }
    }
  }

  // Build student map keyed by name
  const studentMap = new Map<string, { id: string; name: string; exams: Map<string, ExamRecord> }>();

  // First pass: collect IDs from first column
  const idMap = new Map<string, string>();
  for (let r = 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || !row[0]) continue;
    const id = String(row[0]);
    if (!/^\d+$/.test(id)) continue;
    const firstName = String(row[1] || '');
    if (firstName) idMap.set(firstName, id);
  }

  for (const exam of examPairs) {
    for (let r = 1; r < raw.length; r++) {
      const row = raw[r];
      if (!row) continue;
      const name = String(row[exam.nameCol] || '').trim();
      const score = Number(row[exam.scoreCol]);
      const rank = Number(row[exam.rankCol]);
      if (!name || isNaN(score)) continue;

      if (!studentMap.has(name)) {
        studentMap.set(name, { id: idMap.get(name) || '', name, exams: new Map() });
      }
      studentMap.get(name)!.exams.set(exam.name, { examName: exam.name, score, rank });
    }
  }

  const examNames = examPairs.map(e => e.name);
  const students: Student[] = Array.from(studentMap.values()).map(s => ({
    id: s.id,
    name: s.name,
    exams: examNames.map(en => s.exams.get(en)).filter((e): e is ExamRecord => !!e),
  }));

  return { examNames, students };
}

export function getExamScore(student: Student, examIndex: number): number | null {
  return student.exams[examIndex]?.score ?? null;
}

export function getExamRank(student: Student, examIndex: number): number | null {
  return student.exams[examIndex]?.rank ?? null;
}

export function getRankChange(student: Student, fromIdx: number, toIdx: number): number | null {
  const r1 = getExamRank(student, fromIdx);
  const r2 = getExamRank(student, toIdx);
  if (r1 === null || r2 === null) return null;
  return r1 - r2; // positive = improved
}

export function getScoreChange(student: Student, fromIdx: number, toIdx: number): number | null {
  const s1 = getExamScore(student, fromIdx);
  const s2 = getExamScore(student, toIdx);
  if (s1 === null || s2 === null) return null;
  return s2 - s1;
}

export function getClassAverage(students: Student[], examIndex: number): number {
  const scores = students.map(s => getExamScore(s, examIndex)).filter((s): s is number => s !== null);
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

export function getClassMax(students: Student[], examIndex: number): number {
  const scores = students.map(s => getExamScore(s, examIndex)).filter((s): s is number => s !== null);
  return scores.length ? Math.max(...scores) : 0;
}

export function getClassMin(students: Student[], examIndex: number): number {
  const scores = students.map(s => getExamScore(s, examIndex)).filter((s): s is number => s !== null);
  return scores.length ? Math.min(...scores) : 0;
}

export function getTopImprovers(students: Student[], fromIdx: number, toIdx: number, count = 5): Student[] {
  return [...students]
    .filter(s => getRankChange(s, fromIdx, toIdx) !== null)
    .sort((a, b) => (getRankChange(b, fromIdx, toIdx)!) - (getRankChange(a, fromIdx, toIdx)!))
    .slice(0, count);
}

export function getTopDecliners(students: Student[], fromIdx: number, toIdx: number, count = 5): Student[] {
  return [...students]
    .filter(s => getRankChange(s, fromIdx, toIdx) !== null)
    .sort((a, b) => (getRankChange(a, fromIdx, toIdx)!) - (getRankChange(b, fromIdx, toIdx)!))
    .slice(0, count);
}
