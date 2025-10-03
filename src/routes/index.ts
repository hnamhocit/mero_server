import { AuthController } from "@src/controllers";
import { RouterGroup } from "@src/core";
import { Router } from "express";

const router = Router();

const api = new RouterGroup("/api", router);

api.use("/auth", AuthController);

export default router;
