import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { GAME_CONFIG, nicknameSchema } from '@trivia/shared';
import type { ClientToServerEvents, QuestionOption, ServerToClientEvents } from '@trivia/shared';
import { makePlayerState } from './types/state.js';
import { roomService } from './services/roomService.js';
import { matchEngine } from './engine/matchEngine.js';
import { matchmakingService } from './services/matchmakingService.js';
import { leaderboardService } from './services/leaderboardService.js';
import { survivalService } from './services/survivalService.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

const voteTimeMs = GAME_CONFIG.round.voteTimeSeconds * 1000;
const questionTimeMs = GAME_CONFIG.round.questionTimeSeconds * 1000;
const disconnectGraceMs = Number(process.env.DISCONNECT_GRACE_SECONDS ?? GAME_CONFIG.reconnectGraceSeconds) * 1000;

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/survival/start', (req, res) => {
  const nickname = nicknameSchema.safeParse(req.body.nickname);
  if (!nickname.success) return res.status(400).json({ message: 'Invalid nickname' });
  return res.json({ ok: true, ...survivalService.start(nickname.data) });
});

app.post('/survival/answer', (req, res) => {
  const sessionId = String(req.body.sessionId ?? '');
  const option = String(req.body.option ?? '') as 'A' | 'B' | 'C' | 'D';
  if (!sessionId || !['A', 'B', 'C', 'D'].includes(option)) {
    return res.status(400).json({ ok: false, message: 'Invalid payload' });
  }

  try {
    return res.json({ ok: true, ...survivalService.submitAnswer(sessionId, option) });
  } catch (error) {
    return res.status(400).json({ ok: false, message: (error as Error).message });
  }
});

app.get('/leaderboard/survival', (_req, res) => res.json({ ok: true, rows: leaderboardService.topSurvival() }));
app.get('/leaderboard/ranked', (_req, res) => res.json({ ok: true, rows: leaderboardService.topRanked() }));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
});

const userSocketMap = new Map<string, string>();
const socketUserMap = new Map<string, string>();
const userMatchMap = new Map<string, string>();
const roomToMatchMap = new Map<string, string>();
const voteTimers = new Map<string, NodeJS.Timeout>();
const answerTimers = new Map<string, NodeJS.Timeout>();
const nextRoundTimers = new Map<string, NodeJS.Timeout>();
const reconnectTimers = new Map<string, NodeJS.Timeout>();
const finalizedMatches = new Set<string>();

function broadcastState(matchId: string) {
  const state = matchEngine.getMatch(matchId);
  if (!state) return;
  io.to(matchId).emit('room:state', state);
}

function clearRoundTimers(matchId: string) {
  const timers = [voteTimers, answerTimers, nextRoundTimers];
  for (const timerMap of timers) {
    const t = timerMap.get(matchId);
    if (t) clearTimeout(t);
    timerMap.delete(matchId);
  }
}

function finalizeRankedIfNeeded(matchId: string) {
  const state = matchEngine.getMatch(matchId);
  if (!state || state.mode !== 'ranked' || state.status !== 'ended' || !state.winnerUserId || finalizedMatches.has(matchId)) return;

  leaderboardService.applyRankedResult(
    state.players.map((p) => ({ userId: p.userId, nickname: p.nickname, isWinner: p.userId === state.winnerUserId })),
  );
  for (const p of state.players) {
    const updated = leaderboardService.getRating(p.userId, p.nickname);
    p.rating = updated;
  }
  finalizedMatches.add(matchId);
}

function emitQuestion(matchId: string) {
  const state = matchEngine.getMatch(matchId);
  if (!state || !state.round.question || !state.round.targetUserId) return;

  const deadlineTs = Date.now() + questionTimeMs;
  io.to(matchId).emit('round:question_shown', { matchId, question: state.round.question, deadlineTs });

  answerTimers.set(
    matchId,
    setTimeout(() => {
      processAnswer(matchId, state.round.targetUserId!);
    }, questionTimeMs),
  );
}

