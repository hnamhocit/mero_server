import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { BaseController } from "../core";
import { loginSchema, refreshSchema, registerSchema } from "../schemas";
import { IJwtPayload } from "../interfaces";
import { authMiddleware } from "../middlewares";

export class AuthController extends BaseController {
  protected registerRoutes(): void {
    this.router.post("/login", this.login);

    this.router.post("/register", this.register);

    this.router.get("/logout", authMiddleware, this.logout);

    this.router.post("/refresh", this.refresh);
  }

  private generateTokens = async (payload: IJwtPayload) => {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
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
  };

  login = async (req: Request, res: Response) => {
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
  };

  register = async (req: Request, res: Response) => {
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
  };

  logout = async (req: Request, res: Response) => {
    const payload = req.user as IJwtPayload;

    await this.prisma.user.update({
      where: { id: payload.id },
      data: { refreshToken: null },
    });

    res.json({ success: true, msg: "Logged out successfully", data: null });
  };

  refresh = async (req: Request, res: Response) => {
    const { refreshToken } = refreshSchema.parse(req.body);

    const decoded = jwt.decode(refreshToken, { complete: true });
    if (!decoded || typeof decoded === "string") {
      res
        .status(401)
        .json({ success: false, msg: "Invalid token", data: null });
      return;
    }

    const payload = decoded.payload as IJwtPayload;
    const tokens = await this.generateTokens({
      id: payload.id,
      role: payload.role,
      email: payload.email,
    });

    res.json({
      success: true,
      msg: "Token refreshed successfully",
      data: tokens,
    });
  };
}
