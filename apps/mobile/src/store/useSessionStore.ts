import { create } from 'zustand';
import type { MatchState } from '@trivia/shared';

interface SessionState {
  userId: string;
  nickname: string;
  roomCode?: string;
  match?: MatchState;
  leaderboard: Array<{ nickname: string; score: number; roundsSurvived: number }>;
  setNickname: (nickname: string) => void;
  setRoomCode: (roomCode?: string) => void;
  setMatch: (match?: MatchState) => void;
  setLeaderboard: (rows: Array<{ nickname: string; score: number; roundsSurvived: number }>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: `guest-${Math.random().toString(36).slice(2, 10)}`,
  nickname: '',
  leaderboard: [],
  setNickname: (nickname) => set({ nickname }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setMatch: (match) => set({ match }),
  setLeaderboard: (rows) => set({ leaderboard: rows }),
}));
