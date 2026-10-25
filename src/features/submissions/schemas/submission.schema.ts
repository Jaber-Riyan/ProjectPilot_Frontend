import { z } from "zod";

export const submissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  projectName: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(200, "Project name cannot exceed 200 characters"),
  repoUrl: z
    .string()
    .trim()
    .min(1, "Repository URL is required")
    .regex(/^https?:\/\/.+/i, "Repository URL must be a valid HTTP or HTTPS URL"),
  liveUrl: z
    .string()
    .trim()
    .regex(/^https?:\/\/.+/i, "Live URL must be a valid HTTP or HTTPS URL")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional()
    .or(z.literal("")),
  answerText: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
