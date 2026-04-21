import type { MatchState, GameMode, QuestionOption, Category } from '../types/game.js';

export interface ServerToClientEvents {
  'room:state': (state: MatchState) => void;
  'match:queue_status': (payload: { queued: boolean; bucket: string; queueSize: number }) => void;
  'match:found': (state: MatchState) => void;
  'round:start': (payload: { matchId: string; roundNumber: number }) => void;
  'round:spinner_started': (payload: { matchId: string }) => void;
  'round:target_selected': (payload: { matchId: string; targetUserId: string }) => void;
  'round:vote_options': (payload: { matchId: string; options: Category[]; deadlineTs: number }) => void;
  'round:vote_result': (payload: { matchId: string; chosenCategoryId: string }) => void;
  'round:question_shown': (payload: { matchId: string; question: { id: string; prompt: string; optionA: string; optionB: string; optionC: string; optionD: string }; deadlineTs: number }) => void;
  'round:answer_result': (payload: { matchId: string; correct: boolean; correctOption: QuestionOption }) => void;
  'round:elimination_result': (payload: { matchId: string; userId: string; eliminated: boolean; chance: number }) => void;
  'match:ended': (payload: { matchId: string; winnerUserId: string }) => void;
  'player:disconnected': (payload: { userId: string }) => void;
  'player:reconnected': (payload: { userId: string }) => void;
  'error:message': (payload: { message: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: { userId: string; nickname: string; mode: Extract<GameMode, 'friends'> }, ack?: (res: { ok: boolean; roomCode?: string; message?: string }) => void) => void;
  'room:join': (payload: { userId: string; nickname: string; roomCode: string }, ack?: (res: { ok: boolean; message?: string }) => void) => void;
  'room:start': (payload: { roomCode: string; userId: string }, ack?: (res: { ok: boolean; message?: string }) => void) => void;
  'match:queue_join': (payload: { userId: string; nickname: string; rating: number }, ack?: (res: { ok: boolean; message?: string }) => void) => void;
  'round:submit_vote': (payload: { matchId: string; userId: string; categoryId: string }, ack?: (res: { ok: boolean; message?: string }) => void) => void;
  'round:submit_answer': (payload: { matchId: string; userId: string; option: QuestionOption }, ack?: (res: { ok: boolean; message?: string }) => void) => void;
  'leaderboard:get': (ack?: (res: { ok: boolean; rows: Array<{ nickname: string; score: number; roundsSurvived: number }> }) => void) => void;
}
