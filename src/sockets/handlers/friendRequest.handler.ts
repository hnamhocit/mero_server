import { connectedUsers } from "..";
import { ISocket } from "../../interfaces";
import { BaseHandler } from "./base.handler";

export class FriendRequestHandler extends BaseHandler {
  create = async (socket: ISocket, args: any, cb: any) => {
    const { to, message } = args;

    // Check existing request
    const existing = await this.prisma.friendRequest.findFirst({
      where: { fromId: socket.user.id, toId: to },
    });

    if (existing) return cb({ success: false, msg: "Request already sent" });

    const friendRequest = await this.prisma.friendRequest.create({
      data: {
        toId: to,
        message,
        fromId: socket.user.id,
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
      },
    });

    if (!friendRequest)
      return cb({ success: false, msg: "Friend request not found" });

    await this.prisma.$transaction([
      this.prisma.friend.create({
        data: {
          user_id: socket.user.id,
          friend_id: friendRequest.fromId,
        },
      }),
      this.prisma.friend.create({
        data: {
          user_id: friendRequest.fromId,
          friend_id: socket.user.id,
        },
      }),
      this.prisma.friendRequest.delete({ where: { id: friendRequest.id } }),
    ]);

    connectedUsers
      .get(friendRequest.fromId)
      ?.emit("friendRequest:accepted", friendRequest.toId);

    cb({ success: true, msg: "Friend request accepted" });
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
