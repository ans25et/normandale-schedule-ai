import { findNormandaleProgram } from "@/lib/catalog/program-details";
import type { ProgramCatalog, ProgramRequirement } from "@/lib/types";

type CatalogSection = NonNullable<
  NonNullable<NonNullable<ReturnType<typeof findNormandaleProgram>>["catalogPage"]>["sections"]
>[number];

export const GENERAL_NORMANDALE_PROGRAM: ProgramCatalog = {
  id: "normandale-general-v1",
  label: "All Normandale Majors",
  description:
    "General Normandale planning mode that works for any major by using transcript history and uploaded semester offerings without claiming full degree-audit accuracy.",
  requirementSetVersion: "2026.04-general",
  requirements: []
};

export const CS_TRANSFER_PATHWAY_PROGRAM: ProgramCatalog = {
  id: "normandale-cs-transfer-pathway-v1",
  label: "Computer Science Transfer Pathway",
  description:
    "Normandale-first planning profile focused on core Computer Science Transfer Pathway progress with room to expand the full requirement set.",
  requirementSetVersion: "2026.04-core",
  requirements: [
    {
      id: "engc-1101",
      label: "College Writing",
      type: "course",
      eligibleCourses: ["ENGC 1101"],
      credits: 4,
      minGrade: "C",
      importance: "core"
    },
    {
      id: "comm-choice",
      label: "Communication Requirement",
      type: "choice",
      eligibleCourses: ["COMM 1100", "COMM 1101", "COMM 1111", "COMM 1131"],
      credits: 3,
      minGrade: "C",
      importance: "core"
    },
    {
      id: "math-1500",
      label: "Pre-Calculus Foundation",
      type: "course",
      eligibleCourses: ["MATH 1500"],
      credits: 5,
      minGrade: "C",
      importance: "supporting"
    },
    {
      id: "math-1510",
      label: "Calculus I",
      type: "course",
      eligibleCourses: ["MATH 1510"],
      credits: 5,
      minGrade: "C",
      prerequisiteCourses: ["MATH 1500"],
      importance: "critical"
    },
    {
      id: "csci-1101",
      label: "Intro to Computer Problem Solving",
      type: "course",
      eligibleCourses: ["CSCI 1101"],
      credits: 4,
      minGrade: "C",
      importance: "critical"
    },
    {
      id: "csci-1111",
      label: "Programming in C",
      type: "course",
      eligibleCourses: ["CSCI 1111"],
      credits: 4,
      minGrade: "C",
      prerequisiteCourses: ["CSCI 1101"],
      importance: "critical"
    },
    {
      id: "csci-2001",
      label: "Computer Program Concepts",
      type: "course",
      eligibleCourses: ["CSCI 2001"],
      credits: 4,
      minGrade: "C",
      prerequisiteCourses: ["CSCI 1111"],
      importance: "critical"
    },
    {
      id: "csci-2002",
      label: "Algorithms and Data Structures",
      type: "course",
      eligibleCourses: ["CSCI 2002"],
      credits: 4,
      minGrade: "C",
      prerequisiteCourses: ["CSCI 1111"],
      importance: "critical"
    },
    {
      id: "csci-2011",
      label: "Discrete Structures",
      type: "course",
      eligibleCourses: ["CSCI 2011"],
      credits: 4,
      minGrade: "C",
      prerequisiteCourses: ["CSCI 1111"],
      importance: "critical"
    },
    {
      id: "csci-2021",
      label: "Machine Architecture and Organization",
      type: "course",
      eligibleCourses: ["CSCI 2021"],
      credits: 4,
      minGrade: "C",
      prerequisiteCourses: ["CSCI 1111"],
      importance: "core"
    },
    {
      id: "csci-2033",
      label: "Elementary Computational Linear Algebra",
      type: "course",
      eligibleCourses: ["CSCI 2033"],
      credits: 4,
      minGrade: "C",
      prerequisiteCourses: ["MATH 1510", "CSCI 1111"],
      importance: "core"
    }
  ]
};

const catalogById: Record<string, ProgramCatalog> = {
  [GENERAL_NORMANDALE_PROGRAM.id]: GENERAL_NORMANDALE_PROGRAM,
  [CS_TRANSFER_PATHWAY_PROGRAM.id]: CS_TRANSFER_PATHWAY_PROGRAM
};

