import { io } from 'socket.io-client';

const SERVER_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
  .replace(/\/api\/?$/, '');

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_ORIGIN, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
