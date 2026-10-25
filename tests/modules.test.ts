import test from "node:test";
import assert from "node:assert/strict";

import { normalizeModule } from "../src/lib/services/module.service";
import { normalizeContentItem } from "../src/lib/services/content.service";
import {
  createIndependentModuleSchema,
  attachOrAddModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
} from "../src/features/modules/schemas/module.schema";
import {
  contentSchema,
  updateContentItemSchema,
  reorderContentSchema,
} from "../src/features/content/schemas/content.schema";
import { queryKeys } from "../src/lib/api/query-keys";
import { moduleService } from "../src/lib/services/module.service";
import { contentService } from "../src/lib/services/content.service";
import { hasPermission } from "../src/lib/access/access-control";
import { PERMISSIONS } from "../src/lib/access/permissions";
import type { CurrentUser } from "../src/types/auth";

const mockAdminUser: CurrentUser = {
  id: "admin-uuid-001",
  name: "System Administrator",
  email: "admin@projectpilot.dev",
  role: "ADMIN",
  isActive: true,
  createdAt: new Date().toISOString(),
};

const mockMentorUser: CurrentUser = {
  id: "mentor-uuid-001",
  name: "Lead Mentor",
  email: "mentor@projectpilot.dev",
  role: "MENTOR",
  isActive: true,
  createdAt: new Date().toISOString(),
};

const mockStudentUser: CurrentUser = {
  id: "student-uuid-001",
  name: "Active Student",
  email: "student@projectpilot.dev",
  role: "STUDENT",
  isActive: true,
  createdAt: new Date().toISOString(),
};

test("1. Module & Content Item Normalization", async (t) => {
  await t.test("Normalizes module response from backend", () => {
    const rawBackendModule = {
      id: "cf78f442-108e-4330-bc4b-60d8604134f4",
      title: "Content Host Module",
      description: null,
      isPublished: true,
      createdById: null,
      createdAt: "2026-10-24T11:16:07.691Z",
      updatedAt: "2026-10-24T11:16:07.691Z",
      _count: {
        contentItems: 4,
        courseModules: 0,
      },
      contentItems: [
        {
          id: "da85ca0f-ce1b-4c6d-86c9-d2eb7d165ea7",
          moduleId: "cf78f442-108e-4330-bc4b-60d8604134f4",
          type: "TEXT",
          title: "Reading Material: Express Lifecycle",
          description: null,
          body: "# Express Architecture",
          url: null,
          order: 1,
          assignmentId: null,
          createdAt: "2026-10-24T11:16:16.688Z",
          updatedAt: "2026-10-24T11:16:31.082Z",
        },
      ],
      courseModules: [],
    };

    const mod = normalizeModule(rawBackendModule);
    assert.equal(mod.id, "cf78f442-108e-4330-bc4b-60d8604134f4");
    assert.equal(mod.title, "Content Host Module");
    assert.equal(mod.isPublished, true);
    assert.equal(mod.contentItems.length, 1);
    assert.equal(mod.contentItems[0].title, "Reading Material: Express Lifecycle");
    assert.equal(mod.contentItems[0].type, "TEXT");
    assert.equal(mod._count?.contentItems, 4);
  });

  await t.test("Normalizes content item with video link", () => {
    const rawContent = {
      id: "video-item-01",
      moduleId: "cf78f442-108e-4330-bc4b-60d8604134f4",
      type: "YOUTUBE_VIDEO",
      title: "Video Lecture: React 19 Essentials",
      description: "Comprehensive lecture video",
      body: null,
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order: 2,
      assignmentId: null,
      createdAt: "2026-10-24T11:16:11.115Z",
      updatedAt: "2026-10-24T11:16:31.394Z",
    };

    const item = normalizeContentItem(rawContent);
    assert.equal(item.id, "video-item-01");
    assert.equal(item.type, "YOUTUBE_VIDEO");
    assert.equal(item.url, "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    assert.equal(item.order, 2);
  });
});

test("2. Module Schemas Validation", async (t) => {
  await t.test("Validates independent module creation schema", () => {
    const valid = createIndependentModuleSchema.safeParse({
      title: "Database Systems & Postgres",
      description: "Deep dive into indexes and query plans",
      isPublished: true,
    });
    assert.equal(valid.success, true);

    const invalid = createIndependentModuleSchema.safeParse({
      title: "  ",
    });
    assert.equal(invalid.success, false);
  });

  await t.test("Validates attach-existing mode in attachOrAddModuleSchema", () => {
    const validExisting = attachOrAddModuleSchema.safeParse({
      mode: "EXISTING",
      moduleId: "cf78f442-108e-4330-bc4b-60d8604134f4",
      order: 3,
    });
    assert.equal(validExisting.success, true);

    const missingModuleId = attachOrAddModuleSchema.safeParse({
      mode: "EXISTING",
      moduleId: "",
    });
    assert.equal(missingModuleId.success, false);
  });

  await t.test("Validates create-and-attach mode in attachOrAddModuleSchema", () => {
    const validNew = attachOrAddModuleSchema.safeParse({
      mode: "NEW",
      title: "State Management with Zustand",
      description: "Store patterns in client components",
      order: 1,
      isPublished: true,
    });
    assert.equal(validNew.success, true);

    const missingTitle = attachOrAddModuleSchema.safeParse({
      mode: "NEW",
      title: "",
    });
    assert.equal(missingTitle.success, false);
  });

  await t.test("Validates reorderModulesSchema: requires unique non-empty array", () => {
    const valid = reorderModulesSchema.safeParse({
      moduleIds: ["mod-1", "mod-2", "mod-3"],
    });
    assert.equal(valid.success, true);

    const withDuplicates = reorderModulesSchema.safeParse({
      moduleIds: ["mod-1", "mod-1", "mod-2"],
    });
    assert.equal(withDuplicates.success, false);

    const empty = reorderModulesSchema.safeParse({
      moduleIds: [],
    });
    assert.equal(empty.success, false);
  });
});

test("3. Content Item Schemas & Conditional Validation", async (t) => {
  await t.test("Enforces body requirement for TEXT content items", () => {
    const valid = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Markdown Reading",
      type: "TEXT",
      body: "# Introduction to TypeScript Types",
      order: 1,
    });
    assert.equal(valid.success, true);

    const missingBody = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Markdown Reading",
      type: "TEXT",
      body: "",
    });
    assert.equal(missingBody.success, false);
  });

  await t.test("Enforces URL requirement for VIDEO, YOUTUBE_VIDEO, and LINK items", () => {
    const validYoutube = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Video Lecture",
      type: "YOUTUBE_VIDEO",
      url: "https://www.youtube.com/watch?v=123",
    });
    assert.equal(validYoutube.success, true);

    const validLink = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Documentation Link",
      type: "LINK",
      url: "https://nextjs.org/docs",
    });
    assert.equal(validLink.success, true);

    const invalidUrl = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Invalid URL Item",
      type: "LINK",
      url: "not-a-valid-http-url",
    });
    assert.equal(invalidUrl.success, false);
  });

  await t.test("Enforces assignmentId for ASSIGNMENT content items", () => {
    const validAssignment = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Homework 1",
      type: "ASSIGNMENT",
      assignmentId: "b7249e58-19e6-460e-b091-c515368114fd",
    });
    assert.equal(validAssignment.success, true);

    const missingAssignment = contentSchema.safeParse({
      moduleId: "mod-1",
      title: "Homework Missing ID",
      type: "ASSIGNMENT",
      assignmentId: "",
    });
    assert.equal(missingAssignment.success, false);
  });

  await t.test("Validates reorderContentSchema without duplicates", () => {
    const valid = reorderContentSchema.safeParse({
      contentItemIds: ["item-1", "item-2"],
    });
    assert.equal(valid.success, true);

    const duplicate = reorderContentSchema.safeParse({
      contentItemIds: ["item-1", "item-1"],
    });
    assert.equal(duplicate.success, false);
  });
});

