import path from "node:path";

const runtimeRequire = eval("require") as NodeRequire;

const { PDFParse } = runtimeRequire(path.resolve(process.cwd(), "node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs")) as {
  PDFParse: new (options: { data: ArrayBuffer }) => {
    getText: () => Promise<{ text?: string }>;
    destroy: () => Promise<void>;
  };
};

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
