import { Socket } from "socket.io";

import { IJwtPayload } from "./jwtPayload";

export interface ISocket extends Socket {
  user: IJwtPayload;
  socketId: string;
}
