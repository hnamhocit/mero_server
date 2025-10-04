import { Server } from "socket.io";

import { PrismaClient } from "../../generated/prisma";
import { io } from "../..";
import { prisma } from "../../config";

export class BaseHandler {
  protected io: Server = io;
  protected prisma: PrismaClient = prisma;
}
