import { extractPdfText } from "@/lib/parsers/pdf-text";
import type { CourseOffering, CourseSearchParseResult } from "@/lib/types";
import { parseMeetingText } from "@/lib/utils/time";

export const COURSE_SEARCH_PARSER_VERSION = "normandale-course-search-v1";

export async function parseCourseSearchPdf(buffer: ArrayBuffer): Promise<CourseSearchParseResult> {
  const extracted = await extractPdfText(buffer);
  return parseCourseSearchText(extracted.text, extracted.lines);
}

export function parseCourseSearchText(text: string, rawLines?: string[]): CourseSearchParseResult {
  if (!text.includes("Course Search Results") || !text.includes("Student e-Services")) {
    throw new Error("This does not look like a Normandale course search results PDF.");
  }

  const lines = (rawLines ?? text.split("\n"))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const offerings: CourseOffering[] = [];
  let termLabel: string | undefined;
  let subjectCode: string | undefined;

  const expandedLines = mergeWrappedOfferingLines(lines);

  for (const line of expandedLines) {
    if (!termLabel) {
      const termMatch = line.match(/(Fall|Spring|Summer|Winter)\s+\d{4}/);
      if (termMatch) {
        termLabel = termMatch[0];
      }
    }

    if (!subjectCode) {
      const subjectMatch = line.match(/\b([A-Z]{3,4})\b/);
      if (subjectMatch && !["PAGE", "COURSE"].includes(subjectMatch[1])) {
        subjectCode = subjectMatch[1];
      }
    }

    const offering = parseOfferingLine(line, termLabel ?? "Selected Semester");
    if (offering) {
      offerings.push(offering);
    }
  }

  return {
    parserVersion: COURSE_SEARCH_PARSER_VERSION,
    subjectCode,
    termLabel,
    offerings: dedupeOfferings(offerings),
    rawTextPreview: lines.slice(0, 40)
  };
}

function parseOfferingLine(line: string, termLabel: string): CourseOffering | undefined {
  if (!/^\d{6}\s+[A-Z]{3,4}\s+\d{4}\s+/.test(line)) {
    return undefined;
  }

  const match = line.match(/^(\d{6})\s+([A-Z]{3,4})\s+(\d{4})\s+([A-Z0-9-]{1,6})\s+(.+?)\s+(\d{2}\/\d{2}\s*-\s*\d{2}\/\d{2})\s+(.+)$/i);

  if (!match) {
    return undefined;
  }

  const [, classNumber, subject, courseNumber, section, title, , trailing] = match;
  const creditsMatch = trailing.match(/(\d+(?:\.\d+)?)\s+(Open|Closed|Waitlist)\s+(.+)$/i);

  if (!creditsMatch) {
    return undefined;
  }

  const credits = Number(creditsMatch[1]);
  const trailingAfterStatus = creditsMatch[3].trim();
  const schedulePart = trailing.slice(0, creditsMatch.index).trim();
  const deliveryPatterns = ["Completely Online- Asynchronous", "Blended/Hybrid", "On Campus", "Online", "Hybrid"];
  const deliveryPattern = deliveryPatterns.find((pattern) => trailingAfterStatus.endsWith(pattern));
  const detailWithoutDelivery = deliveryPattern
    ? trailingAfterStatus.slice(0, trailingAfterStatus.length - deliveryPattern.length).trim()
    : trailingAfterStatus;

  const instructor = detailWithoutDelivery || undefined;
  const modality = deliveryPattern ?? undefined;
  const meetingText = normalizeMeetingText(schedulePart, modality);
  const meetings = parseMeetingText(meetingText);

  const seats: string | undefined = undefined;

  return {
    subject,
    courseNumber,
    title: title.trim(),
    termLabel,
    section: section ?? "TBD",
    classNumber,
    credits,
    modality,
    instructor,
    seats,
    meetingText,
    meetings
  };
}

function mergeWrappedOfferingLines(lines: string[]): string[] {
  const result: string[] = [];
  let current = "";

  for (const line of lines) {
    if (/^\d{6}\s+[A-Z]{3,4}\s+\d{4}\s+/.test(line)) {
      if (current) {
        result.push(current.trim());
      }
      current = line;
      continue;
    }

    if (!current) {
      result.push(line);
      continue;
    }

    if (
      line.startsWith("Search Results") ||
      line.startsWith("ID #") ||
      line.startsWith("Page ") ||
      line.startsWith("My Plan") ||
      line.startsWith("Wish List") ||
      line.startsWith("Filter by Instructor") ||
      line.startsWith("Student ID")
    ) {
      continue;
    }

    current = `${current} ${line}`.replace(/\s+/g, " ").trim();
  }

  if (current) {
    result.push(current.trim());
  }

  return result;
}

function normalizeMeetingText(schedulePart: string, modality?: string): string {
  const compact = schedulePart.replace(/\s+/g, " ").trim();
  if (!compact || compact.toLowerCase().startsWith("n/a")) {
    return modality ? `${modality}` : "Online";
  }

  const match = compact.match(/^(.+?)\s+(\d{1,2}:\d{2}[ap]m)\s*-\s*(\d{1,2}:\d{2}[ap]m)$/i);
  if (!match) {
    return compact;
  }

  const days = match[1]
    .replace(/\bTh\b/g, "R")
    .replace(/\bM\b/g, "M")
    .replace(/\bT\b/g, "T")
    .replace(/\bW\b/g, "W")
    .replace(/\bF\b/g, "F")
    .replace(/\s+/g, "");

  return `${days} ${match[2].toUpperCase()} - ${match[3].toUpperCase()}`;
}

function dedupeOfferings(offerings: CourseOffering[]): CourseOffering[] {
  const seen = new Set<string>();
  const result: CourseOffering[] = [];

  for (const offering of offerings) {
    const key = `${offering.subject}-${offering.courseNumber}-${offering.section}-${offering.meetingText}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(offering);
  }

  return result;
}
