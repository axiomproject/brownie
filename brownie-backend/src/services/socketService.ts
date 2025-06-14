import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer;

export const initializeSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        process.env.FRONTEND_URL || 'https://brownie-jcv.netlify.app'
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    transports: ['websocket', 'polling'],
    connectTimeout: 45000,
    path: '/socket.io'
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', reason);
    });

    socket.on('reconnect_attempt', () => {
      console.log('Attempting to reconnect...');
    });
  });

  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });
};

export const emitNotification = (notification: any) => {
  if (io) {
    io.emit('notification', notification);
  }
};