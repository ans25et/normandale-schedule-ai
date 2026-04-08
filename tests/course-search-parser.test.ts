import { describe, expect, it } from "vitest";

import { parseCourseSearchText } from "@/lib/parsers/course-search";

const courseSearchText = `
Course Search Results - Student e-Services
Fall 2026
CSCI 2001 01 12345 Computer Program Concepts 4 TR 11:00AM - 12:40PM In Person Smith, Jane 4 / 24
CSCI 2002 02 12346 Algorithms and Data Structures 4 MW 01:00PM - 02:40PM Hybrid Doe, John 8 / 24
`;

describe("parseCourseSearchText", () => {
  it("extracts offerings with sections and meeting blocks", () => {
    const result = parseCourseSearchText(courseSearchText);

    expect(result.termLabel).toBe("Fall 2026");
    expect(result.offerings).toHaveLength(2);
    expect(result.offerings[0]).toMatchObject({
      subject: "CSCI",
      courseNumber: "2001",
      section: "01",
      classNumber: "12345",
      credits: 4
    });
    expect(result.offerings[0].meetings[0]).toMatchObject({
      days: ["T", "R"],
      startMinutes: 660,
      endMinutes: 760
    });
  });
});
