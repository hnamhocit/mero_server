import { passport } from "../config";

export const authMiddleware = passport.authenticate("jwt", { session: false });
