import { Router } from "express";

import { PrismaClient } from "../generated/prisma";
import { prisma } from "../config";

export abstract class BaseController {
  protected prisma: PrismaClient = prisma;
  protected router: Router = Router();
  private routesRegistered = false;

  protected abstract registerRoutes(): void;

  public getRouter() {
    if (!this.routesRegistered) {
      this.registerRoutes();
      this.routesRegistered = true;
    }
    return this.router;
  }
}
