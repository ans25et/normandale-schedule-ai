import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PROGRAM_FINDER_URL = "https://www.normandale.edu/academics/degrees-certificates/index.html";
const FIXTURE_OUTPUT = path.join(process.cwd(), "fixtures", "normandale-programs.json");
const TITLES_OUTPUT = path.join(process.cwd(), "fixtures", "normandale-program-titles.json");

async function main() {
  const finderHtml = await fetchText(PROGRAM_FINDER_URL);
  const cards = extractProgramCards(finderHtml);

  const programs = [];

  for (const card of cards) {
    const publicHtml = await fetchText(card.publicUrl);
    const publicDetails = extractPublicProgramDetails(publicHtml, card.publicUrl);

    let catalogDetails = undefined;
    if (publicDetails.catalogUrl) {
      try {
        const catalogHtml = await fetchText(publicDetails.catalogUrl);
        catalogDetails = extractCatalogDetails(catalogHtml, publicDetails.catalogUrl);
      } catch (error) {
        catalogDetails = {
          url: publicDetails.catalogUrl,
          error: error instanceof Error ? error.message : "Unable to fetch catalog page."
        };
      }
    }

    programs.push({
      ...card,
      publicPage: publicDetails,
      catalogPage: catalogDetails
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceUrls: {
      finder: PROGRAM_FINDER_URL
    },
    programs
  };

  await mkdir(path.dirname(FIXTURE_OUTPUT), { recursive: true });
  await writeFile(FIXTURE_OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(
    TITLES_OUTPUT,
    `${JSON.stringify(programs.map((program) => program.catalogPage?.title ?? program.publicPage.heading ?? program.title), null, 2)}\n`,
    "utf8"
  );
  console.log(`Saved ${programs.length} programs to ${FIXTURE_OUTPUT}`);
}

function extractProgramCards(html) {
  const cards = [];
  const pattern =
    /<div class="col px-2 card-box\s+([^"]*)"[^>]*>[\s\S]*?<a class="card-body" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/div>/g;

  for (const match of html.matchAll(pattern)) {
    const classNames = match[1].split(/\s+/).filter(Boolean);
    const href = match[2];
    const cardBody = match[3];
    const titleMatch = cardBody.match(/<span class="card-title bd_block">([\s\S]*?)<\/span>/);
    const title = cleanText(titleMatch?.[1] ?? "");
    if (!title) {
      continue;
    }

    cards.push({
      title,
      slug: new URL(href, PROGRAM_FINDER_URL).pathname.replace(/\/index\.html$/, "").split("/").filter(Boolean).pop(),
      publicUrl: new URL(href, PROGRAM_FINDER_URL).toString(),
      interestAreas: classNames.filter((name) =>
        [
          "arts--communication--amp--humanities",
          "business",
          "teaching--amp--education",
          "healthcare--amp--wellness",
          "social--amp--behavioral-sciences",
          "science-technology--engineering--amp--math",
          "liberal-education--amp--individualized-studies"
        ].includes(name)
      ),
      credentialTypes: classNames.filter((name) =>
        ["degree", "transfer-pathway-degree", "certificate", "degree-emphasis", "partner"].includes(name)
      ),
      goals: classNames.filter((name) =>
        [
          "complete-a-degree-or-certificate-and-start-a-career",
          "complete-a-degree-and-transfer-to-a-4-year-university",
          "complete-a-degree-then-continue-my-studies-on-normandale-apos-s-campus",
          "build-quick-job-skills",
          "find-training-for-employees-in-my-company"
        ].includes(name)
      )
    });
  }

  return cards;
}

function extractPublicProgramDetails(html, pageUrl) {
  const mainHeading = cleanText(html.match(/<h1 class="section-heading">([\s\S]*?)<\/h1>/)?.[1] ?? "");
  const pageTitle = cleanText(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "");
  const metaDescription = cleanText(
    html.match(/<meta content="([\s\S]*?)" name="description"\/?>/i)?.[1] ??
      html.match(/<meta name="description" content="([\s\S]*?)"\/?>/i)?.[1] ??
      ""
  );

  const introHtml = sliceBetween(
    html,
    /<h1 class="section-heading">[\s\S]*?<\/h1>/,
    /<h2 class="section-heading">|<section class="accordionTabs/
  );
  const overview = extractParagraphs(introHtml);

  const sectionPattern =
    /<h2 class="section-heading">([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2 class="section-heading">|<section class="accordionTabs|<div class="hh-module|<h2>Related Programs<\/h2>|<\/main>)/g;
  const sections = Array.from(html.matchAll(sectionPattern)).map((match) => ({
    heading: cleanText(match[1]),
    text: cleanText(stripTags(match[2])),
    paragraphs: extractParagraphs(match[2]),
    links: extractLinks(match[2], pageUrl)
  }));

  const accordionSectionHtml = sliceBetween(html, /<section class="accordionTabs[\s\S]*?>/, /<div class="hh-module|<h2>Related Programs<\/h2>|<\/main>/);
  const accordionSections = [];
  if (accordionSectionHtml) {
    const accordionPattern =
      /<button[^>]*class="accordion-button[\s\S]*?>([\s\S]*?)<\/button>[\s\S]*?<div class="accordion-body"[^>]*>([\s\S]*?)<\/div>/g;
    for (const match of accordionSectionHtml.matchAll(accordionPattern)) {
      accordionSections.push({
        heading: cleanText(match[1]),
        text: cleanText(stripTags(match[2])),
        paragraphs: extractParagraphs(match[2]),
        links: extractLinks(match[2], pageUrl)
      });
    }
  }

  const allLinks = extractLinks(html, pageUrl);
  const catalogUrl = allLinks.find((link) => link.url.includes("smartcatalogiq.com"))?.url;
  const courseOutlineLinks = allLinks.filter((link) => link.url.toLowerCase().endsWith(".pdf"));

  const relatedPrograms = [];
  const relatedBlock = sliceBetween(html, /<h2>Related Programs<\/h2>/, /<\/main>/);
  if (relatedBlock) {
    const anchorPattern = /<a[^>]+href="([^"]+)"[^>]*>\s*<span class="up">([\s\S]*?)<\/span>\s*<\/a>/g;
    for (const match of relatedBlock.matchAll(anchorPattern)) {
      relatedPrograms.push({
        title: cleanText(match[2]),
        url: new URL(match[1], pageUrl).toString()
      });
    }
  }

  return {
    url: pageUrl,
    heading: mainHeading,
    pageTitle,
    metaDescription,
    overview,
    sections,
    accordionSections,
    catalogUrl,
    courseOutlineLinks,
    relatedPrograms
  };
}

