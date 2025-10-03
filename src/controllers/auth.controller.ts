import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { BaseController } from "../core";
import { loginSchema, refreshSchema, registerSchema } from "../schemas";
import { IJwtPayload } from "../interfaces";
import { passport } from "../config";

export class AuthController extends BaseController {
  protected registerRoutes(): void {
    this.router.post("/login", this.login);

    this.router.post("/register", this.register);

    this.router.get(
      "/logout",
      passport.authenticate("jwt", { session: false }),
      this.logout,
    );

    this.router.post(
      "/refresh",
      passport.authenticate("jwt", { session: false }),
      this.refresh,
    );
  }

  private async generateTokens(payload: IJwtPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "7d",
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: payload.id },
      data: { refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, password: true },
    });

    if (!existingUser) {
      res
        .status(404)
        .json({ success: false, msg: "User not found", data: null });
      return;
    }

    const { password: hashedPassword, ...other } = existingUser;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) {
      res
        .status(401)
        .json({ success: false, msg: "Invalid credentials", data: null });
      return;
    }

    const tokens = await this.generateTokens(other);
    res.json({ success: true, msg: "Logged in successfully", data: tokens });
  }

  async register(req: Request, res: Response) {
    const { email, password, displayName } = registerSchema.parse(req.body);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res
        .status(409)
        .json({ success: false, msg: "Email already exists", data: null });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: { email, password: hashedPassword, displayName },
      select: { email: true, id: true, role: true },
    });

    const tokens = await this.generateTokens(newUser);
    res.json({ success: true, msg: "Registered successfully", data: tokens });
  }

  async logout(req: Request, res: Response) {}

  async refresh(req: Request, res: Response) {
    const { refreshToken } = refreshSchema.parse(req.body);

    const decoded = jwt.decode(refreshToken, { complete: true });
    if (!decoded || typeof decoded === "string") {
      res
        .status(401)
        .json({ success: false, msg: "Invalid token", data: null });
      return;
    }

    const payload = decoded.payload as IJwtPayload;
    const tokens = await this.generateTokens(payload);

    res.json({
      success: true,
      msg: "Token refreshed successfully",
      data: tokens,
    });
  }
}
