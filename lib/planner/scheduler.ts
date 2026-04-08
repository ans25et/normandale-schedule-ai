import { getProgramCatalog } from "@/lib/requirements/catalog";
import { evaluateProgramRequirements } from "@/lib/requirements/engine";
import type {
  CourseOffering,
  GradeValue,
  PlanResult,
  ProgramCatalog,
  RequirementStatus,
  ScheduleOption,
  ScheduledSection,
  StudentConstraints,
  StudentCourseHistory,
  TranscriptParseResult
} from "@/lib/types";
import { blockToMeetings, meetingWindowPenalty, meetingsConflict } from "@/lib/utils/time";

interface CandidateCourse {
  courseCode: string;
  requirement: ProgramCatalog["requirements"][number];
  offerings: CourseOffering[];
}

export function generateSchedulePlan(input: {
  programId: string;
  termLabel: string;
  transcript: TranscriptParseResult;
  offerings: CourseOffering[];
  constraints: StudentConstraints;
  selectedMajor?: string;
  parserWarnings?: string[];
}): PlanResult {
  const program = getProgramCatalog(input.programId);
  const offeredCourseCodes = new Set(input.offerings.map((offering) => `${offering.subject} ${offering.courseNumber}`));
  const requirementStatuses = evaluateProgramRequirements(program, input.transcript.courses, offeredCourseCodes);
  const options =
    program.requirements.length > 0
      ? buildRequirementDrivenOptions(requirementStatuses, input.offerings, input.transcript.courses, input.constraints)
      : buildGeneralOptions(
          input.offerings,
          input.transcript.courses,
          input.constraints,
          input.selectedMajor ?? input.transcript.majors[0] ?? "Undecided"
        );

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    programId: program.id,
    programLabel: program.label,
    termLabel: input.termLabel,
    selectedMajor: input.selectedMajor ?? input.transcript.majors[0],
    options,
    retakeSuggestions: deriveRetakeSuggestions(input.transcript.courses, input.offerings),
    missingRequirementLabels:
      program.requirements.length > 0
        ? requirementStatuses.filter((status) => !status.satisfied).map((status) => status.requirement.label)
        : [],
    deferredRequirementLabels:
      program.requirements.length > 0
        ? requirementStatuses
            .filter((status) => !status.satisfied && (!status.hasOfferingInTerm || status.missingPrerequisites.length > 0))
            .map((status) => status.requirement.label)
        : [],
    parserWarnings: [
      ...(input.parserWarnings ?? []),
      ...(program.requirements.length === 0
        ? [
            "This result works for any Normandale major, but it is not a full degree audit. It ranks schedules from your transcript history, your chosen degree, your interests, and the Fall 2026 class list."
          ]
        : [])
    ],
    scoreMeaning:
      "Higher score means a better overall fit for this version of the app. It rewards schedules that fit your time limits, stay near your credit cap, avoid conflicts, include classes you have struggled with less, and match your chosen degree and interests when possible."
  };
}

function buildRequirementDrivenOptions(
  statuses: RequirementStatus[],
  offerings: CourseOffering[],
  courses: StudentCourseHistory[],
  constraints: StudentConstraints
): ScheduleOption[] {
  const candidateRequirements = statuses.filter(
    (status) => !status.satisfied && status.missingPrerequisites.length === 0 && status.hasOfferingInTerm
  );

  const candidates = candidateRequirements
    .flatMap((status) =>
      status.requirement.eligibleCourses.map((courseCode) => ({
        courseCode,
        requirement: status.requirement,
        offerings: offerings.filter((offering) => `${offering.subject} ${offering.courseNumber}` === courseCode)
      }))
    )
    .filter((candidate) => candidate.offerings.length > 0)
    .sort((left, right) => requirementWeight(right.requirement.importance) - requirementWeight(left.requirement.importance));

  const uniqueCandidates = dedupeCandidates(candidates).slice(0, 6);
  const subsets = enumerateCourseSubsets(uniqueCandidates, constraints.maxCredits);
  const unavailableMeetings = constraints.unavailableBlocks.flatMap(blockToMeetings);
  const options: ScheduleOption[] = [];

  for (const subset of subsets) {
    buildSectionCombos(subset, 0, [], unavailableMeetings, constraints, statuses, courses, options);
  }

  return options
    .sort((left, right) => right.score - left.score)
    .filter((option, index, all) => {
      const fingerprint = option.sections.map((section) => `${section.courseCode}-${section.section}`).join("|");
      return all.findIndex((candidate) => candidate.sections.map((section) => `${section.courseCode}-${section.section}`).join("|") === fingerprint) === index;
    })
    .slice(0, 5)
    .map((option, index) => ({ ...option, rank: index + 1 }));
}

