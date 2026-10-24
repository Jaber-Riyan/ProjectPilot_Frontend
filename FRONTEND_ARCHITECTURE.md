# ProjectPilot Frontend — Role-Based Infrastructure, Access Control & Architecture

## Overview

**ProjectPilot** is an enterprise-grade Learning Management System (LMS) frontend built with Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, TanStack Query v5, and React Hook Form + Zod.

This document serves as the architectural reference for the role-based access control (RBAC) model, route hierarchy, CRUD workflows, service boundary abstraction, and deterministic mock repository layer implemented prior to backend API integration.

---

## 1. Route Structure & Shared-Page Strategy

Pages in ProjectPilot are mapped to **granular capabilities and permissions**, not rigidly locked to single role silos. A single route (such as `/courses` or `/submissions`) serves multiple roles, adapting visible actions, scoping data, and gating operations based on permissions.

```text
/
├── login                          # Public: 1-click dev role sign-in & email sign-in simulation
├── register                       # Public: Account registration preview
├── access-denied                  # Public: Access restriction feedback & quick role switcher
├── dashboard                      # Role-aware redirect to specific dashboard
│
├── student/dashboard              # Student workspace: learning progress & quick actions
├── mentor/dashboard               # Mentor workspace: review queue & assigned courses
├── admin/dashboard                # Administrator workspace: global metrics & platform shortcuts
│
├── courses/                       # Shared: Course catalog with status & search filters
│   ├── new                        # Mentor & Admin: Create course form (Zod validated)
│   ├── [courseId]/                # Shared: Syllabus viewer (expandable lessons & assignments)
│   ├── [courseId]/edit            # Scoped: Assigned Mentor & Admin edit form
│   └── [courseId]/modules         # Scoped: Assigned Mentor & Admin curriculum editor
│
├── assignments/                   # Shared: Coursework listing (students see published only)
│   ├── new                        # Mentor & Admin: Create assignment form
│   ├── [assignmentId]/            # Shared: Instructions, student submissions, mentor grading
│   └── [assignmentId]/edit        # Scoped: Assigned Mentor & Admin edit form
│
├── submissions/                   # Scoped Shared Queue:
│   │                              # - Student: Only own submissions
│   │                              # - Mentor: Submissions for assigned courses only
│   │                              # - Admin: Global platform submissions
│   └── [submissionId]/            # Shared: Solution review & evaluation grading form
│
└── users/                         # Admin Only: Platform user directory & access control
    └── [userId]/                  # Admin Only: Role adjustment & active status toggle
```

### Dynamic Parameterized Route Matching
Dynamic routes are evaluated via `matchRoutePattern` in `src/lib/access/route-access.ts`, ensuring that routes such as `/courses/[courseId]/edit` are not conflated with `/courses/[courseId]`.

---

## 2. Centralized Permission & Role Matrix

Access control is never evaluated via scattered inline string comparisons such as `role === "ADMIN"`. Instead, every action is governed by explicit permissions defined in `src/lib/access/permissions.ts`.

### Capability Matrix

| Capability | Permission Key | Student | Mentor | Admin |
|---|---|:---:|:---:|:---:|
| View Workspace Dashboard | `dashboard:view` | Yes | Yes | Yes |
| Browse Published Courses | `course:read` | Yes | Yes | Yes |
| Create New Courses | `course:create` | No | Yes | Yes |
| Edit Courses | `course:update` | No | Yes (Assigned) | Yes (Global) |
| Delete Courses | `course:delete` | No | No | Yes |
| Read Course Modules | `module:read` | Yes | Yes | Yes |
| Create / Edit / Delete Modules | `module:update` | No | Yes (Assigned) | Yes (Global) |
| Read Lessons / Content | `content:read` | Yes | Yes | Yes |
| Manage Content Items | `content:update` | No | Yes (Assigned) | Yes (Global) |
| Read Assignments | `assignment:read` | Yes (Published) | Yes (Assigned) | Yes (Global) |
| Create Assignments | `assignment:create` | No | Yes | Yes |
| Edit Assignments | `assignment:update` | No | Yes (Assigned) | Yes (Global) |
| Delete Assignments | `assignment:delete` | No | No | Yes |
| View Own Submissions | `submission:read-own` | Yes | Yes | Yes |
| Submit Assignment Solution | `submission:create` | Yes | No | No |
| View Assigned Course Submissions | `submission:read-assigned` | No | Yes | Yes |
| View All Platform Submissions | `submission:read-all` | No | No | Yes |
| Grade & Review Submissions | `review:create` | No | Yes (Assigned) | Yes (Global) |
| Update Submission Review | `review:update` | No | Yes (Assigned) | Yes (Global) |
| User Directory Oversight | `user:read` | No | No | Yes |
| Manage User Roles & Status | `user:manage` | No | No | Yes |

### Resource-Level Scoping Checks
In addition to role-level permissions, resource ownership is enforced at the domain layer:
- `canAccessCourse(user, course, action)`: Mentors can only edit courses where `course.mentorIds.includes(user.id)`. Deletion requires `ADMIN`.
- `canAccessSubmission(user, submission, course)`: Students can only view their own submissions (`submission.studentId === user.id`). Mentors can only view submissions for courses where they are in `mentorIds`.
- `canAccessAssignment(user, assignment, course, action)`: Mentors can only modify assignments they authored or that belong to their assigned course.

