import { describe, expect, it } from 'vitest';
import { leaderboardService } from '../services/leaderboardService.js';

describe('ranked leaderboard service', () => {
  it('applies rating updates for winner and losers', () => {
    leaderboardService.ensureRankedProfile('u100', 'Winner');
    leaderboardService.ensureRankedProfile('u101', 'Loser');

    const beforeWinner = leaderboardService.getRating('u100', 'Winner');
    const beforeLoser = leaderboardService.getRating('u101', 'Loser');

    leaderboardService.applyRankedResult([
      { userId: 'u100', nickname: 'Winner', isWinner: true },
      { userId: 'u101', nickname: 'Loser', isWinner: false },
    ]);

    expect(leaderboardService.getRating('u100', 'Winner')).toBe(beforeWinner + 15);
    expect(leaderboardService.getRating('u101', 'Loser')).toBe(beforeLoser - 10);
  });
});
