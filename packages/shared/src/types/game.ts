export type GameMode = 'friends' | 'ranked' | 'survival';

export type MatchStatus = 'waiting' | 'in_progress' | 'ended';

export type GamePhase =
  | 'lobby'
  | 'spinner'
  | 'target_selected'
  | 'voting'
  | 'question'
  | 'round_result'
  | 'ended';

export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface PlayerState {
  userId: string;
  nickname: string;
  seatIndex: number;
  isAlive: boolean;
  score: number;
  connected: boolean;
  rating?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Question {
  id: string;
  categoryId: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: QuestionOption;
  difficulty: number;
}

export interface RoundState {
  roundNumber: number;
  phase: GamePhase;
  targetUserId?: string;
  categoryOptions: Category[];
  chosenCategoryId?: string;
  question?: Omit<Question, 'correctOption'>;
  answerDeadlineTs?: number;
  wrongAnswerEvents: number;
}

export interface MatchState {
  matchId: string;
  mode: GameMode;
  status: MatchStatus;
  roomCode?: string;
  hostUserId?: string;
  players: PlayerState[];
  round: RoundState;
  winnerUserId?: string;
}
