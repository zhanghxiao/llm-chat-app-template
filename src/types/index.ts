export interface ExamRecord {
  examName: string;
  score: number;
  rank: number;
}

export interface Student {
  id: string;
  name: string;
  exams: ExamRecord[];
}

export interface ClassData {
  examNames: string[];
  students: Student[];
}
