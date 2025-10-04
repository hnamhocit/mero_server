import { createServer } from "node:http";
import { Server } from "socket.io";
import express from "express";

import { ISocket } from "../interfaces";
import { socketMiddleware } from "../middlewares";

export const connectedUsers = new Map<number, ISocket>();

function initSocketIO(app: express.Express) {
  const server = createServer(app);
  const io = new Server(server);

  io.use(socketMiddleware);

  io.on("connection", (socket) => {
    console.log("a user connected");
    const _socket = socket as unknown as ISocket;
    const userId = _socket.user.id;

    const existing = connectedUsers.get(userId);
    if (existing && existing.socketId !== socket.id) {
      io.to(existing.socketId).emit("force_logout", {
        reason: "New login detected",
      });

      io.sockets.sockets.get(existing.socketId)?.disconnect(true);
    }

    connectedUsers.set(userId, _socket);
    console.log(`✅ [CONNECT] ${userId} (${socket.id}) connected`);

    socket.on("disconnect", (reason) => {
      console.log(
        `❌ [DISCONNECT] ${socket.id} disconnected. Reason: ${reason}`,
      );
    });

    socket.on("error", (err) => {
      console.error(`🔥 [SOCKET ERROR] ${socket.id}:`, err);
    });
  });
}

export default initSocketIO;
