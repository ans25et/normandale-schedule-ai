import path from "node:path";
import { pathToFileURL } from "node:url";

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";

const pdfjsGlobal = globalThis as typeof globalThis & {
  pdfjsWorker?: {
    WorkerMessageHandler: unknown;
  };
};

pdfjsGlobal.pdfjsWorker = {
  WorkerMessageHandler
};

export interface ExtractedPdfText {
  text: string;
  lines: string[];
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedPdfText> {
  const data = new Uint8Array(buffer);
  const document = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useWorkerFetch: false,
    standardFontDataUrl: pathToFileURL(path.join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts")).toString() + "/"
  }).promise;

  try {
    const collectedLines: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const positionedItems = content.items
        .filter((item): item is typeof item & { str: string; transform: number[] } => "str" in item && "transform" in item)
        .map((item) => ({
          text: String(item.str ?? "").trim(),
          x: item.transform[4] ?? 0,
          y: item.transform[5] ?? 0
        }))
        .filter((item) => item.text.length > 0);

      const grouped = new Map<string, Array<{ text: string; x: number }>>();
      for (const item of positionedItems) {
        const yKey = String(Math.round(item.y / 2) * 2);
        const line = grouped.get(yKey) ?? [];
        line.push({ text: item.text, x: item.x });
        grouped.set(yKey, line);
      }

      const pageLines = Array.from(grouped.entries())
        .sort((left, right) => Number(right[0]) - Number(left[0]))
        .map(([, lineItems]) =>
          lineItems
            .sort((left, right) => left.x - right.x)
            .map((item) => item.text)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim()
        )
        .filter(Boolean);

      collectedLines.push(...pageLines);
    }

    return {
      text: collectedLines.join("\n"),
      lines: collectedLines
    };
  } finally {
    await document.destroy();
  }
}