function processAnswer(matchId: string, userId: string, option?: QuestionOption) {
  const state = matchEngine.getMatch(matchId);
  if (!state || state.status !== 'in_progress') return;
  clearTimeout(answerTimers.get(matchId));
  answerTimers.delete(matchId);

  const result = matchEngine.submitAnswer(matchId, userId, option);
  io.to(matchId).emit('round:answer_result', { matchId, correct: result.correct, correctOption: result.state.correctOption! });

  if (!result.correct) {
    io.to(matchId).emit('round:elimination_result', { matchId, userId, eliminated: result.eliminated, chance: result.chance });
  }

  if (result.state.status === 'ended' && result.state.winnerUserId) {
    clearRoundTimers(matchId);
    finalizeRankedIfNeeded(matchId);
    io.to(matchId).emit('match:ended', { matchId, winnerUserId: result.state.winnerUserId });
  } else {
    nextRoundTimers.set(matchId, setTimeout(() => beginRound(matchId), 1500));
  }

  broadcastState(matchId);
}

function lockVotesAndShowQuestion(matchId: string) {
  const state = matchEngine.getMatch(matchId);
  if (!state || state.round.phase !== 'voting') return;
  clearTimeout(voteTimers.get(matchId));
  voteTimers.delete(matchId);

  const resolved = matchEngine.resolveVotes(matchId);
  io.to(matchId).emit('round:vote_result', { matchId, chosenCategoryId: resolved.chosenCategoryId });
  emitQuestion(matchId);
  broadcastState(matchId);
}

function beginRound(matchId: string) {
  clearRoundTimers(matchId);
  const next = matchEngine.startNextRound(matchId);
  io.to(matchId).emit('round:start', { matchId, roundNumber: next.round.roundNumber });
  io.to(matchId).emit('round:spinner_started', { matchId });
  io.to(matchId).emit('round:target_selected', { matchId, targetUserId: next.round.targetUserId! });
  io.to(matchId).emit('round:vote_options', { matchId, options: next.round.categoryOptions, deadlineTs: Date.now() + voteTimeMs });

  voteTimers.set(matchId, setTimeout(() => lockVotesAndShowQuestion(matchId), voteTimeMs));
  broadcastState(matchId);
}

