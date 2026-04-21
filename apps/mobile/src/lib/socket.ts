import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@trivia/shared';

const url = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:4000';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
  autoConnect: true,
  transports: ['websocket'],
});
