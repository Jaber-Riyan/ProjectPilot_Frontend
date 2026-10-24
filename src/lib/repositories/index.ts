import { APP_CONFIG } from "@/config/app-config";
import { MockCourseRepository } from "./mock/mock-course.repository";
import { MockModuleRepository } from "./mock/mock-module.repository";
import { MockContentRepository } from "./mock/mock-content.repository";
import { MockAssignmentRepository } from "./mock/mock-assignment.repository";
import { MockSubmissionRepository } from "./mock/mock-submission.repository";
import { MockReviewRepository } from "./mock/mock-review.repository";
import { MockUserRepository } from "./mock/mock-user.repository";

export * from "./types";

function createRepositories() {
  if (APP_CONFIG.dataSource === "mock") {
    return {
      courseRepository: new MockCourseRepository(),
      moduleRepository: new MockModuleRepository(),
      contentRepository: new MockContentRepository(),
      assignmentRepository: new MockAssignmentRepository(),
      submissionRepository: new MockSubmissionRepository(),
      reviewRepository: new MockReviewRepository(),
      userRepository: new MockUserRepository(),
    };
  }

  throw new Error(
    `Data source mode "${APP_CONFIG.dataSource}" is not configured for production API integration yet. Please set APP_CONFIG.dataSource to "mock" for frontend development workflows.`
  );
}

export const {
  courseRepository,
  moduleRepository,
  contentRepository,
  assignmentRepository,
  submissionRepository,
  reviewRepository,
  userRepository,
} = createRepositories();
