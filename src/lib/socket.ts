import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle merit updates
    socket.on('merit:update', (data: { totalMerit: number; action: string }) => {
      // Broadcast merit update to all connected clients
      io.emit('merit:updated', {
        totalMerit: data.totalMerit,
        action: data.action,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle messages (keep existing functionality)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to WebSocket Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper function to broadcast merit updates
export const broadcastMeritUpdate = (io: Server, totalMerit: number, action: string) => {
  io.emit('merit:updated', {
    totalMerit,
    action,
    timestamp: new Date().toISOString(),
  });
};