import { NextResponse } from "next/server";

import { getBuiltInFallCatalogOfferings } from "@/lib/catalog/fall-catalog";
import { generateSchedulePlan } from "@/lib/planner/scheduler";
import { getRepository } from "@/lib/storage/memory-repository";
import type { CourseSearchParseResult, PathwayParseResult, PlanInput, TranscriptParseResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as PlanInput;
    const repository = getRepository();

    const transcript = await repository.getUpload<TranscriptParseResult>(input.transcriptDocumentId);
    if (!transcript) {
      return NextResponse.json({ error: "Transcript upload was not found for this session." }, { status: 404 });
    }

    const pathway = input.pathwayDocumentId
      ? await repository.getUpload<PathwayParseResult>(input.pathwayDocumentId)
      : undefined;

    const courseSearchUploads = await Promise.all(
      input.courseSearchDocumentIds.map((documentId) => repository.getUpload<CourseSearchParseResult>(documentId))
    );
    const availableUploads = courseSearchUploads.filter(
      (upload): upload is NonNullable<typeof upload> => Boolean(upload)
    );
    const builtInOfferings = input.useBuiltInFallCatalog ? await getBuiltInFallCatalogOfferings() : [];
    const mergedOfferings = [...builtInOfferings, ...availableUploads.flatMap((upload) => upload.payload.offerings)];

    const plan = generateSchedulePlan({
      programId: input.programId,
      termLabel: input.termLabel,
      transcript: transcript.payload,
      offerings: mergedOfferings,
      constraints: input.constraints,
      selectedMajor: input.selectedMajor,
      parserWarnings: [
        ...(input.programId === "normandale-cs-transfer-pathway-v1" && !pathway
          ? ["No pathway PDF was uploaded, so the built-in CS Transfer Pathway rules were used."]
          : []),
        ...(pathway?.payload.recognized
          ? [
              `Using "${pathway.payload.title ?? "your program PDF"}" as an extra Normandale reference document.`,
              ...(pathway.payload.extractedRequirements.length > 0
                ? [`Parsed ${pathway.payload.extractedRequirements.length} planning requirement${pathway.payload.extractedRequirements.length === 1 ? "" : "s"} from that document.`]
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

    await repository.savePlan(input, plan);
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Schedule generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
