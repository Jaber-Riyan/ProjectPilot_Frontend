import { z } from "zod";

export const assignmentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  courseId: z.string().optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  instructions: z
    .string()
    .min(10, "Instructions must be at least 10 characters")
    .max(5000, "Instructions cannot exceed 5000 characters"),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).default("DRAFT"),
  submissionPolicy: z.enum(["ONE_TIME", "RESUBMITTABLE"]).default("RESUBMITTABLE"),
  dueDate: z.string().optional(),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1").max(1000, "Max score cannot exceed 1000").default(100),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;
export type CreateAssignmentInput = AssignmentFormValues;
export type UpdateAssignmentInput = Partial<AssignmentFormValues>;
