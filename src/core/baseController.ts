import { Router } from "express";

import { PrismaClient } from "../generated/prisma";
import { prisma } from "../config";

export abstract class BaseController {
  protected prisma: PrismaClient;
  protected router: Router;

  constructor() {
    this.prisma = prisma;
    this.router = Router();
    this.registerRoutes();
  }

  protected abstract registerRoutes(): void;

  public getRouter() {
    return this.router;
  }
}
