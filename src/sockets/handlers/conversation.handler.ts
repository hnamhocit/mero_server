import { ISocket } from "../../interfaces";
import { BaseHandler } from "./base.handler";
import { connectedUsers } from "..";

export class ConversationHandler extends BaseHandler {
  create = async (socket: ISocket, args: any, cb: any) => {
    const { name, photoURL, photoId, participantIds } = args;

    const newConversation = await this.prisma.conversation.create({
      data: {
        name,
        photoURL,
        photoId,
        participants: {
          createMany: {
            data: [
              ...participantIds.map((id: number) => ({ userId: id })),
              { userId: socket.user.id, role: "ADMIN" },
            ],
          },
        },
      },
      include: {
        lastMessage: {
          include: { sender: { select: { id: true, displayName: true } } },
        },
      },
    });

    [socket.user.id, ...participantIds].forEach((id: number) => {
      const onlineSocket = connectedUsers.get(id);
      onlineSocket?.join(`conversation-${newConversation.id}`);
      onlineSocket?.emit("conversation:new", newConversation);
    });
  };
}
