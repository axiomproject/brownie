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
    upgradeTimeout: 30000, // 30 seconds
    transports: ['websocket', 'polling'],
    allowUpgrades: true
  });

  io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

export const emitNotification = (notification: any) => {
  if (io) {
    io.emit('notification', notification);
  }
};