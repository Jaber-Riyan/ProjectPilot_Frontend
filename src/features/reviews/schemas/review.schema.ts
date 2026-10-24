import { z } from "zod";

export const reviewSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "RESUBMISSION_REQUESTED"]),
  feedback: z
    .string()
    .min(5, "Feedback must be at least 5 characters")
    .max(3000, "Feedback cannot exceed 3000 characters"),
  score: z.coerce.number().min(0, "Score cannot be negative").max(100, "Maximum score is 100").optional(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
