import type { UserRole, CurrentUser } from "./auth";
import type { PaginationMeta } from "./common";

export type { UserRole, CurrentUser, PaginationMeta };

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  avatarUrl?: string;
  createdAt: string;
}

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CourseModuleAssociation {
  id: string;
  courseId: string;
  moduleId: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
  module?: {
    id: string;
    title: string;
    description?: string | null;
    isPublished?: boolean;
    createdById?: string;
    createdAt?: string;
    updatedAt?: string;
    contentItems?: ContentItem[];
  };
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: CourseStatus;
  isPublished?: boolean;
  imageUrl?: string | null;
  createdById?: string;
  mentorIds: string[];
  moduleIds: string[];
  modulesCount?: number;
  _count?: {
    modules?: number;
    courseModules?: number;
  };
  courseModules?: CourseModuleAssociation[];
  modules?: unknown[];
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  contentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ContentType =
  | "VIDEO"
  | "YOUTUBE_VIDEO"
  | "TEXT"
  | "LINK"
  | "ASSIGNMENT";

export interface ContentItem {
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

export type SubmissionPolicy = "ONE_TIME" | "RESUBMITTABLE";

export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface Assignment {
  id: string;
  courseId?: string;
  title: string;
  description: string;
  instructions: string;
  status: AssignmentStatus;
  submissionPolicy: SubmissionPolicy;
  dueDate?: string;
  maxScore?: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUESTED";

export interface Submission {
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

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  feedback: string;
  score?: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}
