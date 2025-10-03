import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import "dotenv/config";

import apiRouter from "./routes";
import { passport } from "./config";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(passport.initialize());
app.use(express.json());

io.on("connection", (socket) => {
  console.log("a user connected");
});

app.use(apiRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
