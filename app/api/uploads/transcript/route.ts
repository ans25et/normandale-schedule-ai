import { NextResponse } from "next/server";

import { parseTranscriptPdf } from "@/lib/parsers/transcript";
import { getRepository } from "@/lib/storage/memory-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A transcript PDF is required." }, { status: 400 });
    }

    const payload = await parseTranscriptPdf(await file.arrayBuffer());
    let documentId: string | undefined;
    let persistenceWarning: string | undefined;

    try {
      const record = await getRepository().saveUpload({
        kind: "transcript",
        fileName: file.name,
        parserName: "Normandale Transcript Parser",
        parserVersion: payload.parserVersion,
        rawText: payload.rawTextPreview.join("\n"),
        payload
      });
      documentId = record.id;
    } catch {
      persistenceWarning = "Transcript parsed, but this hosted environment could not save a local upload record.";
    }

    return NextResponse.json({
      documentId,
      persistenceWarning,
      payload
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcript upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
