import { Router } from "express";

import { AuthController, UserController } from "../controllers";
import { RouterGroup } from "../core";

const router = Router();

const api = new RouterGroup("/api", router);

api.use("/auth", AuthController);
api.use("/users", UserController);

export default router;
