import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HTTPServer } from 'http';
import { Socket as NetSocket } from 'net';
import { Server as SocketIOServer } from 'socket.io';

// Type definition for Next.js request/response with socket support
interface SocketRequest extends NextApiRequest {
  socket: NetSocket & {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
}

export default function handler(req: SocketRequest, res: NextApiResponse) {
  // Initialize Socket.IO only once
  if (!req.socket.server.io) {
    const io = new SocketIOServer(req.socket.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    // Rooms map: roomId -> Map(clientId -> clientData)
    const rooms = new Map<string, Map<string, any>>();

    io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      // Global client count
      io.emit('client-count', io.engine.clientsCount);

      // Global audio-data (broadcast to all except sender)
      socket.on('audio-data', (data: any) => {
        // Log incoming audio-data for debugging connectivity
        try {
          console.log(`[Socket.IO] audio-data received from ${socket.id}`, {
            roomId: data?.roomId,
            timestamp: data?.timestamp || Date.now(),
            sampleLength: Array.isArray(data?.frequencies) ? data.frequencies.length : undefined,
          });
        } catch (err) {
          console.error('[Socket.IO] Error logging audio-data', err);
        }

        // If roomId is provided, broadcast only to that room
        if (data && data.roomId) {
          const room = data.roomId;

          // Update stored frequencies in the room state if tracked
          try {
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
          } catch (err) {
            console.error('[Socket.IO] Error updating room state', err);
          }

          socket.broadcast.to(room).emit('audio-update', {
            frequencies: data.frequencies,
            timestamp: data.timestamp || Date.now(),
            clientId: socket.id,
            deviceType: data.deviceType || 'unknown',
          });

          // Optionally emit a lightweight room-users-update (comment/uncomment as needed)
          try {
            const roomClients = rooms.get(room);
            if (roomClients) {
              io.to(room).emit('room-users-update', Object.fromEntries(roomClients.entries()));
            }
          } catch (err) {
            console.error('[Socket.IO] Error emitting room-users-update', err);
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

    req.socket.server.io = io;
    console.log('[Socket.IO] initialized on server');
  }

  res.status(200).json({ message: 'Socket.IO initialized' });
}
