import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import apiRouter from "./routes";
import { client, passport } from "./config";
import initSocketIO from "./sockets";

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(passport.initialize());
app.use(express.json());
app.use(cookieParser());

app.use(apiRouter);

const server = createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
  transports: ["websocket", "polling"],
});

initSocketIO(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
  await client.connect();
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
