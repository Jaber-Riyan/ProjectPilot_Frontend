import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAssignment } from "../src/lib/services/assignment.service";
import { normalizeSubmission } from "../src/lib/services/submission.service";
import { submissionSchema } from "../src/features/submissions/schemas/submission.schema";
import { reviewSchema } from "../src/features/reviews/schemas/review.schema";
import { assignmentSchema } from "../src/features/assignments/schemas/assignment.schema";
import { queryKeys } from "../src/lib/api/query-keys";
import { hasPermission } from "../src/lib/access/access-control";
import { PERMISSIONS } from "../src/lib/access/permissions";
import type { CurrentUser } from "../src/types/auth";

const mockStudentUser: CurrentUser = {
  id: "student-uuid-1",
  name: "Default Student",
  email: "student@projectpilot.dev",
  role: "STUDENT",
  isActive: true,
  createdAt: "2026-10-24T00:00:00Z",
};

const mockMentorUser: CurrentUser = {
  id: "mentor-uuid-1",
  name: "Default Mentor",
  email: "mentor@projectpilot.dev",
  role: "MENTOR",
  isActive: true,
  createdAt: "2026-10-24T00:00:00Z",
};

const mockAdminUser: CurrentUser = {
  id: "admin-uuid-1",
  name: "System Admin",
  email: "admin@projectpilot.dev",
  role: "ADMIN",
  isActive: true,
  createdAt: "2026-10-24T00:00:00Z",
};

test("1. Assignment Entity Normalizer (Backend to Domain)", async (t) => {
  await t.test("Normalizes real backend assignment response with relations and counts", () => {
    const raw = {
      id: "b7249e58-19e6-460e-b091-c515368114fd",
      title: "Capstone Backend API (M1)",
      instructions: "Build REST endpoints for auth, courses, and modules using Express.js 5 and Prisma.",
      submissionPolicy: "RESUBMITTABLE",
      isPublished: true,
      dueAt: "2026-11-01T23:59:59.000Z",
      createdById: "mentor-uuid-1",
      createdAt: "2026-10-24T10:47:54.714Z",
      updatedAt: "2026-10-24T10:47:54.714Z",
      createdBy: {
        id: "mentor-uuid-1",
        email: "mentor@projectpilot.dev",
        name: "Default Mentor",
      },
      contentItems: [
        {
          id: "item-1",
          title: "Capstone Assignment Reference",
          moduleId: "mod-1",
          order: 1,
        },
      ],
      _count: {
        submissions: 4,
        contentItems: 1,
      },
    };

    const normalized = normalizeAssignment(raw);

    assert.equal(normalized.id, "b7249e58-19e6-460e-b091-c515368114fd");
    assert.equal(normalized.title, "Capstone Backend API (M1)");
    assert.equal(normalized.isPublished, true);
    assert.equal(normalized.status, "PUBLISHED");
    assert.equal(normalized.submissionPolicy, "RESUBMITTABLE");
    assert.equal(normalized.dueAt, "2026-11-01T23:59:59.000Z");
    assert.equal(normalized.dueDate, "2026-11-01T23:59:59.000Z");
    assert.equal(normalized.createdBy?.name, "Default Mentor");
    assert.equal(normalized._count?.submissions, 4);
    assert.equal(normalized.contentItems?.length, 1);
  });

  await t.test("Normalizes draft assignment with null dueAt and default description fallback", () => {
    const raw = {
      id: "draft-asg-1",
      title: "Draft Algorithms Challenge",
      instructions: "Implement binary search and graph traversal algorithms.",
      submissionPolicy: "ONE_TIME",
      isPublished: false,
      dueAt: null,
      createdById: "mentor-uuid-1",
      createdAt: "2026-10-24T10:00:00.000Z",
      updatedAt: "2026-10-24T10:00:00.000Z",
    };

    const normalized = normalizeAssignment(raw);

    assert.equal(normalized.status, "DRAFT");
    assert.equal(normalized.isPublished, false);
    assert.equal(normalized.submissionPolicy, "ONE_TIME");
    assert.equal(normalized.dueAt, null);
    assert.equal(normalized.dueDate, null);
    assert.equal(typeof normalized.description, "string");
  });
});

