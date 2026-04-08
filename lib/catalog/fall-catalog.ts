import path from "node:path";
import { promises as fs } from "node:fs";

import { parseCourseSearchPdf } from "@/lib/parsers/course-search";
import type { CourseOffering } from "@/lib/types";

const CACHE_FILE = path.join(process.cwd(), ".data", "fall-2026-catalog.json");
const FIXTURE_FILE = path.join(process.cwd(), "fixtures", "fall-2026-catalog.json");

export async function getBuiltInFallCatalogOfferings(): Promise<CourseOffering[]> {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });

  const cached = await readCatalogJson(CACHE_FILE);
  if (cached) {
    return cached;
  }

  const envCatalog = process.env.FALL_2026_CATALOG_PATH ? await readCatalogJson(process.env.FALL_2026_CATALOG_PATH) : undefined;
  if (envCatalog) {
    return envCatalog;
  }

  const fixtureCatalog = await readCatalogJson(FIXTURE_FILE);
  if (fixtureCatalog) {
    return fixtureCatalog;
  }

  if (!process.env.HOME) {
    return [];
  }

  const downloadsDir = path.join(process.env.HOME, "Downloads");
  const names = await fs.readdir(downloadsDir);
  const subjectPdfNames = names.filter(
    (name) =>
      name.endsWith("Course Search Results - Student e-Services.pdf") &&
      !name.startsWith("full ") &&
      !name.startsWith("Course Search Results - Student e-Services")
  );

  const offerings: CourseOffering[] = [];

  for (const name of subjectPdfNames) {
    const filePath = path.join(downloadsDir, name);
    const file = await fs.readFile(filePath);
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    const parsed = await parseCourseSearchPdf(buffer);
    offerings.push(...parsed.offerings.filter((offering) => offering.termLabel === "Fall 2026"));
  }

  await fs.writeFile(CACHE_FILE, JSON.stringify(offerings, null, 2), "utf8");
  return offerings;
}

async function readCatalogJson(filePath: string): Promise<CourseOffering[] | undefined> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as CourseOffering[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}
