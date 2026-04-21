import type { Category, Question } from '@trivia/shared';
import { randomItem } from '../utils/random.js';

const categories: Category[] = [
  { id: 'science', name: 'Science' },
  { id: 'history', name: 'History' },
  { id: 'sports', name: 'Sports' },
  { id: 'movies', name: 'Movies' },
  { id: 'tech', name: 'Technology' },
  { id: 'music', name: 'Music' },
];

const questions: Question[] = Array.from({ length: 120 }).map((_, i) => {
  const cat = categories[i % categories.length]!;
  const answer = ((i % 4) + 1) as 1 | 2 | 3 | 4;
  return {
    id: `q-${i + 1}`,
    categoryId: cat.id,
    prompt: `${cat.name} challenge #${i + 1}: pick the matching number ${answer}`,
    optionA: '1',
    optionB: '2',
    optionC: '3',
    optionD: '4',
    correctOption: ['A', 'B', 'C', 'D'][answer - 1] as Question['correctOption'],
    difficulty: (i % 3) + 1,
  };
});

const byId = new Map(questions.map((q) => [q.id, q]));

export const questionService = {
  getCategoryOptions(): Category[] {
    return [...categories].sort(() => Math.random() - 0.5).slice(0, 3);
  },

  getQuestionForCategory(categoryId: string, used = new Set<string>()): Question {
    const pool = questions.filter((q) => q.categoryId === categoryId && !used.has(q.id));
    return randomItem(pool.length ? pool : questions.filter((q) => q.categoryId === categoryId));
  },

  getRandomQuestion(used = new Set<string>()): Question {
    const pool = questions.filter((q) => !used.has(q.id));
    return randomItem(pool.length ? pool : questions);
  },

  getQuestionById(id: string): Question | undefined {
    return byId.get(id);
  },

  listCategories(): Category[] {
    return categories;
  },
};
