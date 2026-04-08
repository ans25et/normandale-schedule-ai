import { extractPdfText } from "@/lib/parsers/pdf-text";
import type { PathwayParseResult } from "@/lib/types";

export const PATHWAY_PARSER_VERSION = "normandale-pathway-v2";

export async function parsePathwayPdf(buffer: ArrayBuffer): Promise<PathwayParseResult> {
  const extracted = await extractPdfText(buffer);
  return parsePathwayText(extracted.text, extracted.lines);
}

export function parsePathwayText(text: string, rawLines?: string[]): PathwayParseResult {
  const lines = (rawLines ?? text.split("\n"))
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const courseMentions = Array.from(new Set(lines.flatMap((line) => line.match(/[A-Z]{3,4}\s+\d{4}/g) ?? [])));
  const normalizedText = lines.join("\n");

  if (normalizedText.includes("Associate of Arts (AA) Degree/Graduation Requirements")) {
    return parseAaWorksheet(lines, courseMentions);
  }

  if (normalizedText.includes("Computer Science Transfer Pathway")) {
    return parseCsTransferPathway(lines, courseMentions);
  }

  if (normalizedText.includes("Programs of Study") || normalizedText.includes("PROGRAMS OF STUDY")) {
    return {
      parserVersion: PATHWAY_PARSER_VERSION,
      recognized: true,
      documentType: "normandale-program-sheet",
      title: lines.find((line) => /Programs of Study/i.test(line)),
      courseMentions,
      matchedMarkers: ["PROGRAMS OF STUDY"],
      extractedRequirements: [],
      rawTextPreview: lines.slice(0, 40)
    };
  }

  throw new Error("This does not look like a supported Normandale pathway, planning worksheet, or program sheet PDF.");
}

function parseCsTransferPathway(lines: string[], courseMentions: string[]): PathwayParseResult {
  return {
    parserVersion: PATHWAY_PARSER_VERSION,
    recognized: true,
    documentType: "cs-transfer-pathway",
    title: lines.find((line) => line.includes("Computer Science Transfer Pathway")),
    courseMentions,
    matchedMarkers: ["Computer Science Transfer Pathway"],
    extractedRequirements: courseMentions.map((courseCode) => ({
      id: slugify(courseCode),
      label: courseCode,
      category: "course-group",
      detail: `Course listed in the Normandale Computer Science Transfer Pathway worksheet.`
    })),
    rawTextPreview: lines.slice(0, 40)
  };
}

function parseAaWorksheet(lines: string[], courseMentions: string[]): PathwayParseResult {
  const goalRequirements = lines
    .filter((line) => /^GOAL \d+:/i.test(line))
    .map((line) => {
      const goalNumber = line.match(/^GOAL (\d+):/i)?.[1] ?? "x";
      return {
        id: `goal-${goalNumber}`,
        label: line.split("\t")[0],
        category: "goal-area" as const,
        detail: line
      };
    });

  const extractedRequirements: PathwayParseResult["extractedRequirements"] = [
    {
      id: "aa-total-credits",
      label: "Total college-level credits",
      category: "credits",
      detail: "Complete a total of 60 semester credits numbered 1000 and above.",
      minimumCredits: 60
    },
    {
      id: "aa-mntc-complete",
      label: "Minnesota Transfer Curriculum",
      category: "credits",
      detail: "Complete the MNTC with 40 semester credits.",
      minimumCredits: 40
    },
    {
      id: "aa-health",
      label: "Health requirement",
      category: "course-group",
      detail: "Complete one Health course.",
      minimumCourses: 1
    },
    {
      id: "aa-exercise-science",
      label: "Exercise Science requirement",
      category: "course-group",
      detail: "Complete one Exercise Science course.",
      minimumCourses: 1
    },
    {
      id: "aa-electives",
      label: "Electives to 60 credits",
      category: "course-group",
      detail: "Complete electives numbered 1000 and above to reach 60 total credits."
    },
    {
      id: "aa-normandale-residency",
      label: "Normandale residency",
      category: "residency",
      detail: "Earn a minimum of 20 college-level credits at Normandale for the AA degree.",
      minimumCredits: 20
    },
    {
      id: "aa-gpa",
      label: "AA GPA minimum",
      category: "gpa",
      detail: "Earn a cumulative GPA of 2.0 or above in all college-level coursework completed at Normandale.",
      minimumCredits: 2
    },
    {
      id: "aa-graduation-application",
      label: "Graduation application",
      category: "process",
      detail: "File a graduation application during the first month of the semester you plan to complete your coursework."
    },
    {
      id: "mntc-gpa",
      label: "MNTC GPA minimum",
      category: "gpa",
      detail: "Earn a cumulative GPA of 2.0 or higher in all college-level course work completed at Normandale and in all courses counting toward the MNTC."
    },
    {
      id: "mntc-residency",
      label: "MNTC residency minimum",
      category: "residency",
      detail: "Earn a minimum of 14 college-level credits at Normandale for MNTC certification.",
      minimumCredits: 14
    },
    ...goalRequirements
  ];

  return {
    parserVersion: PATHWAY_PARSER_VERSION,
    recognized: true,
    documentType: "aa-planning-worksheet",
    title: lines.find((line) => line.includes("Associate of Arts (AA) Degree/Graduation Requirements")) ?? "Associate of Arts (AA) Planning Worksheet",
    courseMentions,
    matchedMarkers: [
      "Associate of Arts (AA) Degree/Graduation Requirements",
      "MN Transfer Curriculum (MNTC) Requirements",
      "GOAL 1: COMMUNICATION"
    ],
    extractedRequirements,
    rawTextPreview: lines.slice(0, 40)
  };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