function extractCatalogDetails(html, pageUrl) {
  const title = cleanText(html.match(/<h1 class="degreeTitle">\s*([\s\S]*?)\s*<\/h1>/)?.[1] ?? "");
  const totalCredits = cleanText(html.match(/<div id="degreeRequirements">[\s\S]*?<h2>\s*([\s\S]*?)\s*<\/h2>/)?.[1] ?? "");
  const requirementsStart = html.indexOf('<div id="degreeRequirements">');
  const requirementsEnd = html.indexOf('<div id="csNewRelicPageTypeDiv"', requirementsStart);
  const requirementsHtml =
    requirementsStart >= 0 && requirementsEnd > requirementsStart ? html.slice(requirementsStart, requirementsEnd) : "";

  const summaryParagraphs = [];
  const firstRequirementHeadingMatch = requirementsHtml.match(/<h[34][^>]*class="sc-RequiredCoursesHeading/);
  const summaryChunk =
    firstRequirementHeadingMatch && firstRequirementHeadingMatch.index !== undefined
      ? requirementsHtml.slice(0, firstRequirementHeadingMatch.index)
      : requirementsHtml;
  summaryParagraphs.push(...extractParagraphs(summaryChunk));

  const sections = [];
  const headingPattern = /<h([34])[^>]*class="sc-RequiredCoursesHeading[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h\1>/g;
  const headingMatches = Array.from(requirementsHtml.matchAll(headingPattern));

  for (let index = 0; index < headingMatches.length; index += 1) {
    const match = headingMatches[index];
    const start = match.index ?? 0;
    const end = headingMatches[index + 1]?.index ?? requirementsHtml.length;
    const chunk = requirementsHtml.slice(start, end);
    const heading = cleanText(match[2]);
    const narrative = extractParagraphs(chunk).filter(
      (text) => text !== heading && !/^\d+\s*cr$/i.test(text)
    );
    const courses = extractCatalogCourses(chunk, pageUrl);

    sections.push({
      heading,
      level: Number(match[1]),
      narrative,
      courses
    });
  }

  const otherRequirementsHtml = sliceBetween(
    html,
    /<p class="sc-SubHeading">Other Degree Requirements<\/p>/,
    /<p class="sc-plo">|<\/div><div id="csNewRelicPageTypeDiv"/
  );

  const otherRequirements = otherRequirementsHtml
    ? {
        paragraphs: extractParagraphs(otherRequirementsHtml),
        bulletPoints: Array.from(otherRequirementsHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)).map((match) => cleanText(match[1]))
      }
    : undefined;

  return {
    url: pageUrl,
    title,
    totalCredits,
    summaryParagraphs,
    sections,
    otherRequirements
  };
}

