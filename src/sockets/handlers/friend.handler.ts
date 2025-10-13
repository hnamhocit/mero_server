import { ISocket } from "@src/interfaces";
import { BaseHandler } from "./base.handler";

export class FriendHandler extends BaseHandler {
  unfriend = async (socket: ISocket, args: any, cb: any) => {
    const { friendId } = args;
    const userId = socket.user.id;

    await this.prisma.friend.deleteMany({
      where: {
        OR: [
          {
            user_id: userId,
            friend_id: friendId,
          },
          {
            user_id: friendId,
            friend_id: userId,
          },
        ],
      },
    });

    cb({ success: true, data: null });
  };
}
