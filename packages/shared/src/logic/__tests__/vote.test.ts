import { describe, it, expect } from 'vitest';
import { tallyVotes } from '../vote.js';

describe('vote tally', () => {
  it('picks highest votes', () => {
    const votes = new Map([
      ['cat1', 2],
      ['cat2', 4],
      ['cat3', 1],
    ]);
    expect(tallyVotes(votes)).toBe('cat2');
  });
});
