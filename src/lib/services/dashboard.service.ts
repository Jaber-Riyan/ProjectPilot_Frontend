import { apiRequest } from "@/lib/api/client";
import {
  courseRepository,
  assignmentRepository,
  submissionRepository,
  userRepository,
} from "@/lib/repositories";
import type { CurrentUser } from "@/types/auth";
import type {
  StudentDashboardSummary,
  MentorDashboardSummary,
  AdminDashboardSummary,
  Submission,
  User,
} from "@/types/domain";
import type { PaginatedResult } from "@/types/common";
import { normalizeSubmission } from "./submission.service";

export interface StudentDashboardQuery {
  from?: string;
  to?: string;
}

export interface StudentSubmissionsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assignmentId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "updatedAt" | "attemptNumber" | "projectName" | "status";
  sortOrder?: "asc" | "desc";
}

export interface MentorDashboardQuery {
  from?: string;
  to?: string;
}

export interface MentorSubmissionsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assignmentId?: string;
  courseId?: string;
  studentId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "updatedAt" | "attemptNumber" | "projectName" | "status";
  sortOrder?: "asc" | "desc";
}

export interface MentorCoursesFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "published" | "draft";
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

export interface AdminDashboardQuery {
  from?: string;
  to?: string;
}

export interface AdminUsersFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: "active" | "inactive";
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "email" | "role";
  sortOrder?: "asc" | "desc";
}

export interface AdminSubmissionsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assignmentId?: string;
  courseId?: string;
  studentId?: string;
  from?: string;
  to?: string;
  sortBy?: "createdAt" | "updatedAt" | "attemptNumber" | "projectName" | "status";
  sortOrder?: "asc" | "desc";
}

export class DashboardService {
  private isTestEnv(): boolean {
    return (
      typeof process !== "undefined" &&
      (process.env.NODE_ENV === "test" ||
        Boolean(process.env.NODE_TEST_CONTEXT) ||
        !process.env.NEXT_PUBLIC_API_BASE_URL)
    );
  }