test("4. Query Keys Stability for Modules & Content", async (t) => {
  await t.test("Generates stable hierarchical query keys", () => {
    const courseModulesKey = queryKeys.modules.byCourse("course-123");
    assert.deepEqual(courseModulesKey, [
      "projectpilot",
      "modules",
      "byCourse",
      "course-123",
    ]);

    const libraryKey = queryKeys.modules.library({ page: 1, limit: 10 });
    assert.deepEqual(libraryKey, [
      "projectpilot",
      "modules",
      "library",
      { page: 1, limit: 10 },
    ]);

    const moduleContentKey = queryKeys.content.byModule("module-456");
    assert.deepEqual(moduleContentKey, [
      "projectpilot",
      "content",
      "byModule",
      "module-456",
    ]);
  });
});

test("5. Service-Level Offline Mock Isolation & Fallbacks", async (t) => {
  await t.test("ModuleService creates independent module offline", async () => {
    const created = await moduleService.create(
      {
        title: "Microservices Architecture",
        description: "Event-driven architecture with Kafka",
        isPublished: true,
      },
      mockAdminUser
    );
    assert.ok(created.id);
    assert.equal(created.title, "Microservices Architecture");
  });

  await t.test("ContentService handles content CRUD offline", async () => {
    const items = await contentService.list("mod-1", mockAdminUser);
    assert.ok(Array.isArray(items));
  });
});

test("6. Role-Based Module and Content Management Access Governance", async (t) => {
  await t.test("Mentor has module & content creation and update permissions", () => {
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.MODULE_CREATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.MODULE_UPDATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.MODULE_DELETE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.CONTENT_CREATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.CONTENT_UPDATE), true);
    assert.equal(hasPermission(mockMentorUser, PERMISSIONS.CONTENT_DELETE), true);
  });

  await t.test("Admin has complete module & content management authority", () => {
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.MODULE_CREATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.MODULE_UPDATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.MODULE_DELETE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.CONTENT_CREATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.CONTENT_UPDATE), true);
    assert.equal(hasPermission(mockAdminUser, PERMISSIONS.CONTENT_DELETE), true);
  });

  await t.test("Student cannot create, update, or delete modules or content items", () => {
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.MODULE_CREATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.MODULE_UPDATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.MODULE_DELETE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.CONTENT_CREATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.CONTENT_UPDATE), false);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.CONTENT_DELETE), false);
    // Student can only read
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.MODULE_READ), true);
    assert.equal(hasPermission(mockStudentUser, PERMISSIONS.CONTENT_READ), true);
  });

  await t.test("Unauthenticated guest has no management permissions", () => {
    assert.equal(hasPermission(null, PERMISSIONS.MODULE_CREATE), false);
    assert.equal(hasPermission(null, PERMISSIONS.MODULE_DELETE), false);
    assert.equal(hasPermission(null, PERMISSIONS.CONTENT_CREATE), false);
  });
});

