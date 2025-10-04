import { $Enums } from "@src/generated/prisma";
import { JwtPayload } from "jsonwebtoken";

export interface IJwtPayload extends JwtPayload {
  id: number;
  email: string;
  role: $Enums.UserRole;
}
