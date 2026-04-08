import type { ProgramCatalog, RequirementStatus, StudentCourseHistory } from "@/lib/types";
import { gradeMeetsMinimum } from "@/lib/utils/grade";

export function evaluateProgramRequirements(
  program: ProgramCatalog,
  courses: StudentCourseHistory[],
  offeredCourseCodes: Set<string>
): RequirementStatus[] {
  const bestAttemptByCourse = new Map<string, StudentCourseHistory>();

  for (const course of courses) {
    const code = `${course.subject} ${course.courseNumber}`;
    const existing = bestAttemptByCourse.get(code);
    if (!existing || compareAttempt(course, existing) > 0) {
      bestAttemptByCourse.set(code, course);
    }
  }

  return program.requirements.map((requirement) => {
    const matchedAttempt = requirement.eligibleCourses
      .map((code) => bestAttemptByCourse.get(code))
      .find((attempt) => attempt && gradeMeetsMinimum(attempt.grade, requirement.minGrade));

    const missingPrerequisites = (requirement.prerequisiteCourses ?? []).filter((courseCode) => {
      const attempt = bestAttemptByCourse.get(courseCode);
      return !attempt || !gradeMeetsMinimum(attempt.grade, "C");
    });

    const hasOfferingInTerm = requirement.eligibleCourses.some((code) => offeredCourseCodes.has(code));

    return {
      requirement,
      satisfied: Boolean(matchedAttempt),
      matchedCourseCode: matchedAttempt ? `${matchedAttempt.subject} ${matchedAttempt.courseNumber}` : undefined,
      missingPrerequisites,
      hasOfferingInTerm
    };
  });
}

function compareAttempt(left: StudentCourseHistory, right: StudentCourseHistory): number {
  if (left.passed !== right.passed) {
    return left.passed ? 1 : -1;
  }
  if (left.inProgress !== right.inProgress) {
    return left.inProgress ? -1 : 1;
  }
  return left.credits - right.credits;
}
