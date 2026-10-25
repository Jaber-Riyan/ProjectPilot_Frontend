import { z } from "zod";

// Legacy course module form schema (kept for backward compatibility)
export const moduleSchema = z.object({
  courseId: z.string().min(1, "Course ID is required"),
  title: z
    .string()
    .trim()
    .min(1, "Module title is required")
    .max(200, "Module title cannot exceed 200 characters"),
  description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),
  order: z.coerce.number().int().min(1, "Order must be 1 or greater").optional(),
});

// Independent Module Creation Schema
export const createIndependentModuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Module title is required")
    .max(200, "Module title cannot exceed 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().default(false),
});

// Attach Existing or Create New Module for Course Schema
export const attachOrAddModuleSchema = z
  .object({
    mode: z.enum(["EXISTING", "NEW"]).default("NEW"),
    moduleId: z.string().uuid("Please select a valid module").optional().or(z.literal("")),
    title: z.string().trim().max(200, "Title cannot exceed 200 characters").optional().or(z.literal("")),
    description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),
    isPublished: z.boolean().optional(),
    order: z.coerce.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "EXISTING") {
      if (!data.moduleId || data.moduleId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select an existing module to attach",
          path: ["moduleId"],
        });
      }
    } else {
      if (!data.title || data.title.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Module title is required",
          path: ["title"],
        });
      }
    }
  });

// Update Module Schema
export const updateModuleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Module title cannot be empty")
    .max(200, "Module title cannot exceed 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().optional(),
});

// Reorder Modules Schema
export const reorderModulesSchema = z.object({
  moduleIds: z
    .array(z.string().min(1, "Module ID is required"))
    .min(1, "At least one module ID must be provided")
    .refine((items) => new Set(items).size === items.length, {
      message: "Module IDs must not contain duplicates",
    }),
});

export type ModuleFormValues = z.infer<typeof moduleSchema>;
export type CreateIndependentModuleFormValues = z.infer<typeof createIndependentModuleSchema>;
export type AttachOrAddModuleFormValues = z.infer<typeof attachOrAddModuleSchema>;
export type UpdateModuleFormValues = z.infer<typeof updateModuleSchema>;
export type ReorderModulesFormValues = z.infer<typeof reorderModulesSchema>;

export type CreateModuleInput = ModuleFormValues;
export type UpdateModuleInput = Partial<ModuleFormValues>;
