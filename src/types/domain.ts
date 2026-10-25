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
  courseId?: string;
  title: string;
  description?: string | null;
  isPublished?: boolean;
  order: number;
  contentIds: string[];
  courseModuleId?: string;
  createdById?: string | null;
  contentItems?: ContentItem[];
  _count?: {
    contentItems: number;
    courseModules: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDetailWithContent extends CourseModule {
  contentItems: ContentItem[];
  courseModules?: CourseModuleAssociation[];
}

export interface ModuleWithCount {
  id: string;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    contentItems: number;
    courseModules: number;
  };
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
  description?: string | null;
  body?: string | null;
  url?: string | null;
  assignmentId?: string | null;
  assignment?: {
    id: string;
    title: string;
    isPublished: boolean;
  } | null;
  module?: {
    id: string;
    title: string;
    isPublished: boolean;
    courseModules?: unknown[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AttachOrAddModuleInput {
  moduleId?: string;
  title?: string;
  description?: string | null;
  isPublished?: boolean;
  order?: number;
}

export interface CreateModuleInput {
  title: string;
  description?: string | null;
  isPublished?: boolean;
}

export interface UpdateModuleInput {
  title?: string;
  description?: string | null;
  isPublished?: boolean;
}

export interface ReorderModulesInput {
  moduleIds: string[];
}

export interface CreateContentItemInput {
  title: string;
  type: ContentType;
  description?: string | null;
  body?: string | null;
  url?: string | null;
  assignmentId?: string | null;
  order?: number;
}

export interface UpdateContentItemInput {
  title?: string;
  type?: ContentType;
  description?: string | null;
  body?: string | null;
  url?: string | null;
  assignmentId?: string | null;
}

export interface ReorderContentItemsInput {
  contentItemIds: string[];
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
  isPublished?: boolean;
  submissionPolicy: SubmissionPolicy;
  dueDate?: string | null;
  dueAt?: string | null;
  maxScore?: number;
  createdById?: string | null;
  createdBy?: { id: string; email: string; name: string } | null;
  contentItems?: Array<{ id: string; title: string; moduleId: string; order: number }>;
  _count?: { submissions: number; contentItems: number };
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUESTED";

export interface SubmissionFeedback {
  id: string;
  submissionId: string;
  mentorId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  mentor?: {
    id: string;
    name: string;
    email?: string;
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  projectName?: string;
  repoUrl?: string;
  liveUrl?: string | null;
  description?: string | null;
  answerText?: string;
  attachmentUrls?: string[];
  status: SubmissionStatus;
  score?: number;
  reviewedById?: string | null;
  reviewerId?: string;
  reviewedAt?: string | null;
  submittedAt: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    email: string;
    name: string;
  };
  assignment?: {
    id: string;
    title: string;
    instructions?: string;
    submissionPolicy: SubmissionPolicy;
    createdById?: string | null;
  };
  reviewedBy?: {
    id: string;
    email?: string;
    name: string;
  } | null;
  feedbacks?: SubmissionFeedback[];
  _count?: {
    feedbacks: number;
  };
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

export interface ReviewQueueFilters {
  page?: number;
  limit?: number;
  status?: SubmissionStatus;
  assignmentId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
}

export interface SubmissionStatusCounts {
  PENDING: number;
  UNDER_REVIEW: number;
  APPROVED: number;
  REJECTED: number;
  RESUBMISSION_REQUESTED: number;
}

export interface StudentDashboardSummary {
  overview: {
    accessibleCoursesCount: number;
    accessibleAssignmentsCount: number;
    totalSubmissionsCount: number;
    completedAssignmentsCount: number;
    pendingReviewsCount: number;
    completionRate: number;
  };
  submissionsByStatus: SubmissionStatusCounts;
  recentSubmissions: Array<{
    id: string;
    projectName: string;
    attemptNumber: number;
    status: SubmissionStatus;
    repoUrl: string;
    liveUrl: string | null;
    createdAt: string;
    updatedAt: string;
    reviewedAt: string | null;
    assignment: {
      id: string;
      title: string;
    };
    reviewedBy: {
      id: string;
      name: string;
    } | null;
    feedbacksCount: number;
    latestFeedback: {
      id: string;
      comment: string;
      createdAt: string;
      mentor: {
        id: string;
        name: string;
      };
    } | null;
  }>;
  notes: {
    enrollmentModel: string;
    completionCriteria: string;
  };
}

export interface MentorDashboardSummary {
  overview: {
    manageableCoursesCount: number;
    manageableModulesCount: number;
    manageableAssignmentsCount: number;
    pendingReviewsCount: number;
    totalSubmissionsReceived: number;
    reviewedSubmissionsCount: number;
    totalFeedbacksGiven: number;
  };
  submissionsByStatus: SubmissionStatusCounts;
  recentSubmissions: Array<{
    id: string;
    projectName: string;
    attemptNumber: number;
    status: SubmissionStatus;
    repoUrl: string;
    liveUrl: string | null;
    createdAt: string;
    student: {
      id: string;
      name: string;
      email: string;
    };
    assignment: {
      id: string;
      title: string;
    };
  }>;
  recentReviews: Array<{
    id: string;
    comment: string;
    createdAt: string;
    submission: {
      id: string;
      projectName: string;
      status: SubmissionStatus;
      attemptNumber: number;
      student: {
        id: string;
        name: string;
        email: string;
      };
      assignment: {
        id: string;
        title: string;
      };
    };
  }>;
}

export interface AdminDashboardSummary {
  users: {
    total: number;
    byRole: {
      STUDENT: number;
      MENTOR: number;
      ADMIN: number;
    };
    byStatus: {
      active: number;
      inactive: number;
    };
  };
  courses: {
    total: number;
    published: number;
    draft: number;
  };
  modules: {
    total: number;
    published: number;
    draft: number;
  };
  assignments: {
    total: number;
    published: number;
    draft: number;
  };
  submissions: {
    total: number;
    byStatus: SubmissionStatusCounts;
    pendingReviewTotal: number;
  };
  recentActivity: {
    recentUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: UserRole;
      isActive: boolean;
      createdAt: string;
    }>;
    recentSubmissions: Array<{
      id: string;
      projectName: string;
      status: SubmissionStatus;
      attemptNumber: number;
      createdAt: string;
      student: {
        id: string;
        name: string;
        email: string;
      };
      assignment: {
        id: string;
        title: string;
      };
    }>;
  };
}