function buildGeneralOptions(
  offerings: CourseOffering[],
  courses: StudentCourseHistory[],
  constraints: StudentConstraints,
  selectedMajor: string
): ScheduleOption[] {
  const bestAttempts = new Map<string, StudentCourseHistory>();
  for (const course of courses) {
    const code = `${course.subject} ${course.courseNumber}`;
    const existing = bestAttempts.get(code);
    if (!existing || compareHistoryPriority(course, existing) > 0) {
      bestAttempts.set(code, course);
    }
  }

  const grouped = new Map<string, CourseOffering[]>();
  for (const offering of offerings) {
    const code = `${offering.subject} ${offering.courseNumber}`;
    const prior = bestAttempts.get(code);
    if (prior?.passed) {
      continue;
    }
    const existing = grouped.get(code) ?? [];
    existing.push(offering);
    grouped.set(code, existing);
  }

  const prioritized = Array.from(grouped.entries())
    .map(([courseCode, courseOfferings]) => ({
      courseCode,
      requirement: {
        id: courseCode,
        label: courseCode,
        type: "course" as const,
        eligibleCourses: [courseCode],
        credits: courseOfferings[0].credits,
        importance: deriveGeneralImportance(courseCode, bestAttempts.get(courseCode), selectedMajor, constraints.interestTags ?? [])
      },
      offerings: courseOfferings
    }))
    .sort((left, right) => {
      const byImportance = requirementWeight(right.requirement.importance) - requirementWeight(left.requirement.importance);
      if (byImportance !== 0) {
        return byImportance;
      }
      return left.offerings[0].courseNumber.localeCompare(right.offerings[0].courseNumber);
    })
    .slice(0, 8);

  const pseudoStatuses: RequirementStatus[] = prioritized.map((candidate) => ({
    requirement: candidate.requirement,
    satisfied: false,
    missingPrerequisites: [],
    hasOfferingInTerm: true
  }));

  const subsets = enumerateCourseSubsets(prioritized, constraints.maxCredits);
  const unavailableMeetings = constraints.unavailableBlocks.flatMap(blockToMeetings);
  const options: ScheduleOption[] = [];

  for (const subset of subsets) {
    buildSectionCombos(subset, 0, [], unavailableMeetings, constraints, pseudoStatuses, courses, options);
  }

  return options
    .sort((left, right) => right.score - left.score)
    .filter((option, index, all) => {
      const fingerprint = option.sections.map((section) => `${section.courseCode}-${section.section}`).join("|");
      return all.findIndex((candidate) => candidate.sections.map((section) => `${section.courseCode}-${section.section}`).join("|") === fingerprint) === index;
    })
    .slice(0, 5)
    .map((option, index) => ({
      ...option,
      rank: index + 1,
      explanation: buildGeneralExplanation(
        option.sections,
        option.credits,
        selectedMajor,
        constraints.interestTags ?? []
      )
    }));
}

function buildSectionCombos(
  subset: CandidateCourse[],
  index: number,
  selected: ScheduledSection[],
  unavailableMeetings: ReturnType<typeof blockToMeetings>,
  constraints: StudentConstraints,
  statuses: RequirementStatus[],
  courses: StudentCourseHistory[],
  options: ScheduleOption[]
): void {
  if (index >= subset.length) {
    if (selected.length === 0) {
      return;
    }

    const credits = selected.reduce((sum, section) => sum + section.credits, 0);
    if (credits > constraints.maxCredits) {
      return;
    }

    options.push(scoreOption(selected, statuses, courses, constraints));
    return;
  }

  const current = subset[index];
  for (const offering of current.offerings) {
    const scheduled: ScheduledSection = {
      ...offering,
      courseCode: `${offering.subject} ${offering.courseNumber}`
    };

    if (selected.some((item) => meetingsConflict(item.meetings, scheduled.meetings))) {
      continue;
    }
    if (unavailableMeetings.some((block) => meetingsConflict([block], scheduled.meetings))) {
      continue;
    }

    buildSectionCombos(
      subset,
      index + 1,
      [...selected, scheduled],
      unavailableMeetings,
      constraints,
      statuses,
      courses,
      options
    );
  }
}

