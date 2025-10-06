import { Request, Response } from "express";

import { BaseController } from "../core";
import { IJwtPayload } from "../interfaces";
import { authMiddleware } from "../middlewares";

export class UserController extends BaseController {
  protected registerRoutes(): void {
    this.router.get("/me", authMiddleware, this.getMe);
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
}
