export interface QuestionItem {
  id: 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9';
  part: 2 | 3;
  num: string;
  category: 'course' | 'lecturer';
  text: string;
  shortLabel: string;
}

export interface SurveyResponse {
  id: string;
  timestamp: number;
  time: string;
  dept: string;
  role?: string;
  gender?: string;
  scores: {
    q3: number;
    q4: number;
    q5: number;
    q6: number;
    q7: number;
    q8: number;
    q9: number;
  };
  avgPart2: number;
  avgPart3: number;
  avgOverall: number;
  q10: string; // 最大收穫或心得
  q11: string; // 改進建議
  q12: string; // 期待主題
}

export interface AggregateStats {
  totalCount: number;
  avgOverall: number;
  avgPart2: number;
  avgPart3: number;
  satisfactionRate: number; // percentage of >= 4
  questionAverages: {
    id: string;
    label: string;
    category: string;
    avg: number;
    distribution: Record<number, number>;
  }[];
  departmentBreakdown: {
    dept: string;
    count: number;
    percentage: number;
    avgOverall: number;
  }[];
  scoreDistribution: {
    score: number;
    label: string;
    count: number;
    percentage: number;
  }[];
}
