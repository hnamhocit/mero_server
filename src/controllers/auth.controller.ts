import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { BaseController } from "../core";
import { loginSchema, registerSchema } from "../schemas";
import { IJwtPayload } from "../interfaces";
import { authMiddleware } from "../middlewares";
import { generateVerificationCode, sendMail } from "../utils";

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000;

export class AuthController extends BaseController {
  protected registerRoutes(): void {
    this.router.post("/login", this.login);

    this.router.post("/register", this.register);

    this.router.get("/logout", authMiddleware, this.logout);

    this.router.post("/refresh", this.refresh);
  }

  private generateAccessToken = (payload: IJwtPayload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "15m",
    });
  };

  private generateTokens = async (payload: IJwtPayload) => {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = crypto.randomBytes(64).toString("hex");

    await this.prisma.session.create({
      data: {
        userId: payload.id,
        token: this.hashToken(refreshToken),
        expiresAt: Date.now() + REFRESH_TOKEN_TTL,
      },
    });

    return { accessToken, refreshToken };
  };

  private sendVerificationEmail = async (id: number, email: string) => {
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiresAt = new Date(Date.now() + 1000 * 60 * 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        verificationCode,
        verificationCodeExpiresAt,
      },
    });

    sendMail({
      to: email,
      subject: "Confirm Your Email",
      templateName: "confirm-email",
      args: {
        email,
        verificationCode,
      },
    });
  };

  private hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

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

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    res.json({
      success: true,
      msg: "Logged in successfully",
      data: { accessToken: tokens.accessToken },
    });
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
    this.sendVerificationEmail(newUser.id, newUser.email);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    res.json({
      success: true,
      msg: "Registered successfully",
      data: { accessToken: tokens.accessToken },
    });
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (token) {
      await this.prisma.session.delete({
        where: {
          token: this.hashToken(token),
        },
      });

      res.clearCookie("refreshToken");
    }

    res.sendStatus(204);
  };

  refresh = async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, msg: "No refresh token" });
      return;
    }

    const hashedToken = this.hashToken(token);

    const session = await this.prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: { select: { email: true, role: true, id: true } } },
    });

    if (!session) {
      res.clearCookie("refreshToken");
      res.status(401).json({ success: false, msg: "Invalid token" });
      return;
    }

    await this.prisma.session.delete({
      where: { id: session.id },
    });

    if (session.expiresAt < Date.now()) {
      res.clearCookie("refreshToken");
      res.status(401).json({ success: false, msg: "Token expired" });
      return;
    }

    const payload = {
      id: session.userId,
      role: session.user.role,
      email: session.user.email,
    };
    const newTokens = await this.generateTokens(payload);

    res.cookie("refreshToken", newTokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    res.json({
      success: true,
      msg: "Token refreshed",
      data: {
        accessToken: newTokens.accessToken,
      },
    });
  };
}
