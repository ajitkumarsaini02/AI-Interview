export interface CurriculumModule {
  n: number;
  title: string;
  days: [number, number];
}

export interface CurriculumDay {
  day: number;
  title: string;
  type: 'SETUP' | 'BUILD' | 'AI_CORE' | 'SHIP_IT' | 'LEARN' | 'OPTIMIZE' | 'CAPSTONE';
  tools: string[];
  objectives: string[];
}

export interface CurriculumData {
  cohort: string;
  modules: CurriculumModule[];
  days: CurriculumDay[];
}
