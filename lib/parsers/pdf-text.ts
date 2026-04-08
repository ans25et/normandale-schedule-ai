import { PDFParse } from "pdf-parse";

export interface ExtractedPdfText {
  text: string;
  lines: string[];
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedPdfText> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = result.text ?? "";
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    return {
      text: lines.join("\n"),
      lines
    };
  } finally {
    await parser.destroy();
  }
}
