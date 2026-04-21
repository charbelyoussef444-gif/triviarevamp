import { describe, it, expect } from 'vitest';
import { eliminationChanceFromWrongEvents, rollElimination } from '../risk.js';

describe('risk logic', () => {
  it('starts at base and increments', () => {
    expect(eliminationChanceFromWrongEvents(0)).toBe(0.3);
    expect(eliminationChanceFromWrongEvents(3)).toBe(0.45);
  });

  it('caps at max', () => {
    expect(eliminationChanceFromWrongEvents(20)).toBe(0.75);
  });

  it('rolls elimination using random', () => {
    expect(rollElimination(0.1, 0).eliminated).toBe(true);
    expect(rollElimination(0.99, 0).eliminated).toBe(false);
  });
});
