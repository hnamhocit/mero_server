import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import "dotenv/config";

import apiRouter from "./routes";
import { passport } from "./config";
import initSocketIO from "./sockets";

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(passport.initialize());
app.use(express.json());

app.use(apiRouter);

initSocketIO(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
