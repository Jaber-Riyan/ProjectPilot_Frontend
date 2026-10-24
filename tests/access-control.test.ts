import test from "node:test";
import assert from "node:assert/strict";

import { PERMISSIONS } from "../src/lib/access/permissions.ts";
import { ROLE_PERMISSIONS } from "../src/lib/access/role-permissions.ts";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessCourse,
  canAccessSubmission,
  canAccessAssignment,
} from "../src/lib/access/access-control.ts";
import {
  canAccessRoute,
  matchRoutePattern,
  findRouteRule,
} from "../src/lib/access/route-access.ts";
import { courseService } from "../src/lib/services/course.service.ts";
import { assignmentService } from "../src/lib/services/assignment.service.ts";
import { submissionService } from "../src/lib/services/submission.service.ts";
import { reviewService } from "../src/lib/services/review.service.ts";
import { userService } from "../src/lib/services/user.service.ts";
import { mockStore } from "../src/lib/mock-data/store.ts";
import type { CurrentUser } from "../src/types/auth.ts";
import type { Course, Submission, Assignment } from "../src/types/domain.ts";

const studentUser: CurrentUser = {
  id: "user-student-001",
  name: "Demo Student",
  email: "student@projectpilot.dev",
  role: "STUDENT",
};

const otherStudentUser: CurrentUser = {
  id: "user-student-002",
  name: "Jane Learner",
  email: "jane.learner@projectpilot.dev",
  role: "STUDENT",
};

const mentorUser: CurrentUser = {
  id: "user-mentor-001",
  name: "Demo Mentor",
  email: "mentor@projectpilot.dev",
  role: "MENTOR",
};

const otherMentorUser: CurrentUser = {
  id: "user-mentor-002",
  name: "Marcus Vance",
  email: "marcus.mentor@projectpilot.dev",
  role: "MENTOR",
};

const adminUser: CurrentUser = {
  id: "user-admin-001",
  name: "Demo Admin",
  email: "admin@projectpilot.dev",
  role: "ADMIN",
};

test("1. Permission Matrix & Basic Role Checks", async (t) => {
  await t.test("Student capabilities", () => {
    assert.equal(hasPermission(studentUser, PERMISSIONS.DASHBOARD_VIEW), true);
    assert.equal(hasPermission(studentUser, PERMISSIONS.COURSE_READ), true);
    assert.equal(hasPermission(studentUser, PERMISSIONS.ASSIGNMENT_READ), true);
    assert.equal(hasPermission(studentUser, PERMISSIONS.SUBMISSION_READ_OWN), true);
    assert.equal(hasPermission(studentUser, PERMISSIONS.SUBMISSION_CREATE), true);

    // Forbidden for student
    assert.equal(hasPermission(studentUser, PERMISSIONS.COURSE_CREATE), false);
    assert.equal(hasPermission(studentUser, PERMISSIONS.COURSE_UPDATE), false);
    assert.equal(hasPermission(studentUser, PERMISSIONS.COURSE_DELETE), false);
    assert.equal(hasPermission(studentUser, PERMISSIONS.SUBMISSION_READ_ALL), false);
    assert.equal(hasPermission(studentUser, PERMISSIONS.REVIEW_CREATE), false);
    assert.equal(hasPermission(studentUser, PERMISSIONS.USER_MANAGE), false);
  });

  await t.test("Mentor capabilities", () => {
    assert.equal(hasPermission(mentorUser, PERMISSIONS.COURSE_CREATE), true);
    assert.equal(hasPermission(mentorUser, PERMISSIONS.COURSE_UPDATE), true);
    assert.equal(hasPermission(mentorUser, PERMISSIONS.SUBMISSION_READ_ASSIGNED), true);
    assert.equal(hasPermission(mentorUser, PERMISSIONS.REVIEW_CREATE), true);
    assert.equal(hasPermission(mentorUser, PERMISSIONS.REVIEW_UPDATE), true);

    // Forbidden for mentor
    assert.equal(hasPermission(mentorUser, PERMISSIONS.COURSE_DELETE), false);
    assert.equal(hasPermission(mentorUser, PERMISSIONS.SUBMISSION_READ_ALL), false);
    assert.equal(hasPermission(mentorUser, PERMISSIONS.USER_MANAGE), false);
  });

  await t.test("Admin capabilities", () => {
    assert.equal(hasPermission(adminUser, PERMISSIONS.COURSE_DELETE), true);
    assert.equal(hasPermission(adminUser, PERMISSIONS.SUBMISSION_READ_ALL), true);
    assert.equal(hasPermission(adminUser, PERMISSIONS.USER_MANAGE), true);
    assert.equal(hasPermission(adminUser, PERMISSIONS.USER_READ), true);
  });

  await t.test("Unauthenticated (Guest) safety", () => {
    assert.equal(hasPermission(null, PERMISSIONS.DASHBOARD_VIEW), false);
    assert.equal(hasPermission(null, PERMISSIONS.COURSE_READ), false);
    assert.equal(hasPermission(null, PERMISSIONS.USER_MANAGE), false);
    assert.equal(hasAnyPermission(null, [PERMISSIONS.COURSE_READ]), false);
    assert.equal(hasAllPermissions(null, [PERMISSIONS.COURSE_READ]), false);
  });
});

