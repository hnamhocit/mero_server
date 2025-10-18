import { ISocket } from "@src/interfaces";
import { BaseHandler } from "./base.handler";

export class MessageHandler extends BaseHandler {
  getConversationMessages = async (socket: ISocket, args: any, cb: any) => {
    const { conversationId, cursor } = args;

    socket.join(`conversation-${conversationId}`);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId: conversationId,
        deletions: {
          none: {
            userId: socket.user.id,
          },
        },
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
        reply: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
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
    const { content, conversationId, replyId } = args;

    const newMessage = await this.prisma.message.create({
      data: {
        content,
        conversationId,
        replyId,
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

    this.io
      .to(`conversation-${conversationId}`)
      .emit("message:new", newMessage);
  };

  delete = async (socket: ISocket, args: any, cb: any) => {
    const { id, conversationId } = args;
    if (!id || !conversationId)
      return cb({ success: false, message: "Message id is required" });

    const messageCount = await this.prisma.message.findUnique({
      where: {
        id: id,
      },
    });

    if (!messageCount)
      return cb({ success: false, message: "Message not found" });

    await this.prisma.message.delete({
      where: {
        id: id,
      },
    });

    socket.to(`conversation-${conversationId}`).emit("message:deleted", id);
  };

  deleteForMe = async (socket: ISocket, args: any, cb: any) => {
    const { id, conversationId } = args;
    if (!id || !conversationId)
      return cb({
        success: false,
        msg: "Id, conversationId are required",
      });

    const deletionCount = await this.prisma.messageDeletion.count({
      where: {
        messageId: id,
        userId: socket.user.id,
      },
    });

    if (deletionCount > 0) {
      return cb({
        success: false,
        msg: "Message already deleted",
      });
    }

    await this.prisma.messageDeletion.create({
      data: {
        messageId: id,
        userId: socket.user.id,
      },
    });

    return cb({
      success: true,
      msg: "Message deleted",
    });
  };
}
