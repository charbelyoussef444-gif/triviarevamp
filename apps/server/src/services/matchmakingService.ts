import { GAME_CONFIG } from '@trivia/shared';
import type { RankedQueueEntry } from '../types/state.js';

const queue: RankedQueueEntry[] = [];

function bucketForRating(rating: number): string {
  if (rating < 900) return 'bronze';
  if (rating < 1200) return 'silver';
  return 'gold';
}

export const matchmakingService = {
  join(entry: RankedQueueEntry) {
    queue.push(entry);
    return { bucket: bucketForRating(entry.rating), queueSize: queue.length };
  },

  removeByUserId(userId: string) {
    const idx = queue.findIndex((q) => q.userId === userId);
    if (idx >= 0) queue.splice(idx, 1);
  },

  popMatchGroup(): RankedQueueEntry[] | undefined {
    const grouped = new Map<string, RankedQueueEntry[]>();
    for (const q of queue) {
      const key = bucketForRating(q.rating);
      const list = grouped.get(key) ?? [];
      list.push(q);
      grouped.set(key, list);
    }

    for (const entries of grouped.values()) {
      if (entries.length >= GAME_CONFIG.room.rankedMinPlayers) {
        const picked = entries.slice(0, Math.min(entries.length, GAME_CONFIG.room.rankedMaxPlayers));
        for (const p of picked) this.removeByUserId(p.userId);
        return picked;
      }
    }

    return undefined;
  },
};
