import type { ProgramCatalog } from "@/lib/types";

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