export function getProgramCatalog(programId: string): ProgramCatalog {
  return catalogById[programId] ?? GENERAL_NORMANDALE_PROGRAM;
}

export function resolveProgramCatalog(programId: string, selectedMajor?: string): ProgramCatalog {
  if (programId !== GENERAL_NORMANDALE_PROGRAM.id) {
    return getProgramCatalog(programId);
  }

  const normalizedMajor = selectedMajor?.trim().toUpperCase() ?? "";
  if (normalizedMajor.includes("COMPUTER SCIENCE")) {
    return CS_TRANSFER_PATHWAY_PROGRAM;
  }

  const programFromCatalog = selectedMajor ? buildProgramCatalogFromNormandaleData(selectedMajor) : undefined;
  if (programFromCatalog) {
    return programFromCatalog;
  }

  return GENERAL_NORMANDALE_PROGRAM;
}

function buildProgramCatalogFromNormandaleData(selectedMajor: string): ProgramCatalog | undefined {
  const record = findNormandaleProgram(selectedMajor);
  const catalogPage = record?.catalogPage;
  if (!record || !catalogPage?.sections?.length) {
    return undefined;
  }

  const requirements = catalogPage.sections.flatMap((section, sectionIndex) =>
    buildRequirementsFromSection(section, sectionIndex)
  );

  if (requirements.length === 0) {
    return undefined;
  }

  const label = catalogPage.title ?? record.publicPage.heading ?? record.title;
  return {
    id: `normandale-dynamic-${slugify(label)}`,
    label,
    description: record.publicPage.metaDescription || `Official Normandale catalog-backed planning profile for ${label}.`,
    requirementSetVersion: `2026.04-dynamic-${slugify(label)}`,
    requirements
  };
}

function buildRequirementsFromSection(
  section: CatalogSection,
  sectionIndex: number
): ProgramRequirement[] {
  if (!section.courses.length) {
    return [];
  }

  const lowerHeading = section.heading.toLowerCase();
  const minimumCourses = extractMinimumCourseCount(lowerHeading);
  const importance = deriveSectionImportance(lowerHeading, section.level);
  const credits = sumCredits(section.courses.map((course) => course.credits));
  const note = section.narrative.join(" ").trim() || undefined;

  if (minimumCourses !== undefined) {
    return [
      {
        id: `section-${sectionIndex}-${slugify(section.heading)}`,
        label: section.heading,
        type: "choice",
        eligibleCourses: section.courses.map((course) => course.code),
        credits,
        minimumCourses,
        minGrade: "C",
        notes: note,
        importance
      }
    ];
  }

  return section.courses.map((course, courseIndex) => ({
    id: `section-${sectionIndex}-course-${courseIndex}-${slugify(course.code)}`,
    label: course.title,
    type: "course" as const,
    eligibleCourses: [course.code],
    credits: parseCredits(course.credits) ?? credits,
    minGrade: "C",
    notes: note,
    importance
  }));
}

function extractMinimumCourseCount(lowerHeading: string): number | undefined {
  if (/\b(one|1)\b/.test(lowerHeading) && /\b(complete|choose|select)\b/.test(lowerHeading)) {
    return 1;
  }
  if (/\b(two|2)\b/.test(lowerHeading) && /\b(complete|choose|select)\b/.test(lowerHeading)) {
    return 2;
  }
  if (/\b(three|3)\b/.test(lowerHeading) && /\b(complete|choose|select)\b/.test(lowerHeading)) {
    return 3;
  }
  return undefined;
}

function deriveSectionImportance(
  lowerHeading: string,
  level: number
): ProgramRequirement["importance"] {
  if (lowerHeading.includes("core") || lowerHeading.includes("required")) {
    return "critical";
  }
  if (level <= 3) {
    return "core";
  }
  return "supporting";
}

function sumCredits(creditLabels: string[]): number {
  return creditLabels.reduce((sum, label) => sum + (parseCredits(label) ?? 0), 0);
}

function parseCredits(value: string): number | undefined {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return undefined;
  }
  return Number(match[1]);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
