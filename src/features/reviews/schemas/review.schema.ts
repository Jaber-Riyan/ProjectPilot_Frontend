import { z } from "zod";

export const reviewSchema = z
  .object({
    submissionId: z.string().min(1, "Submission ID is required"),
    status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED", "RESUBMISSION_REQUESTED"]),
    feedback: z
      .string()
      .trim()
      .max(10000, "Feedback cannot exceed 10000 characters")
      .optional()
      .or(z.literal("")),
    score: z.coerce
      .number()
      .min(0, "Score cannot be negative")
      .max(100, "Maximum score is 100")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "REJECTED" || data.status === "RESUBMISSION_REQUESTED") {
      if (!data.feedback || data.feedback.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Written feedback is required when rejecting a submission or requesting resubmission",
          path: ["feedback"],
        });
      }
    }
  });

export type ReviewFormValues = z.infer<typeof reviewSchema>;
