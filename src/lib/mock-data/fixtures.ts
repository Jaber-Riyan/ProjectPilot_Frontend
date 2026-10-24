import type {
  User,
  Course,
  CourseModule,
  ContentItem,
  Assignment,
  Submission,
  Review,
} from "@/types/domain";

export const MOCK_USERS: User[] = [
  {
    id: "user-student-001",
    name: "Demo Student",
    email: "student@projectpilot.dev",
    role: "STUDENT",
    status: "ACTIVE",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "user-mentor-001",
    name: "Demo Mentor",
    email: "mentor@projectpilot.dev",
    role: "MENTOR",
    status: "ACTIVE",
    createdAt: "2026-08-15T09:30:00.000Z",
  },
  {
    id: "user-admin-001",
    name: "Demo Admin",
    email: "admin@projectpilot.dev",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2026-08-01T07:00:00.000Z",
  },
  {
    id: "user-student-002",
    name: "Jane Learner",
    email: "jane.learner@projectpilot.dev",
    role: "STUDENT",
    status: "ACTIVE",
    createdAt: "2026-09-05T10:15:00.000Z",
  },
  {
    id: "user-mentor-002",
    name: "Marcus Vance",
    email: "marcus.mentor@projectpilot.dev",
    role: "MENTOR",
    status: "ACTIVE",
    createdAt: "2026-08-20T11:45:00.000Z",
  },
];

export const MOCK_COURSES: Course[] = [
  {
    id: "course-1",
    title: "Full-Stack TypeScript & Next.js Masterclass",
    slug: "fullstack-typescript-nextjs",
    description:
      "Master modern full-stack web engineering with Next.js App Router, React 19, TypeScript, and clean architectural design patterns.",
    status: "PUBLISHED",
    mentorIds: ["user-mentor-001"],
    moduleIds: ["mod-1", "mod-2", "mod-3"],
    level: "INTERMEDIATE",
    estimatedHours: 40,
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-10-15T12:00:00.000Z",
  },
  {
    id: "course-2",
    title: "Advanced PostgreSQL & Database Architecture",
    slug: "advanced-postgresql-database-architecture",
    description:
      "Deep dive into relational modeling, indexing strategies, query execution plans, transactions, and high-throughput data access.",
    status: "PUBLISHED",
    mentorIds: ["user-mentor-002"],
    moduleIds: ["mod-4", "mod-5"],
    level: "ADVANCED",
    estimatedHours: 35,
    createdAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-10-10T14:30:00.000Z",
  },
  {
    id: "course-3",
    title: "Cloud-Native Infrastructure with Docker & Kubernetes",
    slug: "cloud-native-infrastructure-docker-k8s",
    description:
      "Learn containerization, service orchestration, CI/CD pipelines, and zero-downtime production deployments.",
    status: "DRAFT",
    mentorIds: ["user-mentor-001"],
    moduleIds: ["mod-6"],
    level: "ADVANCED",
    estimatedHours: 25,
    createdAt: "2026-10-01T11:00:00.000Z",
    updatedAt: "2026-10-20T16:00:00.000Z",
  },
];

export const MOCK_MODULES: CourseModule[] = [
  {
    id: "mod-1",
    courseId: "course-1",
    title: "Next.js App Router Fundamentals",
    description: "Layouts, templates, server components, and streaming metadata.",
    order: 1,
    contentIds: ["cnt-1", "cnt-2"],
    createdAt: "2026-09-10T10:30:00.000Z",
    updatedAt: "2026-09-10T10:30:00.000Z",
  },
  {
    id: "mod-2",
    courseId: "course-1",
    title: "State Management & React Query",
    description: "Server state cache, optimistic updates, and mutation invalidation.",
    order: 2,
    contentIds: ["cnt-3", "cnt-4"],
    createdAt: "2026-09-10T11:00:00.000Z",
    updatedAt: "2026-09-10T11:00:00.000Z",
  },
  {
    id: "mod-3",
    courseId: "course-1",
    title: "Enterprise Security & RBAC",
    description: "Granular permissions, route protection, and API-ready architecture.",
    order: 3,
    contentIds: ["cnt-5", "cnt-6"],
    createdAt: "2026-09-10T11:30:00.000Z",
    updatedAt: "2026-09-10T11:30:00.000Z",
  },
  {
    id: "mod-4",
    courseId: "course-2",
    title: "PostgreSQL Indexing & Optimization",
    description: "B-Tree, GIN, BRIN, and query plan profiling.",
    order: 1,
    contentIds: ["cnt-7", "cnt-8"],
    createdAt: "2026-09-15T09:30:00.000Z",
    updatedAt: "2026-09-15T09:30:00.000Z",
  },
  {
    id: "mod-5",
    courseId: "course-2",
    title: "Transactions, Locks & Concurrency",
    description: "ACID isolation guarantees, row locks, and deadlock avoidance.",
    order: 2,
    contentIds: ["cnt-9"],
    createdAt: "2026-09-15T10:00:00.000Z",
    updatedAt: "2026-09-15T10:00:00.000Z",
  },
  {
    id: "mod-6",
    courseId: "course-3",
    title: "Containerization with Docker",
    description: "Writing lightweight Dockerfiles and multi-stage container builds.",
    order: 1,
    contentIds: ["cnt-10"],
    createdAt: "2026-10-01T11:30:00.000Z",
    updatedAt: "2026-10-01T11:30:00.000Z",
  },
];

