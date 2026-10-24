import type {
  User,
  Course,
  CourseModule,
  ContentItem,
  Assignment,
  Submission,
  Review,
} from "@/types/domain";
import { APP_CONFIG } from "@/config/app-config";
import {
  MOCK_USERS,
  MOCK_COURSES,
  MOCK_MODULES,
  MOCK_CONTENT_ITEMS,
  MOCK_ASSIGNMENTS,
  MOCK_SUBMISSIONS,
  MOCK_REVIEWS,
} from "./fixtures";

export interface MockDatabaseState {
  users: User[];
  courses: Course[];
  modules: CourseModule[];
  content: ContentItem[];
  assignments: Assignment[];
  submissions: Submission[];
  reviews: Review[];
}

function getInitialState(): MockDatabaseState {
  return {
    users: JSON.parse(JSON.stringify(MOCK_USERS)),
    courses: JSON.parse(JSON.stringify(MOCK_COURSES)),
    modules: JSON.parse(JSON.stringify(MOCK_MODULES)),
    content: JSON.parse(JSON.stringify(MOCK_CONTENT_ITEMS)),
    assignments: JSON.parse(JSON.stringify(MOCK_ASSIGNMENTS)),
    submissions: JSON.parse(JSON.stringify(MOCK_SUBMISSIONS)),
    reviews: JSON.parse(JSON.stringify(MOCK_REVIEWS)),
  };
}

class MockStore {
  private state: MockDatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private isClient(): boolean {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  }

  private loadState(): MockDatabaseState {
    if (this.isClient()) {
      try {
        const serialized = window.localStorage.getItem(APP_CONFIG.storageKeys.mockDatabaseState);
        if (serialized) {
          const parsed = JSON.parse(serialized);
          if (parsed && Array.isArray(parsed.courses)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn("Failed to load mock database from localStorage, resetting to defaults", err);
      }
    }
    return getInitialState();
  }

  private saveState() {
    if (this.isClient()) {
      try {
        window.localStorage.setItem(
          APP_CONFIG.storageKeys.mockDatabaseState,
          JSON.stringify(this.state)
        );
      } catch (err) {
        console.warn("Failed to save mock state to localStorage", err);
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in mock store subscriber", err);
      }
    });
  }

  public resetToDefaults(): void {
    this.state = getInitialState();
    this.saveState();
  }

  public async delay(ms: number = APP_CONFIG.mockLatencyMs): Promise<void> {
    if (ms <= 0) return;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- Users ---
  public getUsers(): User[] {
    return [...this.state.users];
  }

  public getUserById(id: string): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const index = this.state.users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`User with id "${id}" not found`);
    const updated = { ...this.state.users[index], ...updates };
    this.state.users[index] = updated;
    this.saveState();
    return updated;
  }

  // --- Courses ---
  public getCourses(): Course[] {
    return [...this.state.courses];
  }

  public getCourseById(id: string): Course | undefined {
    return this.state.courses.find((c) => c.id === id || c.slug === id);
  }