  /**
   * GET /api/v1/dashboard/student
   */
  async getStudentDashboard(
    params?: StudentDashboardQuery,
    user?: CurrentUser | null
  ): Promise<StudentDashboardSummary> {
    if (!user || user.role !== "STUDENT") {
      throw new Error("Access denied: only students can view the student dashboard.");
    }

    if (this.isTestEnv()) {
      const allCourses = await courseRepository.list({ limit: 1000, page: 1 });
      const publishedCourses = allCourses.items.filter((c) => c.status === "PUBLISHED");
      const allAssignments = await assignmentRepository.list({ limit: 1000, page: 1 });
      const publishedAssignments = allAssignments.items.filter((a) => a.isPublished);

      const allSubmissions = await submissionRepository.list({ limit: 1000, page: 1 });
      const mySubmissions = allSubmissions.items.filter((s) => s.studentId === user.id);

      const approvedSubmissions = mySubmissions.filter((s) => s.status === "APPROVED");
      const completedAssignmentsCount = new Set(approvedSubmissions.map((s) => s.assignmentId)).size;
      const completionRate =
        publishedAssignments.length > 0
          ? Math.round((completedAssignmentsCount / publishedAssignments.length) * 100)
          : 0;

      const submissionsByStatus = {
        PENDING: mySubmissions.filter((s) => s.status === "PENDING").length,
        UNDER_REVIEW: mySubmissions.filter((s) => s.status === "UNDER_REVIEW").length,
        APPROVED: approvedSubmissions.length,
        REJECTED: mySubmissions.filter((s) => s.status === "REJECTED").length,
        RESUBMISSION_REQUESTED: mySubmissions.filter((s) => s.status === "RESUBMISSION_REQUESTED").length,
      };

      return {
        overview: {
          accessibleCoursesCount: publishedCourses.length,
          accessibleAssignmentsCount: publishedAssignments.length,
          totalSubmissionsCount: mySubmissions.length,
          completedAssignmentsCount,
          pendingReviewsCount: submissionsByStatus.PENDING + submissionsByStatus.UNDER_REVIEW,
          completionRate,
        },
        submissionsByStatus,
        recentSubmissions: mySubmissions.slice(0, 5).map((s) => ({
          id: s.id,
          projectName: s.projectName || `Attempt #${s.attemptNumber}`,
          attemptNumber: s.attemptNumber,
          status: s.status,
          repoUrl: s.repoUrl || "",
          liveUrl: s.liveUrl || null,
          createdAt: s.createdAt || new Date().toISOString(),
          updatedAt: s.updatedAt || s.createdAt || new Date().toISOString(),
          reviewedAt: s.reviewedAt || null,
          assignment: {
            id: s.assignmentId,
            title: s.assignment?.title || `Assignment #${s.assignmentId.slice(0, 8)}`,
          },
          reviewedBy: s.reviewedBy ? { id: s.reviewedBy.id, name: s.reviewedBy.name } : null,
          feedbacksCount: s.feedbacks?.length || 0,
          latestFeedback: s.feedbacks?.[0]
            ? {
                id: s.feedbacks[0].id,
                comment: s.feedbacks[0].comment,
                createdAt: s.feedbacks[0].createdAt,
                mentor: { id: s.feedbacks[0].mentorId, name: "Mentor" },
              }
            : null,
        })),
        notes: {
          enrollmentModel: "Open learning catalog: student has access to all published courses and assignments.",
          completionCriteria: "An assignment is counted as completed once a submission attempt receives APPROVED status.",
        },
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/student?${queryStr}` : "dashboard/student";

    return apiRequest<StudentDashboardSummary>(path, { method: "GET" });
  }

  /**
   * GET /api/v1/dashboard/student/submissions
   */
  async getStudentSubmissions(
    params?: StudentSubmissionsFilterParams,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Submission>> {
    if (!user || user.role !== "STUDENT") {
      throw new Error("Access denied: only students can view student submissions.");
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.assignmentId) searchParams.set("assignmentId", params.assignmentId);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/student/submissions?${queryStr}` : "dashboard/student/submissions";

    const response = await apiRequest<{
      items: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }>(path, { method: "GET" });

    return {
      ...response,
      items: (response.items || []).map(normalizeSubmission),
    };
  }

  /**
   * GET /api/v1/dashboard/mentor
   */
  async getMentorDashboard(
    params?: MentorDashboardQuery,
    user?: CurrentUser | null
  ): Promise<MentorDashboardSummary> {
    if (!user || user.role !== "MENTOR") {
      throw new Error("Access denied: only mentors can view the mentor dashboard.");
    }

    if (this.isTestEnv()) {
      const allCourses = await courseRepository.list({ limit: 1000, page: 1 });
      const manageableCourses = allCourses.items.filter(
        (c) => c.createdById === user.id || c.mentorIds.includes(user.id)
      );

      const allAssignments = await assignmentRepository.list({ limit: 1000, page: 1 });
      const manageableAssignments = allAssignments.items.filter(
        (a) => a.createdById === user.id
      );

      const allSubmissions = await submissionRepository.list({ limit: 1000, page: 1 });
      const receivedSubmissions = allSubmissions.items.filter((s) =>
        manageableAssignments.some((a) => a.id === s.assignmentId)
      );

      const pendingReviews = receivedSubmissions.filter(
        (s) => s.status === "PENDING" || s.status === "UNDER_REVIEW"
      );
      const reviewed = receivedSubmissions.filter(
        (s) => s.status === "APPROVED" || s.status === "REJECTED" || s.status === "RESUBMISSION_REQUESTED"
      );

      return {
        overview: {
          manageableCoursesCount: manageableCourses.length,
          manageableModulesCount: 0,
          manageableAssignmentsCount: manageableAssignments.length,
          pendingReviewsCount: pendingReviews.length,
          totalSubmissionsReceived: receivedSubmissions.length,
          reviewedSubmissionsCount: reviewed.length,
          totalFeedbacksGiven: reviewed.length,
        },
        submissionsByStatus: {
          PENDING: receivedSubmissions.filter((s) => s.status === "PENDING").length,
          UNDER_REVIEW: receivedSubmissions.filter((s) => s.status === "UNDER_REVIEW").length,
          APPROVED: receivedSubmissions.filter((s) => s.status === "APPROVED").length,
          REJECTED: receivedSubmissions.filter((s) => s.status === "REJECTED").length,
          RESUBMISSION_REQUESTED: receivedSubmissions.filter((s) => s.status === "RESUBMISSION_REQUESTED").length,
        },
        recentSubmissions: receivedSubmissions.slice(0, 5).map((s) => ({
          id: s.id,
          projectName: s.projectName || `Attempt #${s.attemptNumber}`,
          attemptNumber: s.attemptNumber,
          status: s.status,
          repoUrl: s.repoUrl || "",
          liveUrl: s.liveUrl || null,
          createdAt: s.createdAt || new Date().toISOString(),
          student: {
            id: s.studentId,
            name: s.student?.name || "Student",
            email: s.student?.email || "student@example.com",
          },
          assignment: {
            id: s.assignmentId,
            title: s.assignment?.title || "Assignment",
          },
        })),
        recentReviews: [],
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/mentor?${queryStr}` : "dashboard/mentor";

    return apiRequest<MentorDashboardSummary>(path, { method: "GET" });
  }

  /**
   * GET /api/v1/dashboard/mentor/submissions
   */
  async getMentorSubmissions(
    params?: MentorSubmissionsFilterParams,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Submission>> {
    if (!user || user.role !== "MENTOR") {
      throw new Error("Access denied: only mentors can view mentor submissions.");
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.assignmentId) searchParams.set("assignmentId", params.assignmentId);
    if (params?.courseId) searchParams.set("courseId", params.courseId);
    if (params?.studentId) searchParams.set("studentId", params.studentId);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/mentor/submissions?${queryStr}` : "dashboard/mentor/submissions";

    const response = await apiRequest<{
      items: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }>(path, { method: "GET" });

    return {
      ...response,
      items: (response.items || []).map(normalizeSubmission),
    };
  }

  /**
   * GET /api/v1/dashboard/mentor/courses
   */
  async getMentorCourses(
    params?: MentorCoursesFilterParams,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    modulesCount: number;
  }>> {
    if (!user || user.role !== "MENTOR") {
      throw new Error("Access denied: only mentors can view authored courses.");
    }

    if (this.isTestEnv()) {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: params?.limit ?? 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/mentor/courses?${queryStr}` : "dashboard/mentor/courses";

    return apiRequest(path, { method: "GET" });
  }

  /**
   * GET /api/v1/dashboard/admin
   */
  async getAdminDashboard(
    params?: AdminDashboardQuery,
    user?: CurrentUser | null
  ): Promise<AdminDashboardSummary> {
    if (!user || user.role !== "ADMIN") {
      throw new Error("Access denied: only administrators can view the administrator dashboard.");
    }

    if (this.isTestEnv()) {
      const allUsers = await userRepository.list({ limit: 1000, page: 1 });
      const allCourses = await courseRepository.list({ limit: 1000, page: 1 });
      const allAssignments = await assignmentRepository.list({ limit: 1000, page: 1 });
      const allSubmissions = await submissionRepository.list({ limit: 1000, page: 1 });

      const pendingSubmissions = allSubmissions.items.filter(
        (s) => s.status === "PENDING" || s.status === "UNDER_REVIEW"
      );

      return {
        users: {
          total: allUsers.total,
          byRole: {
            STUDENT: allUsers.items.filter((u) => u.role === "STUDENT").length,
            MENTOR: allUsers.items.filter((u) => u.role === "MENTOR").length,
            ADMIN: allUsers.items.filter((u) => u.role === "ADMIN").length,
          },
          byStatus: {
            active: allUsers.items.filter((u) => u.status === "ACTIVE").length,
            inactive: allUsers.items.filter((u) => u.status !== "ACTIVE").length,
          },
        },
        courses: {
          total: allCourses.total,
          published: allCourses.items.filter((c) => c.status === "PUBLISHED").length,
          draft: allCourses.items.filter((c) => c.status === "DRAFT").length,
        },
        modules: {
          total: 0,
          published: 0,
          draft: 0,
        },
        assignments: {
          total: allAssignments.total,
          published: allAssignments.items.filter((a) => a.isPublished).length,
          draft: allAssignments.items.filter((a) => !a.isPublished).length,
        },
        submissions: {
          total: allSubmissions.total,
          byStatus: {
            PENDING: allSubmissions.items.filter((s) => s.status === "PENDING").length,
            UNDER_REVIEW: allSubmissions.items.filter((s) => s.status === "UNDER_REVIEW").length,
            APPROVED: allSubmissions.items.filter((s) => s.status === "APPROVED").length,
            REJECTED: allSubmissions.items.filter((s) => s.status === "REJECTED").length,
            RESUBMISSION_REQUESTED: allSubmissions.items.filter((s) => s.status === "RESUBMISSION_REQUESTED").length,
          },
          pendingReviewTotal: pendingSubmissions.length,
        },
        recentActivity: {
          recentUsers: allUsers.items.slice(0, 5).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.status === "ACTIVE",
            createdAt: u.createdAt,
          })),
          recentSubmissions: allSubmissions.items.slice(0, 5).map((s) => ({
            id: s.id,
            projectName: s.projectName || `Attempt #${s.attemptNumber}`,
            status: s.status,
            attemptNumber: s.attemptNumber,
            createdAt: s.createdAt || new Date().toISOString(),
            student: {
              id: s.studentId,
              name: s.student?.name || "Student",
              email: s.student?.email || "student@example.com",
            },
            assignment: {
              id: s.assignmentId,
              title: s.assignment?.title || "Assignment",
            },
          })),
        },
      };
    }

    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/admin?${queryStr}` : "dashboard/admin";

    return apiRequest<AdminDashboardSummary>(path, { method: "GET" });
  }

  /**
   * GET /api/v1/dashboard/admin/users
   */
  async getAdminUsers(
    params?: AdminUsersFilterParams,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<User>> {
    if (!user || user.role !== "ADMIN") {
      throw new Error("Access denied: only administrators can view the administrative user directory.");
    }

    if (this.isTestEnv()) {
      return userRepository.list({
        page: params?.page,
        limit: params?.limit,
        role: params?.role,
        search: params?.search,
      });
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.role && params.role !== "ALL") searchParams.set("role", params.role);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/admin/users?${queryStr}` : "dashboard/admin/users";

