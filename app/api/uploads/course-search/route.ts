import { NextResponse } from "next/server";

import { parseCourseSearchPdf } from "@/lib/parsers/course-search";
import { getRepository } from "@/lib/storage/memory-repository";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A course search PDF is required." }, { status: 400 });
    }

    const payload = await parseCourseSearchPdf(await file.arrayBuffer());
    let documentId: string | undefined;
    let persistenceWarning: string | undefined;

    try {
      const record = await getRepository().saveUpload({
        kind: "course-search",
        fileName: file.name,
        parserName: "Normandale Course Search Parser",
        parserVersion: payload.parserVersion,
        rawText: payload.rawTextPreview.join("\n"),
        payload
      });
      documentId = record.id;
    } catch {
      persistenceWarning = "Course search PDF parsed, but this hosted environment could not save a local upload record.";
    }

    return NextResponse.json({
      documentId,
      persistenceWarning,
      payload
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Course search upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
