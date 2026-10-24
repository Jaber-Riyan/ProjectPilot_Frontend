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
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT").optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER").optional(),
  estimatedHours: z.coerce.number().min(1, "Must be at least 1 hour").max(500, "Maximum 500 hours").default(10).optional(),
  mentorIds: z.array(z.string()).default([]).optional(),
});

export type CourseFormValues = z.infer<typeof courseSchema>;
export type CreateCourseInput = CourseFormValues;
export type UpdateCourseInput = Partial<CourseFormValues>;
