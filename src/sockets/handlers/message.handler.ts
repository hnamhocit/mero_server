import { ISocket } from "@src/interfaces";
import { BaseHandler } from "./base.handler";

export class MessageHandler extends BaseHandler {
  getConversationMessages = async (socket: ISocket, args: any, cb: any) => {
    const { conversationId, cursor } = args;

    socket.join(`conversation-${conversationId}`);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversationId,
      },
      take: 20,
      skip: cursor ? 1 : 0,
      cursor: cursor
        ? {
            id: cursor,
          }
        : undefined,
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            photoURL: true,
          },
        },
      },
    });

    cb({ success: true, data: messages });
  };

  send = async (socket: ISocket, args: any, cb: any) => {
    const { content, conversationId } = args;

    const newMessage = await this.prisma.message.create({
      data: {
        content,
        conversationId,
        senderId: socket.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            photoURL: true,
          },
        },
      },
    });

    socket.to(`conversation-${conversationId}`).emit("message:new", newMessage);

    cb({ success: true, data: newMessage });
  };
}
