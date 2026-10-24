import { z } from "zod";

export const moduleSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .min(3, "Module title must be at least 3 characters")
    .max(100, "Module title cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  order: z.coerce.number().min(1, "Order must be 1 or greater"),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;
export type CreateModuleInput = ModuleFormValues;
export type UpdateModuleInput = Partial<ModuleFormValues>;