function extractCatalogCourses(html, pageUrl) {
  const rows = [];
  const rowPattern =
    /<tr>\s*<td class="sc-coursenumber[\s\S]*?>([\s\S]*?)<\/td><td class="sc-coursetitle[\s\S]*?>([\s\S]*?)<\/td><td class="sc-credits[\s\S]*?<p class="credits">([\s\S]*?)<\/p>[\s\S]*?<\/td>\s*<\/tr>/g;

  for (const match of html.matchAll(rowPattern)) {
    const courseCell = match[1];
    const mainLink = courseCell.match(/<a class="sc-courselink" href="([^"]+)">([\s\S]*?)<\/a>/);
    const crossListed = Array.from(courseCell.matchAll(/<span class="crossListed">\/<a class="sc-courselink" href="([^"]+)">([\s\S]*?)<\/a><\/span>/g)).map(
      (crossMatch) => ({
        code: cleanText(crossMatch[2]),
        url: new URL(crossMatch[1], pageUrl).toString()
      })
    );

    rows.push({
      code: cleanText(mainLink?.[2] ?? stripTags(courseCell)),
      catalogUrl: mainLink ? new URL(mainLink[1], pageUrl).toString() : undefined,
      title: cleanText(match[2]),
      credits: cleanText(match[3]),
      crossListed
    });
  }

  return rows;
}

function extractLinks(html, baseUrl) {
  return Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g))
    .map((match) => ({
      label: cleanText(match[2]),
      url: new URL(match[1], baseUrl).toString()
    }))
    .filter((link) => link.label || link.url);
}

function extractParagraphs(html) {
  return Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g))
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
}

function sliceBetween(html, startPattern, endPattern) {
  const startMatch = html.match(startPattern);
  if (!startMatch || startMatch.index === undefined) {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const remainder = html.slice(startIndex);
  const endMatch = remainder.match(endPattern);
  if (!endMatch || endMatch.index === undefined) {
    return remainder;
  }

  return remainder.slice(0, endMatch.index);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "normandale-schedule-ai/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

function stripTags(value) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

function cleanText(value) {
  return decodeHtmlEntities(stripTags(value))
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8211;|&ndash;/g, "-")
    .replace(/&#8212;|&mdash;/g, "-")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8230;/g, "...")
    .replace(/&#47;/g, "/")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, codePoint) => {
      const parsed = Number.parseInt(codePoint, 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : _;
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
