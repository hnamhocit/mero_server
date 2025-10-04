import { JwtPayload } from "jsonwebtoken";

import { $Enums } from "../generated/prisma";

export interface IJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: $Enums.UserRole;
}
