import { Server } from "socket.io";

import { ISocket } from "../interfaces";
import { socketMiddleware } from "../middlewares";
import { registerHandlers } from "../utils";
import { FriendHandler, FriendRequestHandler } from "./handlers";

export const connectedUsers = new Map<number, ISocket>();

function initSocketIO(io: Server) {
  io.use(socketMiddleware);

  io.on("connection", (socket) => {
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

    const handlers = registerHandlers([FriendRequestHandler, FriendHandler]);

    socket.onAny((channel, payload, cb) => {
      const cmd = payload.cmd;
      const args = payload.args;

      const handler = handlers[channel];
      const cmdHandler = handler?.[cmd];

      if (cmdHandler) {
        cmdHandler(socket, args, cb);
      } else {
        cb({ error: "Handler not found" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(
        `❌ [DISCONNECT] ${socket.id} disconnected. Reason: ${reason}`
      );
    });

    socket.on("error", (err) => {
      console.error(`🔥 [SOCKET ERROR] ${socket.id}:`, err);
    });
  });
}

export default initSocketIO;
