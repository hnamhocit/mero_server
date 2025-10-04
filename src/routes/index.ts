import { Router } from "express";

import { AuthController } from "../controllers";
import { RouterGroup } from "../core";

const router = Router();

const api = new RouterGroup("/api", router);

api.use("/auth", AuthController);

export default router;
