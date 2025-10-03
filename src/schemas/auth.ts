import z from "zod";

const passwordSchema = z
  .string()
  .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/);

const loginSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

const registerSchema = z.object({
  displayName: z.string().min(3).max(30),
  email: z.email(),
  password: passwordSchema,
});

const refreshSchema = z.object({
  refreshToken: z
    .string()
    .regex(/^Bearer\s.+$/, "Invalid refresh token format")
    .transform((val) => val.replace(/^Bearer\s/, "")),
});

export { loginSchema, registerSchema, refreshSchema };
