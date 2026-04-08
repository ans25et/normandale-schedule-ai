import { extractPdfText } from "@/lib/parsers/pdf-text";
import type { StudentAcademicSummary, StudentCourseHistory, TranscriptParseResult } from "@/lib/types";
import { isPassingGrade } from "@/lib/utils/grade";

export const TRANSCRIPT_PARSER_VERSION = "normandale-transcript-v1";

const termMatcher = /^(Fall|Spring|Summer|Winter)\s+\d{4}$/;

export async function parseTranscriptPdf(buffer: ArrayBuffer): Promise<TranscriptParseResult> {
  const extracted = await extractPdfText(buffer);
  return parseTranscriptText(extracted.text, extracted.lines);
}

export function parseTranscriptText(text: string, rawLines?: string[]): TranscriptParseResult {
  const lines = (rawLines ?? text.split("\n"))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const normalizedText = lines.join("\n");

  const hasNormandaleHeader =
    normalizedText.includes("Normandale Community College") ||
    (lines.includes("Normandale") && lines.includes("Community") && lines.includes("College"));
  const hasAcademicRecordHeader =
    normalizedText.includes("Undergraduate Academic Record") ||
    normalizedText.includes("Academic Record") ||
    lines.includes("Undergraduate") ||
    lines.includes("Academic") ||
    lines.includes("Record");

  if (!hasNormandaleHeader || !hasAcademicRecordHeader) {
    throw new Error("This does not look like a Normandale academic record PDF.");
  }

  const courses: StudentCourseHistory[] = [];
  const majors = new Set<string>();
  let currentTerm = "Unknown Term";
  let studentName: string | undefined;
  let summary: StudentAcademicSummary = {};

  for (const line of lines) {
    for (const segment of splitColumns(line)) {
      if (!studentName) {
        const nameMatch = segment.match(/Name:\s*(.+?)\s+SSN:/);
        if (nameMatch) {
          studentName = nameMatch[1].trim();
        }
      }

      if (termMatcher.test(segment)) {
        currentTerm = segment;
        continue;
      }

      const majorMatch = segment.match(/Major:\s*(.+)$/);
      if (majorMatch) {
        majors.add(majorMatch[1].trim());
        continue;
      }

      if (segment.includes("Cum Att:")) {
        summary = parseSummaryLine(segment) ?? summary;
      }

      const course = parseCourseLine(segment, currentTerm);
      if (course) {
        courses.push(course);
      }
    }
  }

  return {
    parserVersion: TRANSCRIPT_PARSER_VERSION,
    studentName,
    majors: Array.from(majors),
    courses,
    summary,
    rawTextPreview: lines.slice(0, 40)
  };
}

function splitColumns(line: string): string[] {
  return line
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function parseSummaryLine(line: string): StudentAcademicSummary | undefined {
  const attemptedCredits = captureFloat(line, /Cum Att:\s*([\d.]+)/);
  const earnedCredits = captureFloat(line, /Earn:\s*([\d.]+)/);
  const gpaCredits = captureFloat(line, /GPA Crs:\s*([\d.]+)/);
  const gpaPoints = captureFloat(line, /GPA Pts:\s*([\d.]+)/);
  const cumulativeGpa = captureFloat(line, /GPA:\s*([\d.]+)/);

  if (
    attemptedCredits === undefined &&
    earnedCredits === undefined &&
    gpaCredits === undefined &&
    gpaPoints === undefined &&
    cumulativeGpa === undefined
  ) {
    return undefined;
  }

  return {
    attemptedCredits,
    earnedCredits,
    gpaCredits,
    gpaPoints,
    cumulativeGpa
  };
}

function captureFloat(line: string, matcher: RegExp): number | undefined {
  const match = line.match(matcher);
  return match ? Number(match[1]) : undefined;
}

function parseCourseLine(line: string, termLabel: string): StudentCourseHistory | undefined {
  const normalized = line.replace(/^\|\s*/, "").replace(/^<\s+/, "").trim();
  const courseMatch = normalized.match(/^([A-Z]{3,4})\s+(\d{4})\s+(.+)$/);

  if (!courseMatch) {
    return undefined;
  }

  const floats = [...normalized.matchAll(/(\d+\.\d{2})/g)].map((match) => ({
    value: Number(match[1]),
    index: match.index ?? 0
  }));

  if (floats.length < 4) {
    return undefined;
  }

  const credits = floats[0].value;
  const titleStart = normalized.indexOf(courseMatch[3]);
  const titleEnd = floats[0].index;
  const title = normalized.slice(titleStart, titleEnd).replace(/\s+/g, " ").trim();

  if (!title || title.startsWith("Att:") || title.includes("Career Undergrad Summary")) {
    return undefined;
  }

  const betweenCreditsAndEarned = normalized.slice(floats[0].index + 4, floats[1].index).replace(/\s+/g, " ").trim();
  const gradeMatch = betweenCreditsAndEarned.match(/([A-Z][+-]?|NP|P|W|Z)$/);
  const grade = gradeMatch?.[1] ?? "Z";
  const repeated = /\d+\.\d{2}R/.test(normalized);
  const earned = floats[1].value;
  const inProgress = grade === "Z";

  return {
    subject: courseMatch[1],
    courseNumber: courseMatch[2],
    title,
    termLabel,
    credits,
    grade,
    repeated,
    passed: !inProgress && earned > 0 && isPassingGrade(grade),
    inProgress
  };
}
