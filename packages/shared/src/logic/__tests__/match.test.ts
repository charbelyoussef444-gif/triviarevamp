import { describe, it, expect } from 'vitest';
import { resolveWinner } from '../match.js';

describe('winner resolution', () => {
  it('returns winner when one alive', () => {
    const winner = resolveWinner([
      { userId: 'a', nickname: 'A', seatIndex: 0, isAlive: false, score: 0, connected: true },
      { userId: 'b', nickname: 'B', seatIndex: 1, isAlive: true, score: 0, connected: true },
    ]);
    expect(winner).toBe('b');
  });
});
