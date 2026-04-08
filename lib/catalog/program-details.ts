import programData from "@/fixtures/normandale-programs.json";

export interface NormandaleProgramRecord {
  title: string;
  slug: string;
  publicUrl: string;
  interestAreas: string[];
  credentialTypes: string[];
  goals: string[];
  publicPage: {
    url: string;
    heading: string;
    pageTitle: string;
    metaDescription: string;
    overview: string[];
    sections: Array<{
      heading: string;
      text: string;
      paragraphs: string[];
      links: Array<{ label: string; url: string }>;
    }>;
    accordionSections: Array<{
      heading: string;
      text: string;
      paragraphs: string[];
      links: Array<{ label: string; url: string }>;
    }>;
    catalogUrl?: string;
    courseOutlineLinks: Array<{ label: string; url: string }>;
    relatedPrograms: Array<{ title: string; url: string }>;
  };
  catalogPage?: {
    url: string;
    title?: string;
    totalCredits?: string;
    summaryParagraphs?: string[];
    sections?: Array<{
      heading: string;
      level: number;
      narrative: string[];
      courses: Array<{
        code: string;
        catalogUrl?: string;
        title: string;
        credits: string;
        crossListed: Array<{ code: string; url: string }>;
      }>;
    }>;
    otherRequirements?: {
      paragraphs: string[];
      bulletPoints: string[];
    };
    error?: string;
  };
}

export const NORMANDALE_PROGRAM_DETAILS = programData.programs as NormandaleProgramRecord[];

export function findNormandaleProgram(title: string): NormandaleProgramRecord | undefined {
  const normalized = title.trim().toLowerCase();
  return NORMANDALE_PROGRAM_DETAILS.find(
    (program) =>
      program.title.toLowerCase() === normalized ||
      program.publicPage.heading.toLowerCase() === normalized ||
      program.catalogPage?.title?.toLowerCase() === normalized
  );
}
