import { z } from 'zod';

export const nicknameSchema = z
  .string()
  .min(2)
  .max(18)
  .regex(/^[a-zA-Z0-9_ -]+$/);

export const roomCodeSchema = z.string().length(6).regex(/^[A-Z0-9]+$/);

export const answerSchema = z.object({
  matchId: z.string().min(1),
  userId: z.string().min(1),
  option: z.enum(['A', 'B', 'C', 'D']),
});

export const voteSchema = z.object({
  matchId: z.string().min(1),
  userId: z.string().min(1),
  categoryId: z.string().min(1),
});
