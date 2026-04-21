import { GAME_CONFIG } from '../constants/gameConfig.js';

export function eliminationChanceFromWrongEvents(wrongEvents: number): number {
  const chance = GAME_CONFIG.eliminationRisk.baseChance + wrongEvents * GAME_CONFIG.eliminationRisk.increasePerWrong;
  return Math.min(chance, GAME_CONFIG.eliminationRisk.maxChance);
}

export function rollElimination(randomValue: number, wrongEvents: number): { eliminated: boolean; chance: number } {
  const chance = eliminationChanceFromWrongEvents(wrongEvents);
  return { eliminated: randomValue < chance, chance };
}
