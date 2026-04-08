import { describe, expect, it } from "vitest";

import { parsePathwayText } from "@/lib/parsers/pathway";

const aaWorksheetText = `
Advising Planning Worksheet
Associate of Arts (AA) Degree/Graduation Requirements:
1. Complete a total of 60 semester credits numbered 1000 and above (college level) as described below
Complete the MNTC (40 semester credits)
Complete Health & Exercise Science
Complete electives to meet 60 semester credits
Earn a minimum of 20 college-level credits at Normandale
2. Earn a cumulative GPA of 2.0 or above in all college level coursework completed at Normandale for AA degree or MNTC certification.
MN Transfer Curriculum (MNTC) Requirements:
Complete the requirements of each of the 10 MNTC goals
Earn a minimum of 14 college-level credits at Normandale
Successfully complete a total of 40 credits of coursework in all MNTC goal areas
GOAL 1: COMMUNICATION - 2 courses-One course must be College Writing, one course from Communication
GOAL 3: NATURAL SCIENCES - 2 courses - Select two courses from a minimum of two departments; one must include a laboratory experience
GOAL 4: MATHEMATICAL/LOGICAL REASONING - 1 course
GOAL 5: HISTORY AND SOCIAL/BEHAVIORAL SCIENCES - 2 courses - courses from a minimum of two departments
GOAL 6: THE HUMANITIES AND THE FINE ARTS - 2 courses - two courses from a minimum of two departments.
GOAL 7: HUMAN DIVERSITY - 1 course
GOAL 8: GLOBAL PERSPECTIVE - 1 course
GOAL 9: ETHICAL AND CIVIC RESPONSIBILITY - 1 course
GOAL 10: PEOPLE AND THE ENVIRONMENT - 1 course
HEALTH - 1 course HLTH:_____________
EXERCISE SCIENCE - 1 course EXSC:_____________
`;

describe("parsePathwayText", () => {
  it("extracts structured requirements from the AA planning worksheet", () => {
    const result = parsePathwayText(aaWorksheetText);

    expect(result.documentType).toBe("aa-planning-worksheet");
    expect(result.recognized).toBe(true);
    expect(result.extractedRequirements.some((item) => item.id === "aa-total-credits")).toBe(true);
    expect(result.extractedRequirements.some((item) => item.id === "aa-health")).toBe(true);
    expect(result.extractedRequirements.some((item) => item.id === "goal-1")).toBe(true);
    expect(result.extractedRequirements.some((item) => item.id === "goal-10")).toBe(true);
  });
});
