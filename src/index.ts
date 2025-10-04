import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import "dotenv/config";

import apiRouter from "./routes";
import { passport } from "./config";
import initSocketIO from "./sockets";
import { createServer } from "node:http";
import { Server } from "socket.io";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(passport.initialize());
app.use(express.json());

app.use(apiRouter);

const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initSocketIO(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
