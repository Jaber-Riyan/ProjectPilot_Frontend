import { z } from "zod";

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title cannot exceed 120 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(120, "Slug cannot exceed 120 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  estimatedHours: z.coerce.number().min(1, "Must be at least 1 hour").max(500, "Maximum 500 hours"),
  mentorIds: z.array(z.string()).default([]),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
export type CreateCourseInput = CourseFormValues;
export type UpdateCourseInput = Partial<CourseFormValues>;