test("2. Route Pattern Matching and Access Control", async (t) => {
  await t.test("Route pattern matching", () => {
    assert.equal(matchRoutePattern("/courses/[courseId]", "/courses/course-1"), true);
    assert.equal(matchRoutePattern("/courses/[courseId]/edit", "/courses/course-1/edit"), true);
    assert.equal(matchRoutePattern("/courses/[courseId]", "/courses/course-1/edit"), false);
    assert.equal(matchRoutePattern("/assignments/[assignmentId]", "/assignments/asg-auth"), true);
    assert.equal(matchRoutePattern("/submissions/[submissionId]", "/submissions/sub-001"), true);
  });

  await t.test("Student route access", () => {
    assert.equal(canAccessRoute(studentUser, "/student/dashboard"), true);
    assert.equal(canAccessRoute(studentUser, "/courses"), true);
    assert.equal(canAccessRoute(studentUser, "/courses/course-1"), true);
    assert.equal(canAccessRoute(studentUser, "/assignments"), true);
    assert.equal(canAccessRoute(studentUser, "/assignments/asg-1"), true);
    assert.equal(canAccessRoute(studentUser, "/submissions"), true);

    // Protected pages inaccessible to Student
    assert.equal(canAccessRoute(studentUser, "/courses/new"), false);
    assert.equal(canAccessRoute(studentUser, "/courses/course-1/edit"), false);
    assert.equal(canAccessRoute(studentUser, "/courses/course-1/modules"), false);
    assert.equal(canAccessRoute(studentUser, "/assignments/new"), false);
    assert.equal(canAccessRoute(studentUser, "/assignments/asg-1/edit"), false);
    assert.equal(canAccessRoute(studentUser, "/users"), false);
  });

  await t.test("Mentor route access", () => {
    assert.equal(canAccessRoute(mentorUser, "/mentor/dashboard"), true);
    assert.equal(canAccessRoute(mentorUser, "/courses"), true);
    assert.equal(canAccessRoute(mentorUser, "/courses/new"), true);
    assert.equal(canAccessRoute(mentorUser, "/courses/course-1/edit"), true);
    assert.equal(canAccessRoute(mentorUser, "/courses/course-1/modules"), true);
    assert.equal(canAccessRoute(mentorUser, "/assignments/new"), true);
    assert.equal(canAccessRoute(mentorUser, "/assignments/asg-1/edit"), true);
    assert.equal(canAccessRoute(mentorUser, "/submissions"), true);

    // User management inaccessible to Mentor
    assert.equal(canAccessRoute(mentorUser, "/users"), false);
  });

  await t.test("Admin route access", () => {
    assert.equal(canAccessRoute(adminUser, "/admin/dashboard"), true);
    assert.equal(canAccessRoute(adminUser, "/courses/new"), true);
    assert.equal(canAccessRoute(adminUser, "/users"), true);
    assert.equal(canAccessRoute(adminUser, "/users/user-student-001"), true);
  });

  await t.test("Guest route access", () => {
    assert.equal(canAccessRoute(null, "/"), true);
    assert.equal(canAccessRoute(null, "/login"), true);
    assert.equal(canAccessRoute(null, "/access-denied"), true);
    assert.equal(canAccessRoute(null, "/courses"), false);
    assert.equal(canAccessRoute(null, "/courses/new"), false);
    assert.equal(canAccessRoute(null, "/users"), false);
  });
});

