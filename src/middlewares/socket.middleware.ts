import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { IJwtPayload } from "@src/interfaces";

export function socketMiddleware(socket: Socket, next: (err?: Error) => void) {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(" ")[1];

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!,
    ) as IJwtPayload;

    (socket as any).user = decoded;
    (socket as any).socketId = socket.id;

    next();
  } catch {
    return next(new Error("Invalid or expired token"));
  }
}
