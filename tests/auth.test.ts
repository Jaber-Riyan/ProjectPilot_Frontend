import test from "node:test";
import assert from "node:assert/strict";

import { loginSchema, signupSchema } from "../src/features/auth/schemas/auth.schema";
import { hasPermission } from "../src/lib/access/access-control";
import { PERMISSIONS } from "../src/lib/access/permissions";
import type { CurrentUser, UserRole } from "../src/types/auth";

test("1. Login Validation Schema", async (t) => {
  await t.test("Validates well-formed email and non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "student@projectpilot.dev",
      password: "Password123!",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.email, "student@projectpilot.dev");
      assert.equal(result.data.password, "Password123!");
    }
  });

  await t.test("Rejects empty email or empty password", () => {
    const emptyEmail = loginSchema.safeParse({ email: "", password: "Password123!" });
    assert.equal(emptyEmail.success, false);

    const emptyPassword = loginSchema.safeParse({ email: "student@projectpilot.dev", password: "" });
    assert.equal(emptyPassword.success, false);
  });

  await t.test("Rejects malformed email addresses", () => {
    const invalidEmail = loginSchema.safeParse({
      email: "not-an-email",
      password: "Password123!",
    });
    assert.equal(invalidEmail.success, false);
  });
});

test("2. Signup Validation Schema", async (t) => {
  await t.test("Accepts compliant user registration input", () => {
    const result = signupSchema.safeParse({
      name: "Jane Developer",
      email: "jane@example.com",
      password: "SecurePassword1!",
      confirmPassword: "SecurePassword1!",
    });
    assert.equal(result.success, true);
  });

  await t.test("Rejects name shorter than 2 characters", () => {
    const result = signupSchema.safeParse({
      name: "J",
      email: "jane@example.com",
      password: "SecurePassword1!",
      confirmPassword: "SecurePassword1!",
    });
    assert.equal(result.success, false);
  });

  await t.test("Enforces password complexity (uppercase, lowercase, number, min 8 chars)", () => {
    // Too short (< 8 chars)
    const short = signupSchema.safeParse({
      name: "Jane Developer",
      email: "jane@example.com",
      password: "Pass1",
      confirmPassword: "Pass1",
    });
    assert.equal(short.success, false);

    // Missing uppercase
    const noUpper = signupSchema.safeParse({
      name: "Jane Developer",
      email: "jane@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    assert.equal(noUpper.success, false);

    // Missing number
    const noNumber = signupSchema.safeParse({
      name: "Jane Developer",
      email: "jane@example.com",
      password: "PasswordXYZ",
      confirmPassword: "PasswordXYZ",
    });
    assert.equal(noNumber.success, false);
  });

  await t.test("Rejects mismatched password confirmation", () => {
    const result = signupSchema.safeParse({
      name: "Jane Developer",
      email: "jane@example.com",
      password: "SecurePassword1!",
      confirmPassword: "DifferentPassword1!",
    });
    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("confirmPassword"));
      assert.ok(issue);
      assert.match(issue.message, /passwords do not match/i);
    }
  });
});

test("3. Authenticated User Entity & Role Boundary Contracts", async (t) => {
  const verifiedStudent: CurrentUser = {
    id: "usr-student-001",
    name: "Verified Student",
    email: "student@projectpilot.dev",
    role: "STUDENT",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const verifiedMentor: CurrentUser = {
    id: "usr-mentor-001",
    name: "Verified Mentor",
    email: "mentor@projectpilot.dev",
    role: "MENTOR",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const verifiedAdmin: CurrentUser = {
    id: "usr-admin-001",
    name: "Verified Admin",
    email: "admin@projectpilot.dev",
    role: "ADMIN",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  await t.test("Student role has learning access but cannot author courses", () => {
    assert.equal(hasPermission(verifiedStudent, PERMISSIONS.DASHBOARD_VIEW), true);
    assert.equal(hasPermission(verifiedStudent, PERMISSIONS.COURSE_READ), true);
    assert.equal(hasPermission(verifiedStudent, PERMISSIONS.SUBMISSION_CREATE), true);
    assert.equal(hasPermission(verifiedStudent, PERMISSIONS.COURSE_CREATE), false);
    assert.equal(hasPermission(verifiedStudent, PERMISSIONS.USER_MANAGE), false);
  });

  await t.test("Mentor role has course authoring and grading capabilities", () => {
    assert.equal(hasPermission(verifiedMentor, PERMISSIONS.COURSE_CREATE), true);
    assert.equal(hasPermission(verifiedMentor, PERMISSIONS.REVIEW_CREATE), true);
    assert.equal(hasPermission(verifiedMentor, PERMISSIONS.USER_MANAGE), false);
    assert.equal(hasPermission(verifiedMentor, PERMISSIONS.COURSE_DELETE), false);
  });

  await t.test("Admin role possesses complete administrative access", () => {
    assert.equal(hasPermission(verifiedAdmin, PERMISSIONS.COURSE_DELETE), true);
    assert.equal(hasPermission(verifiedAdmin, PERMISSIONS.USER_MANAGE), true);
    assert.equal(hasPermission(verifiedAdmin, PERMISSIONS.USER_READ), true);
  });
});
