import { z } from "zod";

export const submissionSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  answerText: z
    .string()
    .min(10, "Please provide an answer of at least 10 characters")
    .max(5000, "Answer cannot exceed 5000 characters"),
  attachmentUrl: z.string().url("Must be a valid URL (e.g. GitHub repo or document link)").optional().or(z.literal("")),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
