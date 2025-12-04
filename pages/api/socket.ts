import { Server as HttpServer } from 'http';
import { Server as NetServer, Socket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

// Custom Next.js API response type with Socket.IO support
export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

const rooms = new Map<string, Map<string, any>>();

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  // Initialize Socket.IO only once
  if (!res.socket.server.io) {
    console.log('[Socket.IO] Initializing new Socket.IO server...');
    const httpServer: HttpServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket/',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['polling', 'websocket'], // Keep both for flexibility, polling will be used by Vercel
    });

    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      // Global client count
      io.emit('client-count', io.engine.clientsCount);

      // Global audio-data (broadcast to all except sender)
      socket.on('audio-data', (data: any) => {
        // If roomId is provided, broadcast only to that room
        if (data && data.roomId) {
          const room = data.roomId;
          if (rooms.has(room)) {
            const roomClients = rooms.get(room)!;
            const existing = roomClients.get(socket.id) || {};
            roomClients.set(socket.id, {
              ...existing,
              id: socket.id,
              deviceType: existing.deviceType || data.deviceType || (socket.handshake.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'),
              frequencies: data.frequencies,
              timestamp: data.timestamp || Date.now(),
            });
          }

          socket.broadcast.to(room).emit('audio-update', {
            frequencies: data.frequencies,
            timestamp: data.timestamp || Date.now(),
            clientId: socket.id,
            deviceType: data.deviceType || 'unknown',
          });

          // Optionally emit a lightweight room-users-update
          const roomClients = rooms.get(room);
          if (roomClients) {
            io.to(room).emit('room-users-update', Object.fromEntries(roomClients.entries()));
          }
        } else {
          socket.broadcast.emit('audio-update', {
            frequencies: data.frequencies,
            timestamp: data.timestamp || Date.now(),
            clientId: socket.id,
          });
        }
      });

      socket.on('join-room', (options: any) => {
        const { roomId, deviceType } = options || {};
        const room = roomId || 'default';

        socket.join(room);

        if (!rooms.has(room)) rooms.set(room, new Map());
        const roomClients = rooms.get(room)!;

        roomClients.set(socket.id, {
          id: socket.id,
          deviceType: deviceType || (socket.handshake.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop'),
          frequencies: new Array(256).fill(0),
          timestamp: Date.now(),
        });

        // Emit the updated list to everyone in the room
        const usersList = Object.fromEntries(roomClients.entries());
        io.to(room).emit('room-users-update', usersList);
      });

      socket.on('disconnecting', () => {
        // Remove from any rooms we tracked
        const joined = Array.from(socket.rooms.values());
        joined.forEach((room) => {
          if (rooms.has(room)) {
            const roomClients = rooms.get(room)!;
            roomClients.delete(socket.id);
            if (roomClients.size === 0) rooms.delete(room);
            else io.to(room).emit('room-users-update', Object.fromEntries(roomClients.entries()));
          }
        });
      });

      socket.on('error', (err) => {
        console.error('[Socket.IO] socket error', err);
      });
    });

    res.socket.server.io = io;
    console.log('[Socket.IO] Server initialized and attached.');
  } else {
    console.log('[Socket.IO] Server already attached.');
  }

  res.end();
}
