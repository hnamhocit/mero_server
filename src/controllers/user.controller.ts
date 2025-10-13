import { Request, Response } from "express";

import { BaseController } from "../core";
import { IJwtPayload } from "../interfaces";
import { authMiddleware } from "../middlewares";

export class UserController extends BaseController {
  protected registerRoutes(): void {
    this.router.get("/", authMiddleware, this.getUsers);
  }

  getUsers = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;
    const q = req.query.q as string;

    const users = await this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { displayName: { contains: q, mode: "insensitive" } },
            ],
          },
          {
            NOT: {
              id: payload.id,
            },
          },
        ],
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        photoURL: true,
      },
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  };
}
