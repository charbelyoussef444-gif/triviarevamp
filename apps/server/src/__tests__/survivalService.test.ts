import { describe, expect, it } from 'vitest';
import { SurvivalService } from '../services/survivalService.js';

describe('survival service', () => {
  it('starts with question and timer', () => {
    const svc = new SurvivalService(() => 0.9, () => 1000, 5000);
    const started = svc.start('Neo');
    expect(started.status).toBe('ongoing');
    expect(started.question?.id).toBeTruthy();
    expect(started.deadlineTs).toBe(6000);
  });

  it('increments score on correct answer', () => {
    const svc = new SurvivalService(() => 0.9, () => 1000, 5000);
    const started = svc.start('Neo');
    const correct = ((Number(started.question!.id.split('-')[1]) - 1) % 4) + 1;
    const option = (['A', 'B', 'C', 'D'][correct - 1]) as 'A' | 'B' | 'C' | 'D';
    const next = svc.submitAnswer(started.sessionId, option);
    expect(next.score).toBe(1);
    expect(next.roundResult?.correct).toBe(true);
    expect(next.status).toBe('ongoing');
  });

  it('ends run on elimination', () => {
    const svc = new SurvivalService(() => 0.0, () => 1000, 5000);
    const started = svc.start('Neo');
    const result = svc.submitAnswer(started.sessionId, 'A');
    expect(result.status).toBe('ended');
    expect(result.roundResult?.eliminated).toBe(true);
  });

  it('ends run on timeout', () => {
    let now = 1000;
    const svc = new SurvivalService(() => 0.9, () => now, 1000);
    const started = svc.start('Neo');
    now = 2501;
    const result = svc.submitAnswer(started.sessionId, 'A');
    expect(result.status).toBe('ended');
    expect(result.roundResult?.timedOut).toBe(true);
  });
});
