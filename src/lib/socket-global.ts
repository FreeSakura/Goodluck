import { Server } from 'socket.io';

// Global variable to store Socket.IO server instance
let globalIo: Server | null = null;

export const setGlobalIo = (io: Server) => {
  globalIo = io;
};

export const getGlobalIo = (): Server | null => {
  return globalIo;
};