test("3. Resource-Level Scoping Checks", async (t) => {
  const assignedCourse: Course = {
    id: "course-1",
    title: "TypeScript Mastery",
    slug: "typescript-mastery",
    description: "Sample",
    status: "PUBLISHED",
    mentorIds: ["user-mentor-001"],
    moduleIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const unassignedCourse: Course = {
    id: "course-2",
    title: "Postgres Mastery",
    slug: "postgres-mastery",
    description: "Sample",
    status: "PUBLISHED",
    mentorIds: ["user-mentor-002"],
    moduleIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const draftCourse: Course = {
    id: "course-3",
    title: "DevOps",
    slug: "devops",
    description: "Sample",
    status: "DRAFT",
    mentorIds: ["user-mentor-001"],
    moduleIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await t.test("Course editing scope", () => {
    // Mentor 1 assigned to course 1
    assert.equal(canAccessCourse(mentorUser, assignedCourse, "edit"), true);
    // Mentor 1 NOT assigned to course 2
    assert.equal(canAccessCourse(mentorUser, unassignedCourse, "edit"), false);
    // Admin can edit any course
    assert.equal(canAccessCourse(adminUser, unassignedCourse, "edit"), true);
    // Student cannot edit
    assert.equal(canAccessCourse(studentUser, assignedCourse, "edit"), false);
  });

  await t.test("Course deletion scope", () => {
    assert.equal(canAccessCourse(adminUser, assignedCourse, "delete"), true);
    assert.equal(canAccessCourse(mentorUser, assignedCourse, "delete"), false);
    assert.equal(canAccessCourse(studentUser, assignedCourse, "delete"), false);
  });

  await t.test("Draft course visibility", () => {
    // Student cannot view draft course
    assert.equal(canAccessCourse(studentUser, draftCourse, "view"), false);
    // Assigned mentor CAN view draft course
    assert.equal(canAccessCourse(mentorUser, draftCourse, "view"), true);
    // Unassigned mentor CANNOT view unassigned draft course
    assert.equal(canAccessCourse(otherMentorUser, draftCourse, "view"), false);
    // Admin can view draft
    assert.equal(canAccessCourse(adminUser, draftCourse, "view"), true);
  });

  await t.test("Submission access scope", () => {
    const studentSubmission: Submission = {
      id: "sub-1",
      assignmentId: "asg-1",
      studentId: "user-student-001",
      attemptNumber: 1,
      status: "PENDING",
      submittedAt: new Date().toISOString(),
    };

    // Owner student can access
    assert.equal(canAccessSubmission(studentUser, studentSubmission, assignedCourse), true);
    // Other student CANNOT access
    assert.equal(canAccessSubmission(otherStudentUser, studentSubmission, assignedCourse), false);
    // Assigned mentor can access
    assert.equal(canAccessSubmission(mentorUser, studentSubmission, assignedCourse), true);
    // Unassigned mentor CANNOT access
    assert.equal(canAccessSubmission(otherMentorUser, studentSubmission, assignedCourse), false);
    // Admin can access
    assert.equal(canAccessSubmission(adminUser, studentSubmission, assignedCourse), true);
  });
});

test("4. Service-Level Data Scoping & CRUD Isolation", async (t) => {
  // Reset store to known fixture state
  mockStore.resetToDefaults();

  await t.test("CourseService list scoping", async () => {
    const studentCourses = await courseService.list({ limit: 10 }, studentUser);
    // Students must only see published courses
    assert.equal(studentCourses.items.every((c) => c.status === "PUBLISHED"), true);

    const mentorCourses = await courseService.list({ limit: 10 }, mentorUser);
    // Mentor 1 sees assigned draft course (course-3)
    const hasAssignedDraft = mentorCourses.items.some((c) => c.id === "course-3");
    assert.equal(hasAssignedDraft, true);

    const adminCourses = await courseService.list({ limit: 10 }, adminUser);
    assert.equal(adminCourses.total >= 3, true);
  });

  await t.test("Course deletion security enforcement", async () => {
    // Non-admin attempting to delete course must fail
    await assert.rejects(
      async () => {
        await courseService.delete("course-1", mentorUser);
      },
      { message: /administrative privileges/i }
    );
  });

  await t.test("SubmissionService list scoping", async () => {
    const studentSubmissions = await submissionService.list({ limit: 10 }, studentUser);
    // All returned submissions must belong to demo student
    assert.equal(
      studentSubmissions.items.every((s) => s.studentId === studentUser.id),
      true
    );

    const mentorSubmissions = await submissionService.list({ limit: 10 }, mentorUser);
    // Mentor 1 is assigned to course-1 (asg-1). Must not see submissions for asg-2 (course-2)
    assert.equal(
      mentorSubmissions.items.every((s) => s.assignmentId === "asg-1"),
      true
    );

    const adminSubmissions = await submissionService.list({ limit: 10 }, adminUser);
    // Admin sees all submissions across assignments
    const asgIds = new Set(adminSubmissions.items.map((s) => s.assignmentId));
    assert.equal(asgIds.has("asg-1"), true);
    assert.equal(asgIds.has("asg-2"), true);
  });

  await t.test("Single submission attempt policy enforcement", async () => {
    // asg-2 enforces ONE_TIME submission policy
    // studentUser already has sub-4 recorded for asg-2 in fixtures
    await assert.rejects(
      async () => {
        await submissionService.create(
          {
            assignmentId: "asg-2",
            answerText: "Second attempt that should be rejected",
          },
          studentUser
        );
      },
      { message: /single-submission policy/i }
    );
  });

  await t.test("Resubmittable submission policy workflow", async () => {
    // asg-1 allows resubmissions
    const newAttempt = await submissionService.create(
      {
        assignmentId: "asg-1",
        answerText: "Fresh third attempt submitted by student",
      },
      studentUser
    );

    assert.equal(newAttempt.studentId, studentUser.id);
    assert.equal(newAttempt.status, "PENDING");
    assert.equal(newAttempt.attemptNumber, 3);
  });

  await t.test("Review evaluation authorization & submission state mutation", async () => {
    // Student attempting to review must be rejected
    await assert.rejects(
      async () => {
        await reviewService.create(
          {
            submissionId: "sub-3",
            feedback: "Unauthorized student review attempt",
            status: "APPROVED",
          },
          studentUser
        );
      },
      { message: /permission to review/i }
    );

    // Mentor 2 attempting to review submission for Course 1 (assigned to Mentor 1) must be rejected
    await assert.rejects(
      async () => {
        await reviewService.create(
          {
            submissionId: "sub-3",
            feedback: "Wrong mentor review attempt",
            status: "APPROVED",
          },
          otherMentorUser
        );
      },
      { message: /assigned to you/i }
    );

    // Mentor 1 (assigned mentor) reviewing sub-3 succeeds
    const review = await reviewService.create(
      {
        submissionId: "sub-3",
        feedback: "Great job! Code architecture is solid.",
        status: "APPROVED",
        score: 95,
      },
      mentorUser
    );

    assert.equal(review.status, "APPROVED");
    assert.equal(review.score, 95);

    // Submission status must be updated to APPROVED
    const updatedSub = await submissionService.getById("sub-3", mentorUser);
    assert.equal(updatedSub.status, "APPROVED");
    assert.equal(updatedSub.score, 95);
  });

  await t.test("UserService access governance", async () => {
    // Student or mentor cannot list users
    await assert.rejects(
      async () => {
        await userService.list({ limit: 10 }, studentUser);
      },
      { message: /administrative/i }
    );

    await assert.rejects(
      async () => {
        await userService.list({ limit: 10 }, mentorUser);
      },
      { message: /administrative/i }
    );

    // Admin can list users
    const users = await userService.list({ limit: 10 }, adminUser);
    assert.equal(users.total >= 5, true);
  });
});
