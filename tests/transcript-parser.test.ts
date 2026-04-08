import { describe, expect, it } from "vitest";

import { parseTranscriptText } from "@/lib/parsers/transcript";

const transcriptText = `
Normandale Community College Undergraduate Academic Record
Name: Silva Machado, Ana Carolina SSN: xxx-xx-
Fall 2025
Major: Computer Science Transfer Pathway
CSCI 1101 Intro Cmptr/Prob Solv 4.00R B / 4.00/ 4.00 12.00
CSCI 1111 Programming in C 4.00R C / 4.00/ 4.00 8.00
HIST 1111 US History 1 4.00 B 4.00 4.00 12.00
**** Cum Att: 95.00 Earn: 61.00 GPA Crs: 87.00 GPA Pts: 171.00 GPA: 1.96
Spring 2026
CSCI 2001 Computer Program Concepts 4.00 Z 0.00 0.00 0.00
`;

describe("parseTranscriptText", () => {
  it("extracts courses, grades, repeats, and cumulative GPA", () => {
    const result = parseTranscriptText(transcriptText);

    expect(result.studentName).toBe("Silva Machado, Ana Carolina");
    expect(result.majors).toContain("Computer Science Transfer Pathway");
    expect(result.summary.cumulativeGpa).toBe(1.96);
    expect(result.courses).toHaveLength(4);
    expect(result.courses[0]).toMatchObject({
      subject: "CSCI",
      courseNumber: "1101",
      repeated: true,
      passed: true,
      termLabel: "Fall 2025"
    });
    expect(result.courses[3]).toMatchObject({
      subject: "CSCI",
      courseNumber: "2001",
      inProgress: true,
      passed: false
    });
  });
});