---

## 3. Mock Session Provider & Development Tooling

Simulated authentication is managed via `MockSessionProvider` (`src/providers/mock-session-provider.tsx`):
- **Development Identities**:
  - `user-student-001` (`Demo Student`, `student@projectpilot.dev`, `STUDENT`)
  - `user-mentor-001` (`Demo Mentor`, `mentor@projectpilot.dev`, `MENTOR`)
  - `user-admin-001` (`Demo Admin`, `admin@projectpilot.dev`, `ADMIN`)
  - Additional test users (`user-student-002`, `user-mentor-002`) to verify mentor scoping isolation.
- **Development Role Switcher**:
  - Accessible via top bar button or within `<AccessDenied />`.
  - Enables instant switching between Student, Mentor, Admin, and Guest (signed-out) modes.
  - Automatically invalidates TanStack Query caches to re-query with the new security scope.
- **Mock State Reset**: One-click restoration of initial fixtures.
- **Clear Labeling**: Persistent amber banner indicators clarify that all actions run in local mock mode without network transmission.

---

## 4. API-Ready Service Boundary & Architecture

```text
UI Page Component (e.g. /courses/[courseId])
       │
       ▼
Feature Hooks (e.g. useCourse, useUpdateCourse)
       │
       ▼
Domain Services (e.g. courseService, submissionService)
  [Enforces role permissions, data scoping & business rules]
       │
       ▼
Repository Interface (e.g. ICourseRepository)
       │
       ├── Mock Implementation: MockCourseRepository (Active)
       │       └── MockStore (Deterministic in-memory/localStorage state)
       │
       └── Future API Implementation: ApiCourseRepository (Next Phase)
               └── Shared API Client (src/lib/api/client.ts)
```

### How to Transition to Backend APIs
1. Implement concrete repositories in `src/lib/repositories/api/` matching `ICourseRepository`, `ISubmissionRepository`, etc., using the existing `src/lib/api/client.ts`.
2. In `src/config/app-config.ts`, change `dataSource: "mock"` to `dataSource: "api"`.
3. In `src/lib/repositories/index.ts`, instantiate the API repository classes.
4. **No UI components, forms, tables, route guards, or React Query hooks need to be rewritten.**

---

## 5. Domain Models & Provisional Backend Assumptions

The following frontend types are defined in `src/types/domain.ts`:

### 1. User
```ts
interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  avatarUrl?: string;
  createdAt: string;
}
```
*Verification needed:* Verify whether the backend Prisma schema includes additional roles (e.g., `INSTRUCTOR`, `TA`, `SUPERADMIN`) or soft-delete timestamps.

### 2. Course
```ts
interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  mentorIds: string[];
  moduleIds: string[];
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}
```
*Verification needed:* Verify whether course mentors are represented as a join table (`CourseMentor`) or direct foreign key.

### 3. Module & ContentItem
```ts
interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  contentIds: string[];
  createdAt: string;
  updatedAt: string;
}

type ContentType = "VIDEO" | "YOUTUBE_VIDEO" | "TEXT" | "LINK" | "ASSIGNMENT";

interface ContentItem {
  id: string;
  moduleId: string;
  title: string;
  type: ContentType;
  order: number;
  body?: string;
  url?: string;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
}
```
*Verification needed:* Verify whether independent modules can be reused across multiple courses or belong to a single course hierarchy.

### 4. Assignment
```ts
type SubmissionPolicy = "ONE_TIME" | "RESUBMITTABLE";

interface Assignment {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  instructions: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  submissionPolicy: SubmissionPolicy;
  dueDate?: string;
  maxScore?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
```
*Verification needed:* Check if assignment submission policy is an enum in the Prisma schema or enforced via application logic.

### 5. Submission & Review
```ts
type SubmissionStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESUBMISSION_REQUESTED";

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  answerText?: string;
  attachmentUrls?: string[];
  status: SubmissionStatus;
  score?: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
}

interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  feedback: string;
  score?: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}
```
*Verification needed:* Verify whether the backend stores a dedicated `Review` entity or merges reviews directly into `Submission` fields.

---

## 6. Verification and Quality Checks

The following automated validation checks were executed and passed with 0 errors:

1. **TypeScript Typecheck (`npm run typecheck`)**: Passed with 0 errors across all types, components, and pages.
2. **ESLint (`npm run lint`)**: Passed with 0 errors and 0 warnings.
3. **Automated Access-Control Test Suite (`npm test`)**: Passed all 24 subtests covering:
   - Student, Mentor, and Admin capability matrices.
   - Route pattern regex parsing and dynamic segment access.
   - Resource-level ownership checks (courses, assignments, submissions).
   - Single-submission policy enforcement.
   - Resubmission sequential attempt numbering.
   - Review creation authorization and submission status mutation.
   - User administration privilege enforcement.
4. **Next.js Production Build (`npm run build`)**: Compiled successfully in 27.3s; all 17 App Router routes generated and optimized.
