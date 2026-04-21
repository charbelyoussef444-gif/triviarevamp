import { GAME_CONFIG, rollElimination, type QuestionOption } from '@trivia/shared';
import { leaderboardService } from './leaderboardService.js';
import { questionService } from './questionService.js';
import { secureRandom } from '../utils/random.js';

type PublicQuestion = {
  id: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  categoryId: string;
};

interface SurvivalSession {
  sessionId: string;
  nickname: string;
  score: number;
  roundsSurvived: number;
  wrongEvents: number;
  streak: number;
  bestStreak: number;
  usedQuestionIds: Set<string>;
  currentQuestionId: string;
  deadlineTs: number;
  ended: boolean;
}

export class SurvivalService {
  constructor(
    private readonly randomFn: () => number = secureRandom,
    private readonly nowFn: () => number = Date.now,
    private readonly questionTimeMs = GAME_CONFIG.round.questionTimeSeconds * 1000,
  ) {}

  private sessions = new Map<string, SurvivalSession>();

  start(nickname: string) {
    const sessionId = `surv-${this.nowFn()}-${Math.floor(this.randomFn() * 10_000)}`;
    const question = questionService.getRandomQuestion();
    const session: SurvivalSession = {
      sessionId,
      nickname,
      score: 0,
      roundsSurvived: 0,
      wrongEvents: 0,
      streak: 0,
      bestStreak: 0,
      usedQuestionIds: new Set([question.id]),
      currentQuestionId: question.id,
      deadlineTs: this.nowFn() + this.questionTimeMs,
      ended: false,
    };
    this.sessions.set(sessionId, session);
    return this.toPayload(session, question, undefined, true);
  }

  submitAnswer(sessionId: string, option: QuestionOption) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (session.ended) throw new Error('Session already ended');

    const q = questionService.getQuestionById(session.currentQuestionId);
    if (!q) throw new Error('Question not found');

    const timedOut = this.nowFn() > session.deadlineTs;
    const correct = !timedOut && option === q.correctOption;

    session.roundsSurvived += 1;

    if (correct) {
      session.score += 1;
      session.streak += 1;
      session.bestStreak = Math.max(session.bestStreak, session.streak);
      const nextQ = questionService.getRandomQuestion(session.usedQuestionIds);
      session.usedQuestionIds.add(nextQ.id);
      session.currentQuestionId = nextQ.id;
      session.deadlineTs = this.nowFn() + this.questionTimeMs;
      return this.toPayload(session, nextQ, { correct: true, timedOut: false, eliminated: false, chance: 0 }, false);
    }

    session.streak = 0;
    const risk = rollElimination(this.randomFn(), session.wrongEvents);
    session.wrongEvents += 1;

    if (risk.eliminated || timedOut) {
      session.ended = true;
      leaderboardService.addSurvivalRun({
        nickname: session.nickname,
        score: session.score,
        roundsSurvived: session.roundsSurvived,
      });
      return this.toPayload(session, undefined, { correct: false, timedOut, eliminated: true, chance: timedOut ? 1 : risk.chance }, false);
    }

    const nextQ = questionService.getRandomQuestion(session.usedQuestionIds);
    session.usedQuestionIds.add(nextQ.id);
    session.currentQuestionId = nextQ.id;
    session.deadlineTs = this.nowFn() + this.questionTimeMs;
    return this.toPayload(session, nextQ, { correct: false, timedOut: false, eliminated: false, chance: risk.chance }, false);
  }

  private toPayload(
    session: SurvivalSession,
    question: ReturnType<typeof questionService.getRandomQuestion> | undefined,
    roundResult: { correct: boolean; timedOut: boolean; eliminated: boolean; chance: number } | undefined,
    started: boolean,
  ) {
    const publicQuestion: PublicQuestion | undefined = question
      ? {
          id: question.id,
          prompt: question.prompt,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          categoryId: question.categoryId,
        }
      : undefined;

    return {
      sessionId: session.sessionId,
      status: session.ended ? 'ended' : 'ongoing',
      started,
      score: session.score,
      roundsSurvived: session.roundsSurvived,
      streak: session.streak,
      bestStreak: session.bestStreak,
      wrongEvents: session.wrongEvents,
      dangerMeter: Math.round(Math.min(0.3 + session.wrongEvents * 0.05, 0.75) * 100),
      deadlineTs: session.ended ? undefined : session.deadlineTs,
      question: publicQuestion,
      roundResult,
    };
  }
}

export const survivalService = new SurvivalService();
