import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

export interface ExtractedPdfText {
  text: string;
  lines: string[];
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedPdfText> {
  const data = new Uint8Array(buffer);
  const document = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useWorkerFetch: false
  }).promise;

  try {
    const collectedLines: string[] = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageLines = content.items
        .map((item) => ("str" in item ? String(item.str ?? "") : ""))
        .join("\n")
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, " ").trim())
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