test("2. Submission Entity Normalizer (Backend to Domain)", async (t) => {
  await t.test("Normalizes real backend submission response with aliases", () => {
    const raw = {
      id: "sub-gamma-001",
      assignmentId: "b7249e58-19e6-460e-b091-c515368114fd",
      studentId: "student-uuid-1",
      attemptNumber: 2,
      projectName: "ProjectPilot Backend Integration",
      repoUrl: "https://github.com/student/projectpilot-backend",
      liveUrl: "https://projectpilot-api.example.com",
      description: "Implemented all authentication, course, and module routes with Vitest coverage.",
      status: "UNDER_REVIEW",
      reviewedById: "mentor-uuid-1",
      reviewedAt: null,
      createdAt: "2026-10-24T12:00:00.000Z",
      updatedAt: "2026-10-24T12:00:00.000Z",
      student: {
        id: "student-uuid-1",
        email: "student@projectpilot.dev",
        name: "Default Student",
      },
      assignment: {
        id: "b7249e58-19e6-460e-b091-c515368114fd",
        title: "Capstone Backend API (M1)",
        instructions: "Build REST endpoints",
        submissionPolicy: "RESUBMITTABLE",
      },
      feedbacks: [
        {
          id: "fb-1",
          submissionId: "sub-gamma-001",
          mentorId: "mentor-uuid-1",
          comment: "Good code quality. Please double-check route parameter validation.",
          createdAt: "2026-10-24T14:00:00.000Z",
          updatedAt: "2026-10-24T14:00:00.000Z",
        },
      ],
    };

    const normalized = normalizeSubmission(raw);

    assert.equal(normalized.id, "sub-gamma-001");
    assert.equal(normalized.projectName, "ProjectPilot Backend Integration");
    assert.equal(normalized.repoUrl, "https://github.com/student/projectpilot-backend");
    assert.equal(normalized.liveUrl, "https://projectpilot-api.example.com");
    assert.equal(normalized.status, "UNDER_REVIEW");
    assert.equal(normalized.attemptNumber, 2);
    assert.equal(normalized.student?.email, "student@projectpilot.dev");
    assert.equal(normalized.feedbacks?.length, 1);
    // Backwards-compatibility aliases
    assert.equal(normalized.answerText, raw.description);
    assert.deepEqual(normalized.attachmentUrls, [
      "https://github.com/student/projectpilot-backend",
      "https://projectpilot-api.example.com",
    ]);
  });
});

test("3. Submission Form Schema Validation", async (t) => {
  await t.test("Accepts compliant student submission payload", () => {
    const validPayload = {
      assignmentId: "b7249e58-19e6-460e-b091-c515368114fd",
      projectName: "LMS Module API Implementation",
      repoUrl: "https://github.com/student/lms-module-api",
      liveUrl: "https://lms-api.example.com",
      description: "Complete module with all test suites passing.",
    };

    const result = submissionSchema.safeParse(validPayload);
    assert.equal(result.success, true);
  });

  await t.test("Rejects empty project name", () => {
    const invalidPayload = {
      assignmentId: "b7249e58-19e6-460e-b091-c515368114fd",
      projectName: "",
      repoUrl: "https://github.com/student/repo",
    };

    const result = submissionSchema.safeParse(invalidPayload);
    assert.equal(result.success, false);
  });

  await t.test("Rejects non-HTTP/HTTPS repository URL", () => {
    const invalidPayload = {
      assignmentId: "b7249e58-19e6-460e-b091-c515368114fd",
      projectName: "My Project",
      repoUrl: "git@github.com:student/repo.git",
    };

    const result = submissionSchema.safeParse(invalidPayload);
    assert.equal(result.success, false);
  });

  await t.test("Permits empty optional live URL and description", () => {
    const minimalPayload = {
      assignmentId: "b7249e58-19e6-460e-b091-c515368114fd",
      projectName: "My Project",
      repoUrl: "https://github.com/student/repo",
      liveUrl: "",
      description: "",
    };

    const result = submissionSchema.safeParse(minimalPayload);
    assert.equal(result.success, true);
  });
});

