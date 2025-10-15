import { authMiddleware } from "../middlewares";
import { BaseController } from "../core";
import { Request, Response } from "express";
import { IJwtPayload } from "@src/interfaces";

export class MeController extends BaseController {
  protected registerRoutes(): void {
    this.router.get("/", authMiddleware, this.getMe);
    this.router.put("/email-verified", authMiddleware, this.setEmailVerified);
    this.router.get("/ids", authMiddleware, this.getRequestAndFriendsIds);
    this.router.get(
      "/received-requests",
      authMiddleware,
      this.getReceivedRequests
    );
    this.router.get("/friends", authMiddleware, this.getFriends);
    this.router.get("/conversations", authMiddleware, this.getConversations);
  }

  getMe = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  };

  setEmailVerified = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    await this.prisma.user.update({
      where: {
        id: payload.id,
      },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
      select: { id: true },
    });

    res.status(200).json({
      success: true,
      data: null,
    });
  };

  getRequestAndFriendsIds = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        friends: {
          select: {
            friendId: true,
          },
        },
      },
    });

    const requests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ fromId: payload.id }, { toId: payload.id }],
      },
      select: {
        fromId: true,
        toId: true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        friendIds: user!.friends.map((friend) => friend.friendId),
        receivedRequestIds: requests
          .filter((request) => request.toId === payload.id)
          .map((req) => req.fromId),
        sentRequestIds: requests
          .filter((request) => request.fromId === payload.id)
          .map((req) => req.toId),
      },
    });
  };

  getReceivedRequests = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    const friendRequests = await this.prisma.friendRequest.findMany({
      where: { toId: payload.id },
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

    res.status(200).json({ success: true, data: friendRequests });
  };

  getFriends = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    const friends = await this.prisma.friend.findMany({
      where: { userId: payload.id },
      include: {
        friend: {
          select: {
            id: true,
            displayName: true,
            email: true,
            photoURL: true,
          },
        },
      },
    });

    res
      .status(200)
      .json({ success: true, data: friends.map((friend) => friend.friend) });
  };

  getConversations = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    const [groups, directs] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          type: "GROUP",
          participants: { some: { userId: payload.id } },
        },
        include: {
          lastMessage: {
            include: { sender: { select: { id: true, displayName: true } } },
          },
          _count: { select: { participants: true } },
        },
      }),
      this.prisma.conversation.findMany({
        where: {
          type: "DIRECT",
          participants: { some: { userId: payload.id } },
        },
        include: {
          lastMessage: {
            include: { sender: { select: { id: true, displayName: true } } },
          },
          participants: {
            where: { NOT: { userId: payload.id } },
            select: {
              user: { select: { id: true, displayName: true, photoURL: true } },
            },
          },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: [
        ...groups.map((g) => ({
          ...g,
          memberCount: g._count.participants,
        })),
        ...directs.map(({ participants, ...d }) => ({
          ...d,
          otherUser: participants[0]?.user,
        })),
      ],
    });
  };
}