  public createCourse(input: Omit<Course, "id" | "createdAt" | "updatedAt">): Course {
    const id = `course-${Date.now()}`;
    const now = new Date().toISOString();
    const newCourse: Course = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.courses.push(newCourse);
    this.saveState();
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<Omit<Course, "id" | "createdAt">>): Course {
    const index = this.state.courses.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Course with id "${id}" not found`);
    const now = new Date().toISOString();
    const updated: Course = {
      ...this.state.courses[index],
      ...updates,
      updatedAt: now,
    };
    this.state.courses[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteCourse(id: string): boolean {
    const index = this.state.courses.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.state.courses.splice(index, 1);
    // Cascade cleanup: remove modules belonging to this course
    const modulesToDelete = this.state.modules.filter((m) => m.courseId === id).map((m) => m.id);
    this.state.modules = this.state.modules.filter((m) => m.courseId !== id);
    this.state.content = this.state.content.filter((c) => !modulesToDelete.includes(c.moduleId));
    this.saveState();
    return true;
  }

  // --- Modules ---
  public getModules(courseId?: string): CourseModule[] {
    if (!courseId) return [...this.state.modules];
    return this.state.modules
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  public getModuleById(id: string): CourseModule | undefined {
    return this.state.modules.find((m) => m.id === id);
  }

  public createModule(input: Omit<CourseModule, "id" | "createdAt" | "updatedAt">): CourseModule {
    const id = `mod-${Date.now()}`;
    const now = new Date().toISOString();
    const newModule: CourseModule = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.modules.push(newModule);

    // Also link in course.moduleIds
    const course = this.state.courses.find((c) => c.id === input.courseId);
    if (course && !course.moduleIds.includes(id)) {
      course.moduleIds.push(id);
    }

    this.saveState();
    return newModule;
  }

  public updateModule(id: string, updates: Partial<Omit<CourseModule, "id" | "createdAt">>): CourseModule {
    const index = this.state.modules.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Module with id "${id}" not found`);
    const now = new Date().toISOString();
    const updated: CourseModule = {
      ...this.state.modules[index],
      ...updates,
      updatedAt: now,
    };
    this.state.modules[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteModule(id: string): boolean {
    const index = this.state.modules.findIndex((m) => m.id === id);
    if (index === -1) return false;
    const [deleted] = this.state.modules.splice(index, 1);
    // Remove content
    this.state.content = this.state.content.filter((c) => c.moduleId !== id);
    // Remove from course
    const course = this.state.courses.find((c) => c.id === deleted.courseId);
    if (course) {
      course.moduleIds = course.moduleIds.filter((mid) => mid !== id);
    }
    this.saveState();
    return true;
  }

  // --- Content ---
  public getContentItems(moduleId?: string): ContentItem[] {
    if (!moduleId) return [...this.state.content];
    return this.state.content
      .filter((c) => c.moduleId === moduleId)
      .sort((a, b) => a.order - b.order);
  }

  public getContentById(id: string): ContentItem | undefined {
    return this.state.content.find((c) => c.id === id);
  }

  public createContentItem(input: Omit<ContentItem, "id" | "createdAt" | "updatedAt">): ContentItem {
    const id = `cnt-${Date.now()}`;
    const now = new Date().toISOString();
    const newItem: ContentItem = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.content.push(newItem);

    // Also link in module.contentIds
    const mod = this.state.modules.find((m) => m.id === input.moduleId);
    if (mod && !mod.contentIds.includes(id)) {
      mod.contentIds.push(id);
    }

    this.saveState();
    return newItem;
  }

  public updateContentItem(id: string, updates: Partial<Omit<ContentItem, "id" | "createdAt">>): ContentItem {
    const index = this.state.content.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Content item with id "${id}" not found`);
    const now = new Date().toISOString();
    const updated: ContentItem = {
      ...this.state.content[index],
      ...updates,
      updatedAt: now,
    };
    this.state.content[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteContentItem(id: string): boolean {
    const index = this.state.content.findIndex((c) => c.id === id);
    if (index === -1) return false;
    const [deleted] = this.state.content.splice(index, 1);
    const mod = this.state.modules.find((m) => m.id === deleted.moduleId);
    if (mod) {
      mod.contentIds = mod.contentIds.filter((cid) => cid !== id);
    }
    this.saveState();
    return true;
  }

  // --- Assignments ---
  public getAssignments(courseId?: string): Assignment[] {
    if (!courseId) return [...this.state.assignments];
    return this.state.assignments.filter((a) => a.courseId === courseId);
  }

  public getAssignmentById(id: string): Assignment | undefined {
    return this.state.assignments.find((a) => a.id === id);
  }

  public createAssignment(input: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Assignment {
    const id = `asg-${Date.now()}`;
    const now = new Date().toISOString();
    const newAsg: Assignment = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.assignments.push(newAsg);
    this.saveState();
    return newAsg;
  }

  public updateAssignment(id: string, updates: Partial<Omit<Assignment, "id" | "createdAt">>): Assignment {
    const index = this.state.assignments.findIndex((a) => a.id === id);
    if (index === -1) throw new Error(`Assignment with id "${id}" not found`);
    const now = new Date().toISOString();
    const updated: Assignment = {
      ...this.state.assignments[index],
      ...updates,
      updatedAt: now,
    };
    this.state.assignments[index] = updated;
    this.saveState();
    return updated;
  }

  public deleteAssignment(id: string): boolean {
    const index = this.state.assignments.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.state.assignments.splice(index, 1);
    this.saveState();
    return true;
  }

  // --- Submissions ---
  public getSubmissions(): Submission[] {
    return [...this.state.submissions];
  }

  public getSubmissionById(id: string): Submission | undefined {
    return this.state.submissions.find((s) => s.id === id);
  }

  public createSubmission(input: Omit<Submission, "id" | "submittedAt">): Submission {
    const id = `sub-${Date.now()}`;
    const now = new Date().toISOString();
    const newSubmission: Submission = {
      ...input,
      id,
      submittedAt: now,
    };
    this.state.submissions.push(newSubmission);
    this.saveState();
    return newSubmission;
  }

  public updateSubmission(id: string, updates: Partial<Omit<Submission, "id">>): Submission {
    const index = this.state.submissions.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Submission with id "${id}" not found`);
    const updated: Submission = {
      ...this.state.submissions[index],
      ...updates,
    };
    this.state.submissions[index] = updated;
    this.saveState();
    return updated;
  }

  // --- Reviews ---
  public getReviews(submissionId?: string): Review[] {
    if (!submissionId) return [...this.state.reviews];
    return this.state.reviews.filter((r) => r.submissionId === submissionId);
  }

  public getReviewById(id: string): Review | undefined {
    return this.state.reviews.find((r) => r.id === id);
  }

  public createReview(input: Omit<Review, "id" | "createdAt" | "updatedAt">): Review {
    const id = `rev-${Date.now()}`;
    const now = new Date().toISOString();
    const newReview: Review = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.reviews.push(newReview);

    // Update the corresponding submission status
    const submission = this.state.submissions.find((s) => s.id === input.submissionId);
    if (submission) {
      submission.status = input.status;
      submission.reviewedAt = now;
      submission.reviewerId = input.reviewerId;
      if (input.score !== undefined) {
        submission.score = input.score;
      }
    }

    this.saveState();
    return newReview;
  }

  public updateReview(id: string, updates: Partial<Omit<Review, "id" | "createdAt">>): Review {
    const index = this.state.reviews.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Review with id "${id}" not found`);
    const now = new Date().toISOString();
    const updated: Review = {
      ...this.state.reviews[index],
      ...updates,
      updatedAt: now,
    };
    this.state.reviews[index] = updated;

    // Update submission status if review status changed
    if (updates.status) {
      const submission = this.state.submissions.find((s) => s.id === updated.submissionId);
      if (submission) {
        submission.status = updates.status;
        if (updates.score !== undefined) {
          submission.score = updates.score;
        }
      }
    }

    this.saveState();
    return updated;
  }
}

// Singleton instance for client & server modules
export const mockStore = new MockStore();