function scoreOption(
  selected: ScheduledSection[],
  statuses: RequirementStatus[],
  courses: StudentCourseHistory[],
  constraints: StudentConstraints
): ScheduleOption {
  const credits = selected.reduce((sum, section) => sum + section.credits, 0);
  const selectedCourseCodes = new Set(selected.map((section) => section.courseCode));
  const progressPoints = statuses.reduce((score, status) => {
    if (status.satisfied) {
      return score;
    }
    if (status.requirement.eligibleCourses.some((code) => selectedCourseCodes.has(code))) {
      return score + requirementWeight(status.requirement.importance) * 40;
    }
    return score;
  }, 0);

  const meetingPenalty = selected.reduce(
    (sum, section) => sum + meetingWindowPenalty(section.meetings, constraints.earliestClassTime, constraints.latestClassTime),
    0
  );
  const compactnessPenalty = selected.reduce((sum, section) => sum + section.meetings.length * 5, 0);
  const repeatedCoursePenalty = selected.reduce((sum, section) => {
    const previousAttempt = courses.find(
      (course) => course.subject === section.subject && course.courseNumber === section.courseNumber && !course.passed
    );
    return previousAttempt ? sum + 6 : sum;
  }, 0);
  const interestBonus = selected.reduce((sum, section) => {
    return subjectMatchesInterest(section.subject, constraints.interestTags ?? []) ? sum + 8 : sum;
  }, 0);
  const creditBalanceBonus = Math.max(0, 20 - Math.abs(constraints.maxCredits - credits) * 2);
  const score = Math.round(
    progressPoints + creditBalanceBonus + interestBonus - meetingPenalty / 12 - compactnessPenalty - repeatedCoursePenalty
  );

  const warnings: string[] = [];
  if (credits >= 15) {
    warnings.push("This plan is on the heavier side for a term with technical coursework.");
  }
  if (selected.filter((section) => section.subject === "CSCI").length >= 3) {
    warnings.push("Three computer science courses together may be intense depending on work and family demands.");
  }

  return {
    id: crypto.randomUUID(),
    rank: 0,
    score,
    credits,
    sections: [...selected].sort((left, right) => left.courseCode.localeCompare(right.courseCode)),
    explanation: buildExplanation(selected, credits, meetingPenalty),
    warnings,
    unmetRequirements: statuses
      .filter((status) => !status.satisfied && !status.requirement.eligibleCourses.some((code) => selectedCourseCodes.has(code)))
      .map((status) => status.requirement.label)
  };
}

function buildExplanation(selected: ScheduledSection[], credits: number, meetingPenalty: number): string {
  const courseCodes = selected.map((section) => section.courseCode).join(", ");
  const timeNote =
    meetingPenalty === 0 ? "It stays inside the preferred time window." : "It trades a little time comfort for stronger requirement progress.";
  return `This option keeps ${credits} credits focused on ${courseCodes}. ${timeNote}`;
}

function buildGeneralExplanation(
  selected: ScheduledSection[],
  credits: number,
  selectedMajor: string,
  interestTags: string[]
): string {
  const subjects = Array.from(new Set(selected.map((section) => section.subject))).join(", ");
  const readableInterests = interestTags.map(getInterestLabel).filter(Boolean);
  const interestText = readableInterests.length > 0 ? ` It also leans toward ${readableInterests.join(", ")}.` : "";
  const majorText = selectedMajor ? ` for ${selectedMajor}` : "";
  return `This option keeps ${credits} credits in a manageable range and focuses on open classes in ${subjects}${majorText}.${interestText}`;
}

function deriveGeneralImportance(
  courseCode: string,
  priorAttempt: StudentCourseHistory | undefined,
  selectedMajor: string,
  interestTags: string[]
): "critical" | "core" | "supporting" {
  if (priorAttempt && !priorAttempt.passed && !priorAttempt.inProgress) {
    return "critical";
  }

  const subject = courseCode.split(" ")[0];
  if (majorMatchesSubject(selectedMajor, subject)) {
    return "critical";
  }

  const lowerDivision = Number(courseCode.split(" ")[1]) < 2000;
  if (lowerDivision) {
    return "core";
  }

  if (subjectMatchesInterest(subject, interestTags)) {
    return "core";
  }

  return "supporting";
}

