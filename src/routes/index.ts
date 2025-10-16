import { Router } from "express";

import {
  AuthController,
  MeController,
  UploadController,
  UserController,
} from "../controllers";
import { RouterGroup } from "../core";

const router = Router();

const api = new RouterGroup("/api", router);

api.use("/auth", AuthController);
api.use("/users", UserController);
api.use("/users/me", MeController);
api.use("/uploads", UploadController);

export default router;