io.on('connection', (socket) => {
  socket.on('room:create', (payload, ack) => {
    const nick = nicknameSchema.safeParse(payload.nickname);
    if (!nick.success) return ack?.({ ok: false, message: 'Invalid nickname' });

    const room = roomService.create(payload.userId);
    const matchId = `m-${room.roomCode}`;
    const state = matchEngine.createMatch({
      matchId,
      mode: 'friends',
      roomCode: room.roomCode,
      hostUserId: payload.userId,
      players: [makePlayerState(payload.userId, payload.nickname, 0)],
    });

    roomToMatchMap.set(room.roomCode, matchId);
    userMatchMap.set(payload.userId, matchId);
    socket.join(matchId);
    userSocketMap.set(payload.userId, socket.id);
    socketUserMap.set(socket.id, payload.userId);
    ack?.({ ok: true, roomCode: room.roomCode });
    io.to(matchId).emit('room:state', state);
  });

  socket.on('room:join', (payload, ack) => {
    const joined = roomService.join(payload.roomCode, payload.userId);
    if (!joined.ok) return ack?.(joined);
    const matchId = roomToMatchMap.get(payload.roomCode);
    if (!matchId) return ack?.({ ok: false, message: 'Missing room mapping' });

    const state = matchEngine.getMatch(matchId);
    if (!state) return ack?.({ ok: false, message: 'Missing match' });

    const existing = state.players.find((p) => p.userId === payload.userId);
    if (!existing) {
      state.players.push(makePlayerState(payload.userId, payload.nickname, state.players.length));
    } else {
      existing.connected = true;
      const reconnectTimer = reconnectTimers.get(payload.userId);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimers.delete(payload.userId);
      io.to(matchId).emit('player:reconnected', { userId: payload.userId });
    }

    userMatchMap.set(payload.userId, matchId);
    socket.join(matchId);
    userSocketMap.set(payload.userId, socket.id);
    socketUserMap.set(socket.id, payload.userId);
    matchEngine.setPlayerConnection(matchId, payload.userId, true);
    ack?.({ ok: true });
    broadcastState(matchId);
  });

  socket.on('room:start', (payload, ack) => {
    const matchId = roomToMatchMap.get(payload.roomCode);
    if (!matchId) return ack?.({ ok: false, message: 'Missing room' });
    const state = matchEngine.getMatch(matchId);
    if (!state) return ack?.({ ok: false, message: 'Missing match' });
    if (state.hostUserId !== payload.userId) return ack?.({ ok: false, message: 'Host only' });
    if (state.players.filter((p) => p.connected).length < 2) return ack?.({ ok: false, message: 'Need at least 2 connected players' });

    matchEngine.startMatch(matchId);
    beginRound(matchId);
    ack?.({ ok: true });
  });

  socket.on('match:queue_join', (payload, ack) => {
    const trustedRating = leaderboardService.getRating(payload.userId, payload.nickname);
    const q = matchmakingService.join({
      ...payload,
      rating: trustedRating,
      socketId: socket.id,
      joinedAt: Date.now(),
    });
    ack?.({ ok: true });
    socket.emit('match:queue_status', { queued: true, bucket: q.bucket, queueSize: q.queueSize });

    const group = matchmakingService.popMatchGroup();
    if (!group) return;

    const matchId = `ranked-${Date.now()}`;
    const players = group.map((g, idx) => makePlayerState(g.userId, g.nickname, idx, leaderboardService.getRating(g.userId, g.nickname)));
    const state = matchEngine.createMatch({ matchId, mode: 'ranked', players });

    for (const g of group) {
      const s = io.sockets.sockets.get(g.socketId);
      s?.join(matchId);
      userSocketMap.set(g.userId, g.socketId);
      socketUserMap.set(g.socketId, g.userId);
      userMatchMap.set(g.userId, matchId);
      leaderboardService.ensureRankedProfile(g.userId, g.nickname);
      s?.emit('match:found', state);
    }

    matchEngine.startMatch(matchId);
    beginRound(matchId);
  });

  socket.on('round:submit_vote', (payload, ack) => {
    try {
      const state = matchEngine.getMatch(payload.matchId);
      if (!state || state.round.phase !== 'voting') return ack?.({ ok: false, message: 'Not voting phase' });
      matchEngine.submitVote(payload.matchId, payload.userId, payload.categoryId);
      ack?.({ ok: true });
      if (matchEngine.hasAllVotes(payload.matchId)) lockVotesAndShowQuestion(payload.matchId);
      broadcastState(payload.matchId);
    } catch (e) {
      ack?.({ ok: false, message: (e as Error).message });
    }
  });

  socket.on('round:submit_answer', (payload, ack) => {
    try {
      const state = matchEngine.getMatch(payload.matchId);
      if (!state || state.round.phase !== 'question') return ack?.({ ok: false, message: 'Not question phase' });
      processAnswer(payload.matchId, payload.userId, payload.option);
      ack?.({ ok: true });
    } catch (e) {
      ack?.({ ok: false, message: (e as Error).message });
    }
  });

  socket.on('leaderboard:get', (ack) => {
    ack?.({ ok: true, rows: leaderboardService.topSurvival() });
  });

  socket.on('disconnect', () => {
    const userId = socketUserMap.get(socket.id);
    if (!userId) return;
    socketUserMap.delete(socket.id);
    userSocketMap.delete(userId);

    const matchId = userMatchMap.get(userId);
    if (!matchId) return;
    const match = matchEngine.getMatch(matchId);
    if (!match) return;

    matchEngine.setPlayerConnection(matchId, userId, false);
    io.to(matchId).emit('player:disconnected', { userId });
    broadcastState(matchId);

    if (!['friends', 'ranked'].includes(match.mode) || match.status !== 'in_progress') return;

    const timer = setTimeout(() => {
      reconnectTimers.delete(userId);
      const refreshed = matchEngine.getMatch(matchId);
      if (!refreshed || refreshed.status === 'ended') return;
      const player = refreshed.players.find((p) => p.userId === userId);
      if (!player || player.connected || !player.isAlive) return;

      const eliminated = matchEngine.eliminatePlayer(matchId, userId);
      io.to(matchId).emit('round:elimination_result', { matchId, userId, eliminated: eliminated.eliminated, chance: 1 });

      const after = matchEngine.getMatch(matchId)!;
      if (after.status === 'ended' && after.winnerUserId) {
        finalizeRankedIfNeeded(matchId);
        io.to(matchId).emit('match:ended', { matchId, winnerUserId: after.winnerUserId });
      }
      broadcastState(matchId);
    }, disconnectGraceMs);

    reconnectTimers.set(userId, timer);
  });
});

const port = Number(process.env.PORT || 4000);
httpServer.listen(port, () => {
  console.log(`Server listening on :${port}`);
});
