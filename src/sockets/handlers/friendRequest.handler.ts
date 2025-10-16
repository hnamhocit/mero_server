import { ConversationType } from "../../generated/prisma";
import { connectedUsers } from "..";
import { ISocket } from "../../interfaces";
import { BaseHandler } from "./base.handler";

export class FriendRequestHandler extends BaseHandler {
  create = async (socket: ISocket, args: any, cb: any) => {
    const { to, message } = args;

    if (to === socket.user.id)
      return cb({ success: false, msg: "You cannot add yourself" });

    const [existingCount, friendsCount] = await Promise.all([
      this.prisma.friendRequest.count({
        where: {
          OR: [
            { fromId: socket.user.id, toId: to },
            { fromId: to, toId: socket.user.id },
          ],
        },
      }),
      this.prisma.friendship.count({
        where: {
          OR: [
            { userId: socket.user.id, friendId: to },
            { userId: to, friendId: socket.user.id },
          ],
        },
      }),
    ]);

    if (existingCount > 0)
      return cb({ success: false, msg: "Friend request already exists" });

    if (friendsCount > 0)
      return cb({ success: false, msg: "You are already friends" });

    const friendRequest = await this.prisma.friendRequest.create({
      data: {
        toId: to,
        fromId: socket.user.id,
        message,
      },
      include: {
        from: {
          select: {
            id: true,
            displayName: true,
            email: true,
            photoURL: true,
          },
        },
      },
    });

    connectedUsers.get(to)?.emit("friendRequest:new", friendRequest);

    cb({ success: true, data: friendRequest });
  };

  accept = async (socket: ISocket, args: any, cb: any) => {
    const { fromId } = args;

    const friendRequest = await this.prisma.friendRequest.findFirst({
      where: {
        fromId,
        toId: socket.user.id,
      },
      include: {
        from: {
          select: { id: true, displayName: true, email: true, photoURL: true },
        },
        to: {
          select: { id: true, displayName: true, email: true, photoURL: true },
        },
      },
    });

    if (!friendRequest)
      return cb({ success: false, message: "Friend request not found" });

    const [_, __, ___, conversation] = await this.prisma.$transaction([
      this.prisma.friendship.create({
        data: { userId: socket.user.id, friendId: friendRequest.fromId },
      }),
      this.prisma.friendship.create({
        data: { userId: friendRequest.fromId, friendId: socket.user.id },
      }),
      this.prisma.friendRequest.delete({ where: { id: friendRequest.id } }),
      this.prisma.conversation.create({
        data: {
          type: ConversationType.DIRECT,
          participants: {
            create: [
              { userId: friendRequest.fromId },
              { userId: socket.user.id },
            ],
          },
        },
        include: {
          lastMessage: {
            include: { sender: { select: { id: true, displayName: true } } },
          },
          participants: {
            select: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  photoURL: true,
                },
              },
            },
          },
        },
      }),
    ]);

    connectedUsers
      .get(friendRequest.fromId)
      ?.emit("friendRequest:accepted", friendRequest.toId);

    const ids = [socket.user.id, friendRequest.fromId];
    ids.forEach((id) => {
      connectedUsers
        .get(id)
        ?.emit(
          "friend:new",
          id === socket.user.id ? friendRequest.from : friendRequest.to
        );
      connectedUsers.get(id)?.emit("conversation:new", {
        ...conversation,
        otherUser: conversation.participants.filter((p) => p.user.id !== id)[0]
          .user,
      });
    });

    cb({ success: true, message: "Friend request accepted" });
  };

  reject = async (socket: ISocket, args: any, cb: any) => {
    const { fromId } = args;

    const friendRequest = await this.prisma.friendRequest.findFirst({
      where: { fromId },
    });

    if (!friendRequest)
      return cb({ success: false, msg: "Friend request not found" });

    await this.prisma.friendRequest.delete({ where: { id: friendRequest.id } });

    connectedUsers
      .get(friendRequest.fromId)
      ?.emit("friendRequest:rejected", friendRequest.toId);

    cb({ success: true, msg: "Friend request rejected" });
  };
}
