import type { PlayerState } from '../types/game.js';

export function resolveWinner(players: PlayerState[]): string | undefined {
  const alive = players.filter((p) => p.isAlive);
  if (alive.length === 1) return alive[0].userId;
  return undefined;
}

export function nextAliveTarget(players: PlayerState[], currentUserId?: string): string | undefined {
  const alive = players.filter((p) => p.isAlive);
  if (!alive.length) return undefined;
  if (!currentUserId) return alive[Math.floor(Math.random() * alive.length)]?.userId;

  const ordered = alive.sort((a, b) => a.seatIndex - b.seatIndex);
  const idx = ordered.findIndex((p) => p.userId === currentUserId);
  if (idx < 0) return ordered[0]?.userId;
  return ordered[(idx + 1) % ordered.length]?.userId;
}
