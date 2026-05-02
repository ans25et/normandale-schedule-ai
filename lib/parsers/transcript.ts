import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";

import { extractPdfText } from "@/lib/parsers/pdf-text";
import type { StudentAcademicSummary, StudentCourseHistory, TranscriptParseResult } from "@/lib/types";
import { isPassingGrade } from "@/lib/utils/grade";

export const TRANSCRIPT_PARSER_VERSION = "normandale-transcript-v1";

const termMatcher = /^(Fall|Spring|Summer|Winter)\s+\d{4}$/;
const transcriptPdfGlobal = globalThis as typeof globalThis & {
  pdfjsWorker?: {
    WorkerMessageHandler: unknown;
  };
};

transcriptPdfGlobal.pdfjsWorker = {
  WorkerMessageHandler
};

export async function parseTranscriptPdf(buffer: ArrayBuffer): Promise<TranscriptParseResult> {
  const extracted = await extractPdfText(buffer.slice(0));
  try {
    const parsed = parseTranscriptText(extracted.text, extracted.lines);
    if (parsed.courses.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back to the transcript-specific column parser below.
  }

  return parseTranscriptByColumns(buffer.slice(0));
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
  const gradeMatch = betweenCreditsAndEarned.match(/(NP|[A-Z][+-]?)(?=\s*\/|\s*$)/);
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

async function parseTranscriptByColumns(buffer: ArrayBuffer): Promise<TranscriptParseResult> {
  const data = new Uint8Array(buffer);
  const document = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useWorkerFetch: false
  }).promise;

  try {
    const majors = new Set<string>();
    const courses: StudentCourseHistory[] = [];
    const previewLines: string[] = [];
    let studentName: string | undefined;
    let summary: StudentAcademicSummary = {};

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const columns = groupTranscriptColumns(content.items);
      const termMarkers = columns
        .map((column) => ({
          x: column.x,
          text: column.text
        }))
        .filter((column) => termMatcher.test(column.text));

      for (const column of columns) {
        previewLines.push(column.text);

        if (!studentName) {
          const nameMatch = column.text.match(/Name:\s*(.+?)\s+SSN:/);
          if (nameMatch) {
            studentName = nameMatch[1].trim();
          }
        }

        const majorMatches = Array.from(column.text.matchAll(/Major:\s*(.+?)(?=(?:Major:|\||$))/g));
        for (const match of majorMatches) {
          const major = match[1].replace(/\s+/g, " ").trim();
          if (major) {
            majors.add(major);
          }
        }

        if (column.text.includes("Cum Att:")) {
          const parsedSummary = parseSummaryLine(column.text);
          if (parsedSummary && (parsedSummary.attemptedCredits ?? 0) >= (summary.attemptedCredits ?? 0)) {
            summary = parsedSummary;
          }
        }

        const parts = column.text.split("|").map((part) => part.trim()).filter(Boolean);
        const coursePart = parts.find((part) => /^[A-Z]{3,4}\s+\d{4}\s+/.test(part));
        if (!coursePart) {
          continue;
        }

        const currentTerm = findNearestTerm(termMarkers, column.x) ?? "Unknown Term";
        const course = parseCourseLine(coursePart, currentTerm);
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
      rawTextPreview: previewLines.slice(0, 40)
    };
  } finally {
    await document.destroy();
  }
}

function groupTranscriptColumns(
  items: unknown[]
): Array<{
  x: number;
  text: string;
}> {
  const groups = new Map<string, Array<{ str: string; y: number }>>();

  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item) || !("transform" in item)) {
      continue;
    }

    const str = String((item as { str?: string }).str ?? "");
    const transform = (item as { transform?: number[] }).transform;
    if (!transform || str.length === 0) {
      continue;
    }

    const x = transform[4] ?? 0;
    const key = (Math.round(x * 10) / 10).toFixed(1);
    const group = groups.get(key) ?? [];
    group.push({ str, y: transform[5] ?? 0 });
    groups.set(key, group);
  }

  return Array.from(groups.entries())
    .map(([xKey, parts]) => ({
      x: Number(xKey),
      text: parts
        .sort((left, right) => left.y - right.y)
        .map((part) => part.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .replace(/\s+\|\s+/g, " | ")
        .trim()
    }))
    .sort((left, right) => left.x - right.x);
}

function findNearestTerm(markers: Array<{ x: number; text: string }>, x: number): string | undefined {
  let current: string | undefined;
  for (const marker of markers) {
    if (marker.x <= x) {
      current = marker.text;
    }
  }
  return current;
}
