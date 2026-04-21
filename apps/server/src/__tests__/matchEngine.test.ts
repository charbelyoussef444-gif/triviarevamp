import { describe, expect, it } from 'vitest';
import { MatchEngine } from '../engine/matchEngine.js';

const basePlayers = [
  { userId: 'u1', nickname: 'One', seatIndex: 0, isAlive: true, score: 0, connected: true },
  { userId: 'u2', nickname: 'Two', seatIndex: 1, isAlive: true, score: 0, connected: true },
  { userId: 'u3', nickname: 'Three', seatIndex: 2, isAlive: true, score: 0, connected: true },
];

describe('match engine progression', () => {
  it('progresses to question after all votes', () => {
    const engine = new MatchEngine();
    const state = engine.createMatch({ matchId: 'm1', mode: 'friends', players: structuredClone(basePlayers) });
    engine.startMatch(state.matchId);
    const target = engine.getMatch('m1')!.round.targetUserId!;
    const voters = basePlayers.map((p) => p.userId).filter((id) => id !== target);
    const categoryId = engine.getMatch('m1')!.round.categoryOptions[0]!.id;
    for (const voter of voters) engine.submitVote('m1', voter, categoryId);
    expect(engine.hasAllVotes('m1')).toBe(true);
    const resolved = engine.resolveVotes('m1');
    expect(resolved.state.round.question).toBeTruthy();
  });

  it('rejects target player voting (anti-cheat guard)', () => {
    const engine = new MatchEngine();
    const state = engine.createMatch({ matchId: 'm2', mode: 'ranked', players: structuredClone(basePlayers) });
    engine.startMatch(state.matchId);
    const target = engine.getMatch('m2')!.round.targetUserId!;
    const categoryId = engine.getMatch('m2')!.round.categoryOptions[0]!.id;
    expect(() => engine.submitVote('m2', target, categoryId)).toThrow();
  });

  it('can force eliminate disconnected player and resolve winner', () => {
    const engine = new MatchEngine();
    const state = engine.createMatch({
      matchId: 'm3',
      mode: 'ranked',
      players: [structuredClone(basePlayers[0]), structuredClone(basePlayers[1])],
    });
    engine.startMatch(state.matchId);
    const result = engine.eliminatePlayer('m3', 'u2');
    expect(result.eliminated).toBe(true);
    expect(result.state.status).toBe('ended');
    expect(result.state.winnerUserId).toBe('u1');
  });
});
