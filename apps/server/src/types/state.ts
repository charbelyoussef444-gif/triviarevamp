import type { MatchState, PlayerState, Question } from '@trivia/shared';

export interface ServerMatchState extends MatchState {
  createdAt: number;
  questionBankUsed: Set<string>;
  votes: Map<string, string>;
  correctOption?: Question['correctOption'];
}

export interface RankedQueueEntry {
  socketId: string;
  userId: string;
  nickname: string;
  rating: number;
  joinedAt: number;
}

export interface SocketIdentity {
  socketId: string;
  userId: string;
  nickname: string;
}

export type PlayerLookup = Map<string, { matchId: string; userId: string }>;

export function makePlayerState(userId: string, nickname: string, seatIndex: number, rating?: number): PlayerState {
  return { userId, nickname, seatIndex, isAlive: true, score: 0, connected: true, rating };
}
