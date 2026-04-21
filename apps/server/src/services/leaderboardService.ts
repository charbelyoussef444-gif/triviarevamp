interface SurvivalRow {
  nickname: string;
  score: number;
  roundsSurvived: number;
}

interface RankedRow {
  userId: string;
  nickname: string;
  rating: number;
  wins: number;
  matches: number;
}

const survivalRows: SurvivalRow[] = [];
const rankedRows = new Map<string, RankedRow>();

function ensureRankedUser(userId: string, nickname: string, seedRating = 1000): RankedRow {
  const existing = rankedRows.get(userId);
  if (existing) {
    if (nickname && existing.nickname !== nickname) existing.nickname = nickname;
    return existing;
  }
  const row: RankedRow = { userId, nickname, rating: seedRating, wins: 0, matches: 0 };
  rankedRows.set(userId, row);
  return row;
}

export const leaderboardService = {
  addSurvivalRun(row: SurvivalRow) {
    survivalRows.push(row);
    survivalRows.sort((a, b) => b.score - a.score || b.roundsSurvived - a.roundsSurvived);
    if (survivalRows.length > 50) survivalRows.length = 50;
  },

  topSurvival() {
    return survivalRows.slice(0, 20);
  },

  ensureRankedProfile(userId: string, nickname: string) {
    return ensureRankedUser(userId, nickname);
  },

  getRating(userId: string, nickname = 'Guest') {
    return ensureRankedUser(userId, nickname).rating;
  },

  applyRankedResult(players: Array<{ userId: string; nickname: string; isWinner: boolean }>) {
    for (const p of players) {
      const row = ensureRankedUser(p.userId, p.nickname);
      row.matches += 1;
      if (p.isWinner) {
        row.wins += 1;
        row.rating += 15;
      } else {
        row.rating = Math.max(100, row.rating - 10);
      }
    }
  },

  topRanked() {
    return [...rankedRows.values()]
      .sort((a, b) => b.rating - a.rating || b.wins - a.wins)
      .slice(0, 50);
  },
};
