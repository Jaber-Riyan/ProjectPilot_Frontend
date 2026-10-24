import type {
  User,
  Course,
  CourseModule,
  ContentItem,
  Assignment,
  Submission,
  Review,
} from "@/types/domain";
import type { PaginatedResult, PaginationParams } from "@/types/common";

export interface ICourseRepository {
  list(params?: PaginationParams): Promise<PaginatedResult<Course>>;
  getById(id: string): Promise<Course | null>;
  create(input: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course>;
  update(id: string, updates: Partial<Omit<Course, "id" | "createdAt">>): Promise<Course>;
  delete(id: string): Promise<boolean>;
}

export interface IModuleRepository {
  list(courseId?: string): Promise<CourseModule[]>;
  getById(id: string): Promise<CourseModule | null>;
  create(input: Omit<CourseModule, "id" | "createdAt" | "updatedAt">): Promise<CourseModule>;
  update(id: string, updates: Partial<Omit<CourseModule, "id" | "createdAt">>): Promise<CourseModule>;
  delete(id: string): Promise<boolean>;
}

export interface IContentRepository {
  list(moduleId?: string): Promise<ContentItem[]>;
  getById(id: string): Promise<ContentItem | null>;
  create(input: Omit<ContentItem, "id" | "createdAt" | "updatedAt">): Promise<ContentItem>;
  update(id: string, updates: Partial<Omit<ContentItem, "id" | "createdAt">>): Promise<ContentItem>;
  delete(id: string): Promise<boolean>;
}

export interface IAssignmentRepository {
  list(params?: PaginationParams & { courseId?: string }): Promise<PaginatedResult<Assignment>>;
  getById(id: string): Promise<Assignment | null>;
  create(input: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<Assignment>;
  update(id: string, updates: Partial<Omit<Assignment, "id" | "createdAt">>): Promise<Assignment>;
  delete(id: string): Promise<boolean>;
}

export interface ISubmissionRepository {
  list(params?: PaginationParams & { assignmentId?: string; studentId?: string }): Promise<PaginatedResult<Submission>>;
  getById(id: string): Promise<Submission | null>;
  create(input: Omit<Submission, "id" | "submittedAt">): Promise<Submission>;
  update(id: string, updates: Partial<Omit<Submission, "id">>): Promise<Submission>;
  listAttempts(assignmentId: string, studentId: string): Promise<Submission[]>;
}

export interface IReviewRepository {
  list(params?: PaginationParams & { submissionId?: string; reviewerId?: string }): Promise<PaginatedResult<Review>>;
  getById(id: string): Promise<Review | null>;
  getBySubmissionId(submissionId: string): Promise<Review | null>;
  create(input: Omit<Review, "id" | "createdAt" | "updatedAt">): Promise<Review>;
  update(id: string, updates: Partial<Omit<Review, "id" | "createdAt">>): Promise<Review>;
}

export interface IUserRepository {
  list(params?: PaginationParams & { role?: string }): Promise<PaginatedResult<User>>;
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  update(id: string, updates: Partial<User>): Promise<User>;
}
