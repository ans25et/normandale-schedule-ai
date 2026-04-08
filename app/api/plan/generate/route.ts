import { NextResponse } from "next/server";

import { getBuiltInFallCatalogOfferings } from "@/lib/catalog/fall-catalog";
import { generateSchedulePlan } from "@/lib/planner/scheduler";
import { getRepository } from "@/lib/storage/memory-repository";
import type { CourseSearchParseResult, PathwayParseResult, PlanInput, TranscriptParseResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as PlanInput;
    const repository = getRepository();

    const transcriptRecord = input.transcriptDocumentId
      ? await repository.getUpload<TranscriptParseResult>(input.transcriptDocumentId)
      : undefined;
    const transcriptPayload = transcriptRecord?.payload ?? input.transcriptPayload;
    if (!transcriptPayload) {
      return NextResponse.json({ error: "Transcript upload was not found for this session." }, { status: 404 });
    }

    const pathwayRecord = input.pathwayDocumentId
      ? await repository.getUpload<PathwayParseResult>(input.pathwayDocumentId)
      : undefined;
    const pathwayPayload = pathwayRecord?.payload ?? input.pathwayPayload;

    const courseSearchUploads = await Promise.all(
      (input.courseSearchDocumentIds ?? []).map((documentId) => repository.getUpload<CourseSearchParseResult>(documentId))
    );
    const availableUploads = courseSearchUploads.filter(
      (upload): upload is NonNullable<typeof upload> => Boolean(upload)
    );
    const builtInOfferings = input.useBuiltInFallCatalog ? await getBuiltInFallCatalogOfferings() : [];
    const inlineOfferings = (input.courseSearchPayloads ?? []).flatMap((payload) => payload.offerings);
    const mergedOfferings = [...builtInOfferings, ...availableUploads.flatMap((upload) => upload.payload.offerings), ...inlineOfferings];

    const plan = generateSchedulePlan({
      programId: input.programId,
      termLabel: input.termLabel,
      transcript: transcriptPayload,
      offerings: mergedOfferings,
      constraints: input.constraints,
      selectedMajor: input.selectedMajor,
      parserWarnings: [
        ...(input.programId === "normandale-cs-transfer-pathway-v1" && !pathwayPayload
          ? ["No pathway PDF was uploaded, so the built-in CS Transfer Pathway rules were used."]
          : []),
        ...(pathwayPayload?.recognized
          ? [
              `Using "${pathwayPayload.title ?? "your program PDF"}" as an extra Normandale reference document.`,
              ...(pathwayPayload.extractedRequirements.length > 0
                ? [`Parsed ${pathwayPayload.extractedRequirements.length} planning requirement${pathwayPayload.extractedRequirements.length === 1 ? "" : "s"} from that document.`]
                : [])
            ]
          : []),
        ...(input.useBuiltInFallCatalog
          ? ["Using the built-in Fall 2026 class list, so subject PDF upload is optional."]
          : []),
        ...(input.useBuiltInFallCatalog && builtInOfferings.length === 0
          ? ["No built-in Fall 2026 catalog was found on this server yet, so upload subject PDFs or seed a catalog file before going live."]
          : []),
        ...(!input.useBuiltInFallCatalog && availableUploads.length === 0
          ? ["No semester subject PDFs were uploaded, so no schedule options could be generated."]
          : [])
      ]
    });

    try {
      await repository.savePlan(input, plan);
    } catch {
      // Ignore non-persistent environments in v1 hosted mode.
    }
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Schedule generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
