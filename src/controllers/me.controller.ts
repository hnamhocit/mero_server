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
            friend_id: true,
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
        friendIds: user!.friends.map((friend) => friend.friend_id),
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
}
