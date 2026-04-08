import { NextResponse } from "next/server";

import { parsePathwayPdf } from "@/lib/parsers/pathway";
import { getRepository } from "@/lib/storage/memory-repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A pathway PDF is required." }, { status: 400 });
    }

    const payload = await parsePathwayPdf(await file.arrayBuffer());
    let documentId: string | undefined;
    let persistenceWarning: string | undefined;

    try {
      const record = await getRepository().saveUpload({
        kind: "pathway",
        fileName: file.name,
        parserName: "Normandale Program Document Parser",
        parserVersion: payload.parserVersion,
        rawText: payload.rawTextPreview.join("\n"),
        payload
      });
      documentId = record.id;
    } catch {
      persistenceWarning = "Pathway parsed, but this hosted environment could not save a local upload record.";
    }

    return NextResponse.json({
      documentId,
      persistenceWarning,
      payload
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pathway upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