function subjectMatchesInterest(subject: string, interestTags: string[]): boolean {
  return interestTags.some((tag) => (OFFICIAL_INTEREST_SUBJECT_MAP[tag] ?? []).includes(subject));
}

function getInterestLabel(tag: string): string {
  return OFFICIAL_INTEREST_LABELS[tag] ?? tag;
}

function majorMatchesSubject(selectedMajor: string, subject: string): boolean {
  const normalizedMajor = selectedMajor.toUpperCase();
  return MAJOR_SUBJECT_RULES.some(
    (rule) => rule.keywords.some((keyword) => normalizedMajor.includes(keyword)) && rule.subjects.includes(subject)
  );
}

function compareHistoryPriority(left: StudentCourseHistory, right: StudentCourseHistory): number {
  if (left.passed !== right.passed) {
    return left.passed ? 1 : -1;
  }
  if (left.inProgress !== right.inProgress) {
    return left.inProgress ? 1 : -1;
  }
  return left.credits - right.credits;
}

function dedupeCandidates(candidates: CandidateCourse[]): CandidateCourse[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.courseCode)) {
      return false;
    }
    seen.add(candidate.courseCode);
    return true;
  });
}

function enumerateCourseSubsets(candidates: CandidateCourse[], maxCredits: number): CandidateCourse[][] {
  const result: CandidateCourse[][] = [];

  function visit(index: number, current: CandidateCourse[]): void {
    if (current.length > 0) {
      const credits = current.reduce((sum, candidate) => sum + candidate.offerings[0].credits, 0);
      if (credits <= maxCredits) {
        result.push([...current]);
      }
    }

    if (current.length >= 4) {
      return;
    }

    for (let next = index; next < candidates.length; next += 1) {
      visit(next + 1, [...current, candidates[next]]);
    }
  }

  visit(0, []);
  return result.sort((left, right) => right.length - left.length);
}

function requirementWeight(value: "critical" | "core" | "supporting"): number {
  switch (value) {
    case "critical":
      return 4;
    case "core":
      return 3;
    case "supporting":
      return 2;
    default:
      return 1;
  }
}

function deriveRetakeSuggestions(courses: StudentCourseHistory[], offerings: CourseOffering[]): PlanResult["retakeSuggestions"] {
  const latestByCourse = new Map<string, StudentCourseHistory>();

  for (const course of courses) {
    if (course.inProgress) {
      continue;
    }

    const code = `${course.subject} ${course.courseNumber}`;
    const existing = latestByCourse.get(code);
    if (!existing || compareTermPriority(course.termLabel, existing.termLabel) > 0) {
      latestByCourse.set(code, course);
    }
  }

  const offeredCourseCodes = new Set(offerings.map((offering) => `${offering.subject} ${offering.courseNumber}`));

  return Array.from(latestByCourse.values())
    .filter((course) => shouldSuggestRetake(course.grade))
    .sort((left, right) => retakePriority(right.grade) - retakePriority(left.grade))
    .slice(0, 4)
    .map((course) => ({
      courseCode: `${course.subject} ${course.courseNumber}`,
      title: course.title,
      grade: course.grade,
      termLabel: course.termLabel,
      offeredThisTerm: offeredCourseCodes.has(`${course.subject} ${course.courseNumber}`),
      reason: getRetakeReason(course.grade)
    }));
}

function shouldSuggestRetake(grade: GradeValue): boolean {
  const normalized = String(grade).toUpperCase();
  return ["F", "NP", "D", "D+", "C-"].includes(normalized);
}

function retakePriority(grade: GradeValue): number {
  const normalized = String(grade).toUpperCase();
  switch (normalized) {
    case "F":
    case "NP":
      return 5;
    case "D":
    case "D+":
      return 4;
    case "C-":
      return 3;
    default:
      return 1;
  }
}

