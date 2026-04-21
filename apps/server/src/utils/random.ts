import crypto from 'node:crypto';

export function secureRandom(): number {
  return crypto.randomInt(0, 1_000_000) / 1_000_000;
}

export function randomItem<T>(items: T[]): T {
  return items[Math.floor(secureRandom() * items.length)]!;
}

export function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) out += chars[Math.floor(secureRandom() * chars.length)];
  return out;
}
