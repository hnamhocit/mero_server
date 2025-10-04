import { Router } from "express";

import { BaseController } from "./baseController";

type ControllerClass = new () => BaseController;

export class RouterGroup {
  private router: Router;

  constructor(
    private prefix: string = "",
    parentRouter?: Router,
  ) {
    this.router = Router();
    if (parentRouter) {
      parentRouter.use(this.prefix, this.router);
    }
  }

  public use(path: string, Controller: ControllerClass) {
    const instance = new Controller();
    this.router.use(path, instance.getRouter());
    return this;
  }

  public group(path: string) {
    return new RouterGroup(path, this.router);
  }

  public getRouter() {
    return this.router;
  }
}
