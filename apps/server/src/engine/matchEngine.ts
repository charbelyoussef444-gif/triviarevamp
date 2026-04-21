import {
  tallyVotes,
  resolveWinner,
  rollElimination,
  type MatchState,
  type PlayerState,
  type QuestionOption,
} from '@trivia/shared';
import { questionService } from '../services/questionService.js';
import type { ServerMatchState } from '../types/state.js';
import { secureRandom } from '../utils/random.js';

export class MatchEngine {
  private matches = new Map<string, ServerMatchState>();

  createMatch(seed: {
    matchId: string;
    mode: MatchState['mode'];
    players: PlayerState[];
    roomCode?: string;
    hostUserId?: string;
  }): ServerMatchState {
    const state: ServerMatchState = {
      matchId: seed.matchId,
      mode: seed.mode,
      status: 'waiting',
      players: seed.players,
      roomCode: seed.roomCode,
      hostUserId: seed.hostUserId,
      round: { roundNumber: 0, phase: 'lobby', categoryOptions: [], wrongAnswerEvents: 0 },
      createdAt: Date.now(),
      questionBankUsed: new Set(),
      votes: new Map(),
    };
    this.matches.set(seed.matchId, state);
    return state;
  }

  getMatch(matchId: string) {
    return this.matches.get(matchId);
  }

  startMatch(matchId: string) {
    const m = this.must(matchId);
    m.status = 'in_progress';
    return this.startNextRound(matchId);
  }

  startNextRound(matchId: string) {
    const m = this.must(matchId);
    m.round.roundNumber += 1;
    m.round.phase = 'spinner';
    m.votes.clear();

    const alive = m.players.filter((p) => p.isAlive);
    const target = alive[Math.floor(secureRandom() * alive.length)];
    if (!target) throw new Error('No alive players');

    m.round.targetUserId = target.userId;
    m.round.phase = 'voting';
    m.round.categoryOptions = questionService.getCategoryOptions();
    return m;
  }

  submitVote(matchId: string, userId: string, categoryId: string) {
    const m = this.must(matchId);
    const isEligible = m.players.some((p) => p.userId === userId && p.isAlive) && userId !== m.round.targetUserId;
    if (!isEligible) throw new Error('Voter is not eligible');
    m.votes.set(userId, categoryId);
    return this.resolveVotes(matchId);
  }

  resolveVotes(matchId: string) {
    const m = this.must(matchId);
    const counts = new Map<string, number>();
    for (const category of m.votes.values()) counts.set(category, (counts.get(category) ?? 0) + 1);
    const chosenCategory = tallyVotes(counts) ?? m.round.categoryOptions[0]?.id;
    if (!chosenCategory) throw new Error('No category available');

    m.round.chosenCategoryId = chosenCategory;
    m.round.phase = 'question';
    const q = questionService.getQuestionForCategory(chosenCategory, m.questionBankUsed);
    m.questionBankUsed.add(q.id);
    m.round.question = {
      id: q.id,
      categoryId: q.categoryId,
      prompt: q.prompt,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
    };
    m.correctOption = q.correctOption;
    return { state: m, chosenCategoryId: chosenCategory };
  }

  hasAllVotes(matchId: string) {
    const m = this.must(matchId);
    const eligibleVoters = m.players.filter((p) => p.isAlive && p.userId !== m.round.targetUserId).length;
    return m.votes.size >= Math.max(1, eligibleVoters);
  }

  submitAnswer(matchId: string, userId: string, option?: QuestionOption) {
    const m = this.must(matchId);
    const target = m.round.targetUserId;
    if (target !== userId) throw new Error('Only target can answer');
    const correct = option !== undefined && option === m.correctOption;

    if (correct) {
      const p = m.players.find((x) => x.userId === userId)!;
      p.score += 1;
      m.round.phase = 'round_result';
      return { correct: true, eliminated: false, chance: 0, state: m };
    }

    m.round.wrongAnswerEvents += 1;
    const risk = rollElimination(secureRandom(), m.round.wrongAnswerEvents - 1);
    let eliminated = false;
    if (risk.eliminated) {
      const p = m.players.find((x) => x.userId === userId)!;
      p.isAlive = false;
      eliminated = true;
    }

    this.resolveWinnerIfAny(m);
    return { correct: false, eliminated, chance: risk.chance, state: m };
  }

  setPlayerConnection(matchId: string, userId: string, connected: boolean) {
    const m = this.must(matchId);
    const p = m.players.find((x) => x.userId === userId);
    if (p) p.connected = connected;
  }

  eliminatePlayer(matchId: string, userId: string) {
    const m = this.must(matchId);
    const p = m.players.find((x) => x.userId === userId);
    if (!p || !p.isAlive) return { state: m, eliminated: false };
    p.isAlive = false;
    this.resolveWinnerIfAny(m);
    return { state: m, eliminated: true };
  }

  private resolveWinnerIfAny(m: ServerMatchState) {
    const winner = resolveWinner(m.players);
    if (winner) {
      m.winnerUserId = winner;
      m.status = 'ended';
      m.round.phase = 'ended';
    } else {
      m.round.phase = 'round_result';
    }
  }

  private must(matchId: string): ServerMatchState {
    const m = this.matches.get(matchId);
    if (!m) throw new Error('Match not found');
    return m;
  }
}

export const matchEngine = new MatchEngine();
