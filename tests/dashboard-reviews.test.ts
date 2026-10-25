import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dashboardService } from "../src/lib/services/dashboard.service";
import { reviewService } from "../src/lib/services/review.service";
import { userService } from "../src/lib/services/user.service";
import { queryKeys } from "../src/lib/api/query-keys";
import { reviewSchema } from "../src/features/reviews/schemas/review.schema";
import type { CurrentUser } from "../src/types/auth";

const mockStudent: CurrentUser = {
  id: "student-1",
  name: "Alice Student",
  email: "alice@projectpilot.dev",
  role: "STUDENT",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const mockMentor: CurrentUser = {
  id: "mentor-1",
  name: "Bob Mentor",
  email: "bob@projectpilot.dev",
  role: "MENTOR",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const mockAdmin: CurrentUser = {
  id: "admin-1",
  name: "Charlie Admin",
  email: "charlie@projectpilot.dev",
  role: "ADMIN",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("1. Student Dashboard Metrics & Authorization", () => {
  it("allows student to retrieve student dashboard summary", async () => {
    const data = await dashboardService.getStudentDashboard(undefined, mockStudent);

    assert.ok(data.overview);
    assert.equal(typeof data.overview.accessibleCoursesCount, "number");
    assert.equal(typeof data.overview.accessibleAssignmentsCount, "number");
    assert.equal(typeof data.overview.totalSubmissionsCount, "number");
    assert.equal(typeof data.overview.completionRate, "number");
    assert.ok(data.overview.completionRate >= 0 && data.overview.completionRate <= 100);

    assert.ok(data.submissionsByStatus);
    assert.equal(typeof data.submissionsByStatus.PENDING, "number");
    assert.equal(typeof data.submissionsByStatus.APPROVED, "number");
    assert.equal(typeof data.submissionsByStatus.REJECTED, "number");

    assert.ok(Array.isArray(data.recentSubmissions));
    assert.ok(data.notes.enrollmentModel);
    assert.ok(data.notes.completionCriteria);
  });

  it("denies mentor and admin from accessing student dashboard", async () => {
    await assert.rejects(
      async () => dashboardService.getStudentDashboard(undefined, mockMentor),
      /Access denied: only students can view the student dashboard/
    );

    await assert.rejects(
      async () => dashboardService.getStudentDashboard(undefined, mockAdmin),
      /Access denied: only students can view the student dashboard/
    );

    await assert.rejects(
      async () => dashboardService.getStudentDashboard(undefined, null),
      /Access denied: only students can view the student dashboard/
    );
  });
});

describe("2. Mentor Dashboard Metrics & Authorization", () => {
  it("allows mentor to retrieve mentor dashboard summary", async () => {
    const data = await dashboardService.getMentorDashboard(undefined, mockMentor);

    assert.ok(data.overview);
    assert.equal(typeof data.overview.manageableCoursesCount, "number");
    assert.equal(typeof data.overview.manageableAssignmentsCount, "number");
    assert.equal(typeof data.overview.pendingReviewsCount, "number");
    assert.equal(typeof data.overview.reviewedSubmissionsCount, "number");
    assert.equal(typeof data.overview.totalFeedbacksGiven, "number");

    assert.ok(data.submissionsByStatus);
    assert.ok(Array.isArray(data.recentSubmissions));
    assert.ok(Array.isArray(data.recentReviews));
  });

  it("denies student and guest from accessing mentor dashboard", async () => {
    await assert.rejects(
      async () => dashboardService.getMentorDashboard(undefined, mockStudent),
      /Access denied: only mentors can view the mentor dashboard/
    );

    await assert.rejects(
      async () => dashboardService.getMentorDashboard(undefined, null),
      /Access denied: only mentors can view the mentor dashboard/
    );
  });
});

describe("3. Admin Dashboard & Platform-Wide Oversight", () => {
  it("allows admin to retrieve global platform statistics", async () => {
    const data = await dashboardService.getAdminDashboard(undefined, mockAdmin);

    assert.ok(data.users);
    assert.equal(typeof data.users.total, "number");
    assert.ok(data.users.byRole.STUDENT !== undefined);
    assert.ok(data.users.byRole.MENTOR !== undefined);
    assert.ok(data.users.byRole.ADMIN !== undefined);

    assert.ok(data.courses);
    assert.equal(typeof data.courses.published, "number");
    assert.equal(typeof data.courses.draft, "number");

    assert.ok(data.assignments);
    assert.equal(typeof data.assignments.published, "number");
    assert.equal(typeof data.assignments.draft, "number");

    assert.ok(data.submissions);
    assert.equal(typeof data.submissions.total, "number");
    assert.equal(typeof data.submissions.pendingReviewTotal, "number");

    assert.ok(data.recentActivity);
    assert.ok(Array.isArray(data.recentActivity.recentUsers));
    assert.ok(Array.isArray(data.recentActivity.recentSubmissions));
  });

  it("denies non-admin roles from accessing admin dashboard", async () => {
    await assert.rejects(
      async () => dashboardService.getAdminDashboard(undefined, mockStudent),
      /Access denied: only administrators can view the administrator dashboard/
    );

    await assert.rejects(
      async () => dashboardService.getAdminDashboard(undefined, mockMentor),
      /Access denied: only administrators can view the administrator dashboard/
    );
  });
});

describe("4. Admin User Directory Governance & Password Protection", () => {
  it("lists users with active status and strictly excludes password credentials", async () => {
    const result = await userService.list({ page: 1, limit: 10 }, mockAdmin);

    assert.ok(result.items.length > 0);
    for (const u of result.items) {
      assert.ok(u.id);
      assert.ok(u.email);
      assert.ok(u.name);
      assert.ok(u.role === "STUDENT" || u.role === "MENTOR" || u.role === "ADMIN");
      assert.ok(u.status === "ACTIVE" || u.status === "INACTIVE");
      // Security check: passwords and password hashes must never be present
      assert.equal("password" in u, false);
      assert.equal("passwordHash" in u, false);
    }
  });

  it("enforces admin access for user directory", async () => {
    await assert.rejects(
      async () => userService.list({ page: 1, limit: 10 }, mockStudent),
      /Access denied: user directory requires administrative permissions/
    );

    await assert.rejects(
      async () => userService.list({ page: 1, limit: 10 }, null),
      /Access denied: user directory requires administrative permissions/
    );
  });
});

describe("5. Mentor Review Queue Scoping & Decision Validation", () => {
  it("allows mentor and admin to fetch review queue", async () => {
    const mentorQueue = await reviewService.getReviewQueue(undefined, mockMentor);
    assert.ok(Array.isArray(mentorQueue.items));
    assert.equal(typeof mentorQueue.total, "number");

    const adminQueue = await reviewService.getReviewQueue(undefined, mockAdmin);
    assert.ok(Array.isArray(adminQueue.items));
    assert.equal(typeof adminQueue.total, "number");
  });

  it("denies student from accessing mentor review queue", async () => {
    await assert.rejects(
      async () => reviewService.getReviewQueue(undefined, mockStudent),
      /Access denied: only mentors and administrators can view the review queue/
    );
  });

  it("validates review decision schema constraints", () => {
    // Approved without comment is permitted
    const validApproval = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "APPROVED",
      feedback: "",
    });
    assert.equal(validApproval.success, true);

    // Rejected requires non-empty feedback
    const invalidRejection = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "REJECTED",
      feedback: "   ",
    });
    assert.equal(invalidRejection.success, false);

    // Resubmission requested requires non-empty feedback
    const invalidResubmission = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "RESUBMISSION_REQUESTED",
      feedback: "",
    });
    assert.equal(invalidResubmission.success, false);

    const validResubmission = reviewSchema.safeParse({
      submissionId: "sub-1",
      status: "RESUBMISSION_REQUESTED",
      feedback: "Please add validation on the form input fields and redeploy.",
    });
    assert.equal(validResubmission.success, true);
  });
});

describe("6. Dashboard Query Keys Stability", () => {
  it("generates consistent hierarchical query keys for all dashboard routes", () => {
    assert.deepEqual(
      queryKeys.dashboard.student({ from: "2026-01-01" }),
      ["projectpilot", "dashboard", "student", { from: "2026-01-01" }]
    );

    assert.deepEqual(
      queryKeys.dashboard.mentor({ to: "2026-12-31" }),
      ["projectpilot", "dashboard", "mentor", { to: "2026-12-31" }]
    );

    assert.deepEqual(
      queryKeys.dashboard.admin(),
      ["projectpilot", "dashboard", "admin", {}]
    );

    assert.deepEqual(
      queryKeys.dashboard.adminUsers({ role: "MENTOR" }),
      ["projectpilot", "dashboard", "admin", "users", { role: "MENTOR" }]
    );

    assert.deepEqual(
      queryKeys.reviews.queue({ status: "PENDING" }),
      ["projectpilot", "reviews", "queue", { status: "PENDING" }]
    );
  });
});
