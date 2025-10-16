import { ISocket } from "@src/interfaces";
import { BaseHandler } from "./base.handler";

export class FriendHandler extends BaseHandler {
  unfriend = async (socket: ISocket, args: any, cb: any) => {
    const { friendId } = args;
    const userId = socket.user.id;

    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          {
            userId: userId,
            friendId: friendId,
          },
          {
            userId: friendId,
            friendId: userId,
          },
        ],
      },
    });

    cb({ success: true, data: null });
  };
}