function getRetakeReason(grade: GradeValue): string {
  const normalized = String(grade).toUpperCase();
  switch (normalized) {
    case "F":
    case "NP":
      return "This class did not pass, so retaking it could help both progress and GPA.";
    case "D":
    case "D+":
      return "This low grade may still be worth revisiting if you want a stronger GPA or a better transfer-ready grade.";
    case "C-":
      return "This class passed, but it may be worth retaking if you want to raise your GPA.";
    default:
      return "This class may be worth another look if GPA improvement is your goal.";
  }
}

function compareTermPriority(left: string, right: string): number {
  return parseTermValue(left) - parseTermValue(right);
}

function parseTermValue(termLabel: string): number {
  const match = termLabel.match(/(Spring|Summer|Fall|Winter)\s+(\d{4})/i);
  if (!match) {
    return 0;
  }

  const seasonWeight: Record<string, number> = {
    winter: 1,
    spring: 2,
    summer: 3,
    fall: 4
  };

  return Number(match[2]) * 10 + (seasonWeight[match[1].toLowerCase()] ?? 0);
}

const OFFICIAL_INTEREST_LABELS: Record<string, string> = {
  "arts-humanities": "Arts, Communication & Humanities",
  business: "Business",
  education: "Teaching & Education",
  healthcare: "Healthcare & Wellness",
  "social-behavioral": "Social & Behavioral Sciences",
  stem: "Science, Technology, Engineering & Math",
  "liberal-studies": "Liberal Education & Individualized Studies"
};

const OFFICIAL_INTEREST_SUBJECT_MAP: Record<string, string[]> = {
  "arts-humanities": ["ART", "COMM", "ENGL", "ENGW", "MUSC", "PHIL", "SPAN", "FREN", "JAPN", "CHIN", "THTR"],
  business: ["ACCT", "BUSN", "ECON"],
  education: ["EDUC", "READ", "PSYC"],
  healthcare: ["BIOL", "CHWN", "DENH", "HCCC", "HCST", "HLTH", "NURS", "EXSC"],
  "social-behavioral": ["ANTH", "GEOG", "HIST", "POLS", "PSYC", "SOC", "WMST"],
  stem: ["BIOL", "CHEM", "COMT", "CSCI", "DSCI", "ENGR", "ENGT", "GEOL", "MATH", "PHYS", "VACT"],
  "liberal-studies": ["CCD", "ENGC", "HLTH", "INDS", "NCC"]
};

const MAJOR_SUBJECT_RULES: Array<{ keywords: string[]; subjects: string[] }> = [
  { keywords: ["COMPUTER SCIENCE", "DATA ANALYTICS"], subjects: ["CSCI", "DSCI", "COMT", "MATH"] },
  { keywords: ["BUSINESS", "ACCOUNTING", "MANAGEMENT", "MARKETING", "HOSPITALITY", "TOURISM"], subjects: ["BUSN", "ACCT", "ECON"] },
  { keywords: ["PSYCHOLOGY", "SOCIOLOGY", "CRIMINAL JUSTICE", "POLITICAL SCIENCE", "HISTORY", "ANTHROPOLOGY"], subjects: ["PSYC", "SOC", "POLS", "HIST", "ANTH"] },
  { keywords: ["NURSING", "HEALTH", "DENTAL", "PUBLIC HEALTH", "EXERCISE", "COMMUNITY HEALTH"], subjects: ["BIOL", "CHWN", "DENH", "EXSC", "HCST", "HLTH", "NURS"] },
  { keywords: ["ENGINEERING", "MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY", "FOOD SCIENCE", "VACUUM"], subjects: ["BIOL", "CHEM", "ENGR", "ENGT", "GEOL", "MATH", "PHYS", "VACT"] },
  { keywords: ["ART", "MUSIC", "THEATRE", "CREATIVE WRITING", "ENGLISH", "PHILOSOPHY", "SPANISH", "FRENCH", "GERMAN"], subjects: ["ART", "ENGL", "ENGW", "MUSC", "PHIL", "SPAN", "FREN", "GERM", "THTR"] },
  { keywords: ["EDUCATION", "SPECIAL EDUCATION"], subjects: ["EDUC", "PSYC", "READ", "SOC"] },
  { keywords: ["AA", "LIBERAL EDUCATION", "INDIVIDUALIZED STUDIES"], subjects: ["COMM", "ENGC", "ENGL", "HIST", "INDS", "PHIL", "PSYC", "SOC"] }
];
