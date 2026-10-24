import { z } from "zod";

export const contentSchema = z
  .object({
    moduleId: z.string().min(1, "Module ID is required"),
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),
    type: z.enum(["VIDEO", "YOUTUBE_VIDEO", "TEXT", "LINK", "ASSIGNMENT"]),
    order: z.coerce.number().min(1, "Order must be 1 or greater"),
    body: z.string().max(10000, "Content cannot exceed 10,000 characters").optional(),
    url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    assignmentId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "TEXT") {
        return !!data.body && data.body.trim().length > 0;
      }
      if (data.type === "LINK" || data.type === "VIDEO" || data.type === "YOUTUBE_VIDEO") {
        return !!data.url && data.url.trim().length > 0;
      }
      if (data.type === "ASSIGNMENT") {
        return !!data.assignmentId && data.assignmentId.trim().length > 0;
      }
      return true;
    },
    {
      message: "Please provide the required content field for the selected content type.",
      path: ["type"],
    }
  );

export type ContentFormValues = z.infer<typeof contentSchema>;
export type CreateContentInput = ContentFormValues;
export type UpdateContentInput = Partial<ContentFormValues>;
