import { $Enums } from "@src/generated/prisma";

export interface IJwtPayload {
  id: number;
  email: string;
  role: $Enums.UserRole;
}
