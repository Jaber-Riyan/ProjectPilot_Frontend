import { z } from "zod";

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
