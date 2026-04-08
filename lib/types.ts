export type UploadKind = "transcript" | "pathway" | "course-search";

export type GradeValue =
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "F"
  | "P"
  | "NP"
  | "W"
  | "Z"
  | string;

export interface StudentCourseHistory {
  subject: string;
  courseNumber: string;
  title: string;
  termLabel: string;
  credits: number;
  grade: GradeValue;
  repeated: boolean;
  passed: boolean;
  inProgress: boolean;
}

export interface StudentAcademicSummary {
  cumulativeGpa?: number;
  attemptedCredits?: number;
  earnedCredits?: number;
  gpaCredits?: number;
  gpaPoints?: number;
}

export interface TranscriptParseResult {
  parserVersion: string;
  studentName?: string;
  majors: string[];
  courses: StudentCourseHistory[];
  summary: StudentAcademicSummary;
  rawTextPreview: string[];
}

export interface MeetingTime {
  days: string[];
  startMinutes: number;
  endMinutes: number;
}

export interface CourseOffering {
  subject: string;
  courseNumber: string;
  title: string;
  termLabel: string;
  section: string;
  classNumber?: string;
  credits: number;
  modality?: string;
  instructor?: string;
  seats?: string;
  meetingText: string;
  meetings: MeetingTime[];
}

export interface CourseSearchParseResult {
  parserVersion: string;
  subjectCode?: string;
  termLabel?: string;
  offerings: CourseOffering[];
  rawTextPreview: string[];
}

export interface ProgramRequirement {
  id: string;
  label: string;
  type: "course" | "choice";
  eligibleCourses: string[];
  credits: number;
  minGrade?: string;
  prerequisiteCourses?: string[];
  notes?: string;
  importance: "critical" | "core" | "supporting";
}

export interface ProgramCatalog {
  id: string;
  label: string;
  description: string;
  requirementSetVersion: string;
  requirements: ProgramRequirement[];
}

export interface RequirementStatus {
  requirement: ProgramRequirement;
  satisfied: boolean;
  matchedCourseCode?: string;
  missingPrerequisites: string[];
  hasOfferingInTerm: boolean;
}

export interface PathwayParseResult {
  parserVersion: string;
  recognized: boolean;
  documentType: "cs-transfer-pathway" | "aa-planning-worksheet" | "normandale-program-sheet";
  title?: string;
  courseMentions: string[];
  matchedMarkers: string[];
  extractedRequirements: Array<{
    id: string;
    label: string;
    category: "credits" | "gpa" | "residency" | "goal-area" | "course-group" | "process";
    detail: string;
    minimumCredits?: number;
    minimumCourses?: number;
  }>;
  rawTextPreview: string[];
}

export interface StudentConstraintBlock {
  label: string;
  days: string[];
  startTime: string;
  endTime: string;
}

export interface StudentConstraints {
  earliestClassTime?: string;
  latestClassTime?: string;
  maxCredits: number;
  unavailableBlocks: StudentConstraintBlock[];
  interestTags?: string[];
}

export interface ScheduledSection extends CourseOffering {
  courseCode: string;
}

export interface ScheduleOption {
  id: string;
  rank: number;
  score: number;
  credits: number;
  sections: ScheduledSection[];
  explanation: string;
  warnings: string[];
  unmetRequirements: string[];
}

export interface PlanResult {
  id: string;
  createdAt: string;
  programId: string;
  programLabel: string;
  termLabel: string;
  selectedMajor?: string;
  options: ScheduleOption[];
  retakeSuggestions: Array<{
    courseCode: string;
    title: string;
    grade: GradeValue;
    termLabel: string;
    offeredThisTerm: boolean;
    reason: string;
  }>;
  missingRequirementLabels: string[];
  deferredRequirementLabels: string[];
  parserWarnings: string[];
  scoreMeaning: string;
}

export interface StoredUpload<T> {
  id: string;
  kind: UploadKind;
  fileName: string;
  parserName: string;
  parserVersion: string;
  rawText?: string;
  payload: T;
  createdAt: string;
}

export interface PlanInput {
  programId: string;
  termLabel: string;
  transcriptDocumentId: string;
  pathwayDocumentId?: string;
  courseSearchDocumentIds: string[];
  constraints: StudentConstraints;
  selectedMajor?: string;
  useBuiltInFallCatalog?: boolean;
}