test("4. Review Decision Schema Validation & Refinements", async (t) => {
  await t.test("Accepts APPROVED status without mandatory comment", () => {
    const result = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "APPROVED",
      feedback: "",
      score: 95,
    });
    assert.equal(result.success, true);
  });

  await t.test("Accepts UNDER_REVIEW status without comment", () => {
    const result = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "UNDER_REVIEW",
    });
    assert.equal(result.success, true);
  });

  await t.test("Rejects REJECTED status when written feedback is empty", () => {
    const result = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "REJECTED",
      feedback: "",
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(
        result.error.issues.some((i) => i.path.includes("feedback")),
        true
      );
    }
  });

  await t.test("Rejects RESUBMISSION_REQUESTED when written feedback is empty", () => {
    const result = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "RESUBMISSION_REQUESTED",
      feedback: "   ",
    });
    assert.equal(result.success, false);
  });

  await t.test("Accepts REJECTED when written feedback is provided", () => {
    const result = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "REJECTED",
      feedback: "Please fix failing tests and adhere to the REST route conventions.",
    });
    assert.equal(result.success, true);
  });
});

test("5. Assignment Form Schema Validation", async (t) => {
  await t.test("Accepts valid assignment creation form payload", () => {
    const result = assignmentSchema.safeParse({
      title: "Real-time Chat Engine",
      description: "Build WebSockets engine with Durable Objects or Redis pub/sub.",
      instructions: "Implement chat rooms, heartbeat pings, and disconnect handlers.",
      status: "PUBLISHED",
      submissionPolicy: "RESUBMITTABLE",
      maxScore: 100,
    });
    assert.equal(result.success, true);
  });

  await t.test("Rejects title shorter than 3 characters", () => {
    const result = assignmentSchema.safeParse({
      title: "AB",
      description: "Long enough description for the challenge.",
      instructions: "Long enough instructions for the challenge.",
    });
    assert.equal(result.success, false);
  });
});

test("6. Role-Based Assignment & Review Governance", async (t) => {
  await t.test("Student cannot create, edit, or delete assignments", () => {
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.ASSIGNMENT_CREATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.ASSIGNMENT_UPDATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.ASSIGNMENT_DELETE), false);
  });

  await t.test("Student cannot review submissions", () => {
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.REVIEW_CREATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.REVIEW_UPDATE), false);
  });

  await t.test("Mentor has assignment authoring and submission review permissions", () => {
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.ASSIGNMENT_CREATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.ASSIGNMENT_UPDATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.REVIEW_CREATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.REVIEW_UPDATE), true);
  });

  await t.test("Admin has full assignment and review management permissions", () => {
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.ASSIGNMENT_CREATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.ASSIGNMENT_UPDATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.ASSIGNMENT_DELETE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.REVIEW_CREATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.REVIEW_UPDATE), true);
  });
});

test("7. Query Keys Stability for Assignments, Submissions & Reviews", async (t) => {
  await t.test("Generates consistent hierarchical query keys", () => {
    assert.deepEqual(queryKeys.assignments.all(), ["projectpilot", "assignments"]);
    assert.deepEqual(queryKeys.assignments.detail("asg-123"), [
      "projectpilot",
      "assignments",
      "detail",
      "asg-123",
    ]);

    assert.deepEqual(queryKeys.submissions.all(), ["projectpilot", "submissions"]);
    assert.deepEqual(queryKeys.submissions.attempts("asg-1", "std-1"), [
      "projectpilot",
      "submissions",
      "attempts",
      "asg-1",
      "std-1",
    ]);

    assert.deepEqual(queryKeys.reviews.all(), ["projectpilot", "reviews"]);
    assert.deepEqual(queryKeys.reviews.bySubmission("sub-1"), [
      "projectpilot",
      "reviews",
      "submission",
      "sub-1",
    ]);
    assert.deepEqual(queryKeys.reviews.queue({ status: "PENDING" }), [
      "projectpilot",
      "reviews",
      "queue",
      { status: "PENDING" },
    ]);
  });
});
