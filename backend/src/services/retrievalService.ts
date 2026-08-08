import fs from 'fs';
import path from 'path';

export interface CurriculumDayItem {
  day: number;
  title: string;
  type: string;
  tools: string[];
  objectives: string[];
}

export class RetrievalService {
  private curriculumDays: CurriculumDayItem[] = [];

  constructor() {
    this.loadCurriculum();
  }

  private loadCurriculum() {
    const possiblePaths = [
      path.resolve(process.cwd(), '..', 'data', 'curriculum.json'),
      path.resolve(process.cwd(), 'data', 'curriculum.json'),
      path.resolve(__dirname, '..', '..', '..', 'data', 'curriculum.json'),
      path.resolve(__dirname, '..', '..', 'curriculum.json'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8');
          const data = JSON.parse(content);
          this.curriculumDays = (data.days || []).map((d: any) => ({
            day: d.day,
            title: d.title,
            type: d.type || 'CONCEPT',
            tools: d.tools || [],
            objectives: d.objectives || [],
          }));
          break;
        } catch (err) {
          console.error(`Error reading ${p}:`, err);
        }
      }
    }
  }

  getDayInfo(day: number): CurriculumDayItem {
    const found = this.curriculumDays.find(d => d.day === day);
    if (found) return found;

    return {
      day,
      title: `Day ${day} Curriculum Concept`,
      type: 'CONCEPT',
      tools: ['AI Tools'],
      objectives: [
        `Understand core principles of Day ${day}`,
        `Apply engineering patterns for Day ${day}`,
        'Analyze trade-offs and performance characteristics',
      ],
    };
  }

  getAllDays(): CurriculumDayItem[] {
    return this.curriculumDays;
  }
}

export const retrievalService = new RetrievalService();