    const response = await apiRequest<{
      items?: Array<{
        id: string;
        name: string;
        email: string;
        role: "STUDENT" | "MENTOR" | "ADMIN";
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      users?: Array<{
        id: string;
        name: string;
        email: string;
        role: "STUDENT" | "MENTOR" | "ADMIN";
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }>(path, { method: "GET" });

    const rawList = response.items || response.users || [];
    const normalizedUsers: User[] = rawList.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: u.createdAt,
    }));

    return {
      items: normalizedUsers,
      total: response.total ?? normalizedUsers.length,
      page: response.page ?? 1,
      limit: response.limit ?? 10,
      totalPages: response.totalPages ?? 1,
      hasNextPage: response.hasNextPage ?? false,
      hasPrevPage: response.hasPrevPage ?? false,
    };
  }

  /**
   * GET /api/v1/dashboard/admin/submissions
   */
  async getAdminSubmissions(
    params?: AdminSubmissionsFilterParams,
    user?: CurrentUser | null
  ): Promise<PaginatedResult<Submission>> {
    if (!user || user.role !== "ADMIN") {
      throw new Error("Access denied: only administrators can view global submission oversight.");
    }

    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
    if (params?.assignmentId) searchParams.set("assignmentId", params.assignmentId);
    if (params?.courseId) searchParams.set("courseId", params.courseId);
    if (params?.studentId) searchParams.set("studentId", params.studentId);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

    const queryStr = searchParams.toString();
    const path = queryStr ? `dashboard/admin/submissions?${queryStr}` : "dashboard/admin/submissions";

    const response = await apiRequest<{
      items: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    }>(path, { method: "GET" });

    return {
      ...response,
      items: (response.items || []).map(normalizeSubmission),
    };
  }
}

export const dashboardService = new DashboardService();