export const MOCK_CONTENT_ITEMS: ContentItem[] = [
  {
    id: "cnt-1",
    moduleId: "mod-1",
    title: "App Router Directory Architecture",
    type: "VIDEO",
    order: 1,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    body: "Comprehensive walkthrough of Route Groups, Parallel Routes, and Intercepting Routes.",
    createdAt: "2026-09-10T12:00:00.000Z",
    updatedAt: "2026-09-10T12:00:00.000Z",
  },
  {
    id: "cnt-2",
    moduleId: "mod-1",
    title: "Server vs Client Components In-Depth",
    type: "TEXT",
    order: 2,
    body: `React Server Components (RSC) represent a mental shift in how React apps are constructed.

### Key Rules:
- Server Components render only on the server, producing no client JavaScript bundle footprint.
- Client Components use the "use client" directive and run on both server (for SSR) and client for hydration.
- Pass data down through props or composition patterns.`,
    createdAt: "2026-09-10T12:30:00.000Z",
    updatedAt: "2026-09-10T12:30:00.000Z",
  },
  {
    id: "cnt-3",
    moduleId: "mod-2",
    title: "TanStack React Query v5 Patterns",
    type: "YOUTUBE_VIDEO",
    order: 1,
    url: "https://www.youtube.com/watch?v=r8Dg0KVF5Mo",
    body: "Video lesson covering query key factories, stale times, and optimistic mutations.",
    createdAt: "2026-09-10T13:00:00.000Z",
    updatedAt: "2026-09-10T13:00:00.000Z",
  },
  {
    id: "cnt-4",
    moduleId: "mod-2",
    title: "Official TanStack Query Reference Guide",
    type: "LINK",
    order: 2,
    url: "https://tanstack.com/query/latest",
    body: "Official documentation and API reference for TanStack Query v5.",
    createdAt: "2026-09-10T13:30:00.000Z",
    updatedAt: "2026-09-10T13:30:00.000Z",
  },
  {
    id: "cnt-5",
    moduleId: "mod-3",
    title: "Role-Based Access Control Principles",
    type: "TEXT",
    order: 1,
    body: `Access control in ProjectPilot is built on three core pillars:
1. **Granular Permissions**: Every action (create course, view submissions) has an explicit permission key.
2. **Centralized Role Mappings**: Roles are assigned collections of permissions.
3. **Resource-Level Scoping**: Mentors only manage courses and submissions assigned to their account.`,
    createdAt: "2026-09-10T14:00:00.000Z",
    updatedAt: "2026-09-10T14:00:00.000Z",
  },
  {
    id: "cnt-6",
    moduleId: "mod-3",
    title: "Hands-on RBAC Implementation Assignment",
    type: "ASSIGNMENT",
    order: 2,
    assignmentId: "asg-1",
    body: "Complete the practical assignment for building granular access control.",
    createdAt: "2026-09-10T14:30:00.000Z",
    updatedAt: "2026-09-10T14:30:00.000Z",
  },
  {
    id: "cnt-7",
    moduleId: "mod-4",
    title: "B-Tree, GIN, and BRIN Index Selection",
    type: "VIDEO",
    order: 1,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    body: "Choosing the correct index type for scalar, full-text, and time-series workloads.",
    createdAt: "2026-09-15T11:00:00.000Z",
    updatedAt: "2026-09-15T11:00:00.000Z",
  },
  {
    id: "cnt-8",
    moduleId: "mod-4",
    title: "Query Plan Optimization Challenge",
    type: "ASSIGNMENT",
    order: 2,
    assignmentId: "asg-2",
    body: "Hands-on assignment to diagnose query bottlenecks and design partial indexes.",
    createdAt: "2026-09-15T11:30:00.000Z",
    updatedAt: "2026-09-15T11:30:00.000Z",
  },
  {
    id: "cnt-9",
    moduleId: "mod-5",
    title: "ACID Isolation Levels & Row-Level Locking",
    type: "TEXT",
    order: 1,
    body: "In-depth guide to Read Committed, Repeatable Read, and Serializable transactions in Postgres.",
    createdAt: "2026-09-15T12:00:00.000Z",
    updatedAt: "2026-09-15T12:00:00.000Z",
  },
  {
    id: "cnt-10",
    moduleId: "mod-6",
    title: "Docker Multi-Stage Build Exercise",
    type: "ASSIGNMENT",
    order: 1,
    assignmentId: "asg-3",
    body: "Draft assignment for containerizing full-stack Node & Next.js applications.",
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
  },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    courseId: "course-1",
    title: "Build a Secure Authentication & RBAC Flow",
    description:
      "Design and implement granular permissions, role assignment checks, and route protection guards.",
    instructions: `1. Implement the permission system with granular capabilities.
2. Build route guards for student, mentor, and admin workspaces.
3. Support resource-level scoping (mentor can only review assigned courses).
4. Provide unit tests validating that unauthorized users cannot perform privileged actions.`,
    status: "PUBLISHED",
    submissionPolicy: "RESUBMITTABLE",
    dueDate: "2026-11-15T23:59:59.000Z",
    maxScore: 100,
    createdById: "user-mentor-001",
    createdAt: "2026-09-12T09:00:00.000Z",
    updatedAt: "2026-09-12T09:00:00.000Z",
  },
  {
    id: "asg-2",
    courseId: "course-2",
    title: "Query Plan Optimization & EXPLAIN ANALYZE",
    description:
      "Analyze slow queries on a large dataset and optimize execution time by 90% using partial indexes.",
    instructions: `1. Review the provided SQL queries experiencing sequential scans.
2. Execute EXPLAIN (ANALYZE, BUFFERS) to inspect page cache hits and query costs.
3. Design targeted compound or partial indexes.
4. Submit your benchmark report and migration script. Note: This assignment allows a single submission attempt only.`,
    status: "PUBLISHED",
    submissionPolicy: "ONE_TIME",
    dueDate: "2026-11-30T23:59:59.000Z",
    maxScore: 100,
    createdById: "user-mentor-002",
    createdAt: "2026-09-18T10:00:00.000Z",
    updatedAt: "2026-09-18T10:00:00.000Z",
  },
  {
    id: "asg-3",
    courseId: "course-3",
    title: "Docker Multi-Stage Build & Compose Setup",
    description:
      "Containerize a Next.js frontend and Node backend with minimal image footprints and multi-arch builds.",
    instructions:
      "Draft assignment specifications for the Cloud-Native Infrastructure course.",
    status: "DRAFT",
    submissionPolicy: "RESUBMITTABLE",
    dueDate: "2026-12-15T23:59:59.000Z",
    maxScore: 100,
    createdById: "user-mentor-001",
    createdAt: "2026-10-02T14:00:00.000Z",
    updatedAt: "2026-10-02T14:00:00.000Z",
  },
];

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    assignmentId: "asg-1",
    studentId: "user-student-001",
    attemptNumber: 1,
    answerText:
      "Initial implementation of the RBAC route guard. Added hasPermission and route pattern matcher.",
    attachmentUrls: ["https://github.com/demo-student/projectpilot-rbac-v1"],
    status: "APPROVED",
    score: 95,
    submittedAt: "2026-10-18T14:30:00.000Z",
    reviewedAt: "2026-10-19T10:15:00.000Z",
    reviewerId: "user-mentor-001",
  },
  {
    id: "sub-2",
    assignmentId: "asg-1",
    studentId: "user-student-001",
    attemptNumber: 2,
    answerText:
      "Resubmission: Added resource-level checks for mentors editing assigned courses and tests.",
    attachmentUrls: ["https://github.com/demo-student/projectpilot-rbac-v2"],
    status: "UNDER_REVIEW",
    submittedAt: "2026-10-21T09:00:00.000Z",
  },
  {
    id: "sub-3",
    assignmentId: "asg-1",
    studentId: "user-student-002",
    attemptNumber: 1,
    answerText:
      "Jane Learner's submission for RBAC. Implemented middleware checks and token verification.",
    attachmentUrls: ["https://github.com/jane-learner/lms-rbac"],
    status: "PENDING",
    submittedAt: "2026-10-22T16:45:00.000Z",
  },
  {
    id: "sub-4",
    assignmentId: "asg-2",
    studentId: "user-student-001",
    attemptNumber: 1,
    answerText:
      "Added composite B-Tree index on (tenant_id, created_at DESC) and eliminated seq scans.",
    attachmentUrls: ["https://github.com/demo-student/postgres-indexing"],
    status: "PENDING",
    submittedAt: "2026-10-23T11:20:00.000Z",
  },
  {
    id: "sub-5",
    assignmentId: "asg-2",
    studentId: "user-student-002",
    attemptNumber: 1,
    answerText:
      "Used covering index with INCLUDE clause to satisfy index-only scans on reporting dashboard.",
    attachmentUrls: ["https://github.com/jane-learner/postgres-indexing"],
    status: "APPROVED",
    score: 98,
    submittedAt: "2026-10-20T13:00:00.000Z",
    reviewedAt: "2026-10-21T15:30:00.000Z",
    reviewerId: "user-mentor-002",
  },
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "rev-1",
    submissionId: "sub-1",
    reviewerId: "user-mentor-001",
    feedback:
      "Excellent job on the permission constants and route matching logic. Very clean modular code!",
    score: 95,
    status: "APPROVED",
    createdAt: "2026-10-19T10:15:00.000Z",
    updatedAt: "2026-10-19T10:15:00.000Z",
  },
  {
    id: "rev-2",
    submissionId: "sub-5",
    reviewerId: "user-mentor-002",
    feedback:
      "Outstanding use of the INCLUDE clause for index-only scans. Benchmark results show great performance.",
    score: 98,
    status: "APPROVED",
    createdAt: "2026-10-21T15:30:00.000Z",
    updatedAt: "2026-10-21T15:30:00.000Z",
  },
];
