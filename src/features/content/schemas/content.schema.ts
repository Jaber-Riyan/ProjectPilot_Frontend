import { z } from "zod";

const HTTP_URL_REGEX = /^https?:\/\/.+/i;

export const contentSchema = z
  .object({
    moduleId: z.string().min(1, "Module ID is required"),
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title cannot exceed 200 characters"),
    type: z.enum(["VIDEO", "YOUTUBE_VIDEO", "TEXT", "LINK", "ASSIGNMENT"]),
    description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),
    order: z.coerce.number().int().min(1, "Order must be 1 or greater").optional(),
    body: z.string().optional().or(z.literal("")),
    url: z.string().optional().or(z.literal("")),
    assignmentId: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TEXT") {
      if (!data.body || data.body.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Body text is required for text content items",
          path: ["body"],
        });
      }
    } else if (data.type === "LINK") {
      if (!data.url || !HTTP_URL_REGEX.test(data.url.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid HTTP or HTTPS URL is required for link content items",
          path: ["url"],
        });
      }
    } else if (data.type === "VIDEO" || data.type === "YOUTUBE_VIDEO") {
      if (!data.url || !HTTP_URL_REGEX.test(data.url.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid video HTTP or HTTPS URL is required",
          path: ["url"],
        });
      }
    } else if (data.type === "ASSIGNMENT") {
      if (!data.assignmentId || data.assignmentId.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Associated Assignment ID is required for assignment items",
          path: ["assignmentId"],
        });
      }
    }
  });

export const updateContentItemSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be empty")
      .max(200, "Title cannot exceed 200 characters")
      .optional(),
    type: z.enum(["VIDEO", "YOUTUBE_VIDEO", "TEXT", "LINK", "ASSIGNMENT"]).optional(),
    description: z.string().trim().max(5000, "Description cannot exceed 5000 characters").optional().or(z.literal("")),
    body: z.string().optional().or(z.literal("")),
    url: z.string().optional().or(z.literal("")),
    assignmentId: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TEXT" && data.body !== undefined) {
      if (!data.body || data.body.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Body text cannot be empty for text content items",
          path: ["body"],
        });
      }
    } else if (data.type === "LINK" && data.url !== undefined) {
      if (!data.url || !HTTP_URL_REGEX.test(data.url.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid HTTP or HTTPS URL is required for link content items",
          path: ["url"],
        });
      }
    } else if ((data.type === "VIDEO" || data.type === "YOUTUBE_VIDEO") && data.url !== undefined) {
      if (!data.url || !HTTP_URL_REGEX.test(data.url.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A valid video HTTP or HTTPS URL is required",
          path: ["url"],
        });
      }
    }
  });

export const reorderContentSchema = z.object({
  contentItemIds: z
    .array(z.string().min(1, "Content item ID is required"))
    .min(1, "At least one content item ID must be provided")
    .refine((items) => new Set(items).size === items.length, {
      message: "Content item IDs must not contain duplicates",
    }),
});

export type ContentFormValues = z.infer<typeof contentSchema>;
export type UpdateContentFormValues = z.infer<typeof updateContentItemSchema>;
export type ReorderContentFormValues = z.infer<typeof reorderContentSchema>;

export type CreateContentInput = ContentFormValues;
export type UpdateContentInput = Partial<ContentFormValues>;
