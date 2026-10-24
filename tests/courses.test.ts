import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCourse } from "../src/lib/services/course.service";
import { courseSchema } from "../src/features/courses/schemas/course.schema";
import { canAccessCourse } from "../src/lib/access/access-control";
import { queryKeys } from "../src/lib/api/query-keys";
import type { CurrentUser } from "../src/types/auth";
import type { Course } from "../src/types/domain";

test("1. Course Entity Normalizer (Backend to Domain)", async (t) => {
  await t.test("Normalizes real backend course response with isPublished: true", () => {
    const rawBackendCourse = {
      id: "b2e4c898-9171-4a75-b5aa-57bbd1efc490",
      title: "Fullstack TypeScript Mastery",
      slug: "fullstack-ts-d9-4094d1",
      description: "Complete TS Course",
      imageUrl: null,
      isPublished: true,
      createdById: "1461a3a4-3508-4b51-890e-82ecf95138f4",
      createdAt: "2026-10-24T10:47:52.707Z",
      updatedAt: "2026-10-24T10:47:52.707Z",
      _count: {
        modules: 3,
        courseModules: 3,
      },
    };

    const course = normalizeCourse(rawBackendCourse);
    assert.equal(course.id, "b2e4c898-9171-4a75-b5aa-57bbd1efc490");
    assert.equal(course.title, "Fullstack TypeScript Mastery");
    assert.equal(course.slug, "fullstack-ts-d9-4094d1");
    assert.equal(course.isPublished, true);
    assert.equal(course.status, "PUBLISHED");
    assert.equal(course.modulesCount, 3);
    assert.equal(course.createdById, "1461a3a4-3508-4b51-890e-82ecf95138f4");
    assert.deepEqual(course.mentorIds, ["1461a3a4-3508-4b51-890e-82ecf95138f4"]);
  });

  await t.test("Normalizes draft course with isPublished: false", () => {
    const rawDraftCourse = {
      id: "draft-course-001",
      title: "Upcoming Rust Essentials",
      slug: "upcoming-rust-essentials",
      description: null,
      imageUrl: "https://example.com/rust.png",
      isPublished: false,
      createdById: "creator-uuid-001",
      createdAt: "2026-10-24T10:47:52.707Z",
      updatedAt: "2026-10-24T10:47:52.707Z",
      courseModules: [
        { id: "cm-1", courseId: "draft-course-001", moduleId: "mod-1", order: 1 },
        { id: "cm-2", courseId: "draft-course-001", moduleId: "mod-2", order: 2 },
      ],
    };

    const course = normalizeCourse(rawDraftCourse);
    assert.equal(course.status, "DRAFT");
    assert.equal(course.isPublished, false);
    assert.equal(course.description, "");
    assert.equal(course.imageUrl, "https://example.com/rust.png");
    assert.equal(course.modulesCount, 2);
    assert.deepEqual(course.moduleIds, ["mod-1", "mod-2"]);
  });
});

test("2. Course Form Schema Validation", async (t) => {
  await t.test("Accepts compliant course creation payload", () => {
    const result = courseSchema.safeParse({
      title: "Advanced Next.js 15 Masterclass",
      slug: "advanced-nextjs-15-masterclass",
      description: "Master React 19, Server Actions, and Cache Components.",
      imageUrl: "https://images.example.com/next.png",
      isPublished: true,
      status: "PUBLISHED",
      level: "ADVANCED",
      estimatedHours: 25,
    });
    assert.equal(result.success, true);
  });

  await t.test("Rejects title shorter than 3 characters", () => {
    const result = courseSchema.safeParse({
      title: "AI",
      slug: "ai-course",
      description: "Sample description",
      isPublished: false,
    });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("title")));
    }
  });

  await t.test("Rejects malformed slug with uppercase or spaces", () => {
    const uppercaseSlug = courseSchema.safeParse({
      title: "Valid Course Title",
      slug: "Invalid_Slug With Spaces",
    });
    assert.equal(uppercaseSlug.success, false);
    if (!uppercaseSlug.success) {
      assert.ok(uppercaseSlug.error.issues.some((i) => i.path.includes("slug")));
    }
  });

  await t.test("Permits empty imageUrl and description", () => {
    const result = courseSchema.safeParse({
      title: "Minimal Course Entry",
      slug: "minimal-course-entry",
      description: "",
      imageUrl: "",
      isPublished: false,
    });
    assert.equal(result.success, true);
  });
});

test("3. Role-Based Course Access and Management", async (t) => {
  const mentorUser: CurrentUser = {
    id: "usr-mentor-001",
    name: "Instructor Alex",
    email: "mentor@projectpilot.dev",
    role: "MENTOR",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const studentUser: CurrentUser = {
    id: "usr-student-001",
    name: "Student Sam",
    email: "student@projectpilot.dev",
    role: "STUDENT",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const adminUser: CurrentUser = {
    id: "usr-admin-001",
    name: "Admin Jordan",
    email: "admin@projectpilot.dev",
    role: "ADMIN",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const realBackendCourse: Course = {
    id: "course-backend-001",
    title: "Fullstack TypeScript",
    slug: "fullstack-ts",
    description: "Complete course",
    isPublished: true,
    status: "PUBLISHED",
    createdById: "creator-uuid-999",
    mentorIds: [],
    moduleIds: ["mod-1"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  const realBackendDraftCourse: Course = {
    id: "course-backend-draft",
    title: "Draft Go Course",
    slug: "draft-go-course",
    description: "In development",
    isPublished: false,
    status: "DRAFT",
    createdById: "creator-uuid-999",
    mentorIds: [],
    moduleIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  await t.test("Mentor has edit and module management access on real courses", () => {
    assert.equal(canAccessCourse(mentorUser, realBackendCourse, "edit"), true);
    assert.equal(canAccessCourse(mentorUser, realBackendDraftCourse, "edit"), true);
    assert.equal(canAccessCourse(mentorUser, realBackendDraftCourse, "view"), true);
  });

  await t.test("Admin has full access on real courses", () => {
    assert.equal(canAccessCourse(adminUser, realBackendCourse, "edit"), true);
    assert.equal(canAccessCourse(adminUser, realBackendCourse, "delete"), true);
    assert.equal(canAccessCourse(adminUser, realBackendDraftCourse, "view"), true);
  });

  await t.test("Student cannot edit, delete, or view draft courses", () => {
    assert.equal(canAccessCourse(studentUser, realBackendCourse, "edit"), false);
    assert.equal(canAccessCourse(studentUser, realBackendCourse, "delete"), false);
    assert.equal(canAccessCourse(studentUser, realBackendCourse, "view"), true);
    assert.equal(canAccessCourse(studentUser, realBackendDraftCourse, "view"), false);
  });

  await t.test("Guest cannot view draft courses", () => {
    assert.equal(canAccessCourse(null, realBackendCourse, "view"), true);
    assert.equal(canAccessCourse(null, realBackendDraftCourse, "view"), false);
    assert.equal(canAccessCourse(null, realBackendCourse, "edit"), false);
  });
});

test("4. Course Query Keys Stability", async (t) => {
  await t.test("Generates stable hierarchical query keys", () => {
    assert.deepEqual(queryKeys.courses.all(), ["projectpilot", "courses"]);
    assert.deepEqual(queryKeys.courses.detail("course-123"), [
      "projectpilot",
      "courses",
      "detail",
      "course-123",
    ]);
    const listKey = queryKeys.courses.list({ page: 1, limit: 10 });
    assert.equal(listKey[0], "projectpilot");
    assert.equal(listKey[1], "courses");
    assert.equal(listKey[2], "list");
  });
});
