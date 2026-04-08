import { describe, expect, it } from "vitest";

import { generateSchedulePlan } from "@/lib/planner/scheduler";
import type { CourseOffering, TranscriptParseResult } from "@/lib/types";

const transcript: TranscriptParseResult = {
  parserVersion: "test",
  studentName: "Student Example",
  majors: ["Computer Science Transfer Pathway"],
  courses: [
    {
      subject: "ENGC",
      courseNumber: "1101",
      title: "College Writing",
      termLabel: "Spring 2024",
      credits: 4,
      grade: "C",
      repeated: false,
      passed: true,
      inProgress: false
    },
    {
      subject: "COMM",
      courseNumber: "1111",
      title: "Interpersonal Comm",
      termLabel: "Spring 2024",
      credits: 3,
      grade: "A",
      repeated: false,
      passed: true,
      inProgress: false
    },
    {
      subject: "MATH",
      courseNumber: "1500",
      title: "Pre-Calculus",
      termLabel: "Fall 2024",
      credits: 5,
      grade: "C",
      repeated: false,
      passed: true,
      inProgress: false
    },
    {
      subject: "CSCI",
      courseNumber: "1101",
      title: "Intro Cmptr/Prob Solv",
      termLabel: "Fall 2025",
      credits: 4,
      grade: "B",
      repeated: true,
      passed: true,
      inProgress: false
    },
    {
      subject: "CSCI",
      courseNumber: "1111",
      title: "Programming in C",
      termLabel: "Fall 2025",
      credits: 4,
      grade: "C",
      repeated: true,
      passed: true,
      inProgress: false
    }
  ],
  summary: {
    cumulativeGpa: 2.45
  },
  rawTextPreview: []
};

const offerings: CourseOffering[] = [
  {
    subject: "MATH",
    courseNumber: "1510",
    title: "Calculus I",
    termLabel: "Fall 2026",
    section: "01",
    credits: 5,
    meetingText: "MW 09:00AM - 10:40AM",
    meetings: [{ days: ["M", "W"], startMinutes: 540, endMinutes: 640 }]
  },
  {
    subject: "CSCI",
    courseNumber: "2001",
    title: "Computer Program Concepts",
    termLabel: "Fall 2026",
    section: "01",
    credits: 4,
    meetingText: "TR 11:00AM - 12:40PM",
    meetings: [{ days: ["T", "R"], startMinutes: 660, endMinutes: 760 }]
  },
  {
    subject: "CSCI",
    courseNumber: "2002",
    title: "Algorithms and Data Structures",
    termLabel: "Fall 2026",
    section: "02",
    credits: 4,
    meetingText: "TR 01:00PM - 02:40PM",
    meetings: [{ days: ["T", "R"], startMinutes: 780, endMinutes: 880 }]
  },
  {
    subject: "CSCI",
    courseNumber: "2011",
    title: "Discrete Structures",
    termLabel: "Fall 2026",
    section: "03",
    credits: 4,
    meetingText: "MW 01:00PM - 02:40PM",
    meetings: [{ days: ["M", "W"], startMinutes: 780, endMinutes: 880 }]
  }
];

describe("generateSchedulePlan", () => {
  it("returns ranked, no-conflict options within credit limits", () => {
    const plan = generateSchedulePlan({
      programId: "normandale-cs-transfer-pathway-v1",
      termLabel: "Fall 2026",
      transcript,
      offerings,
      constraints: {
        earliestClassTime: "09:00AM",
        latestClassTime: "05:00PM",
        maxCredits: 13,
        unavailableBlocks: []
      }
    });

    expect(plan.options.length).toBeGreaterThan(0);
    expect(plan.options[0].credits).toBeLessThanOrEqual(13);
    expect(plan.options[0].sections.length).toBeGreaterThan(0);
    expect(plan.missingRequirementLabels).toContain("Calculus I");
    expect(plan.retakeSuggestions).toHaveLength(0);
  });

  it("uses the new official interest areas and chosen major in all-majors mode", () => {
    const allMajorsPlan = generateSchedulePlan({
      programId: "normandale-general-v1",
      termLabel: "Fall 2026",
      transcript,
      offerings: [
        ...offerings,
        {
          subject: "PSYC",
          courseNumber: "1110",
          title: "Introduction to Psychology",
          termLabel: "Fall 2026",
          section: "04",
          credits: 4,
          meetingText: "MW 11:00AM - 12:40PM",
          meetings: [{ days: ["M", "W"], startMinutes: 660, endMinutes: 760 }]
        }
      ],
      constraints: {
        latestClassTime: "05:00PM",
        maxCredits: 8,
        unavailableBlocks: [],
        interestTags: ["social-behavioral"]
      },
      selectedMajor: "Psychology Transfer Pathway (AA)"
    });

    expect(allMajorsPlan.options.length).toBeGreaterThan(0);
    expect(allMajorsPlan.options[0].explanation).toContain("Social & Behavioral Sciences");
    expect(allMajorsPlan.options.some((option) => option.sections.some((section) => section.subject === "PSYC"))).toBe(true);
  });

  it("surfaces retake suggestions for low-grade courses", () => {
    const plan = generateSchedulePlan({
      programId: "normandale-general-v1",
      termLabel: "Fall 2026",
      transcript: {
        ...transcript,
        courses: [
          ...transcript.courses,
          {
            subject: "CHEM",
            courseNumber: "1020",
            title: "Introductory Chemistry",
            termLabel: "Spring 2025",
            credits: 4,
            grade: "D+",
            repeated: false,
            passed: true,
            inProgress: false
          }
        ]
      },
      offerings: [
        ...offerings,
        {
          subject: "CHEM",
          courseNumber: "1020",
          title: "Introductory Chemistry",
          termLabel: "Fall 2026",
          section: "05",
          credits: 4,
          meetingText: "TR 09:00AM - 10:40AM",
          meetings: [{ days: ["T", "R"], startMinutes: 540, endMinutes: 640 }]
        }
      ],
      constraints: {
        latestClassTime: "05:00PM",
        maxCredits: 8,
        unavailableBlocks: []
      },
      selectedMajor: "Associate of Arts (AA) in Liberal Education"
    });

    expect(plan.retakeSuggestions.some((item) => item.courseCode === "CHEM 1020")).toBe(true);
    expect(plan.retakeSuggestions.find((item) => item.courseCode === "CHEM 1020")?.offeredThisTerm).toBe(true);
  });
});
