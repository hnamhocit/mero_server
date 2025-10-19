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

export { loginSchema, registerSchema };
