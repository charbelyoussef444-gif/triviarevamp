import { GAME_CONFIG } from '@trivia/shared';
import { makeCode } from '../utils/random.js';

interface Room {
  roomCode: string;
  hostUserId: string;
  playerIds: string[];
}

const rooms = new Map<string, Room>();

export const roomService = {
  create(hostUserId: string) {
    let roomCode = makeCode();
    while (rooms.has(roomCode)) roomCode = makeCode();
    const room: Room = { roomCode, hostUserId, playerIds: [hostUserId] };
    rooms.set(roomCode, room);
    return room;
  },

  join(roomCode: string, userId: string) {
    const room = rooms.get(roomCode);
    if (!room) return { ok: false as const, message: 'Room not found' };
    if (!room.playerIds.includes(userId) && room.playerIds.length >= GAME_CONFIG.room.maxPlayers) {
      return { ok: false as const, message: 'Room is full' };
    }
    if (!room.playerIds.includes(userId)) room.playerIds.push(userId);
    return { ok: true as const, room };
  },

  get(roomCode: string) {
    return rooms.get(roomCode);
  },

  remove(roomCode: string) {
    rooms.delete(roomCode);
  },
};
