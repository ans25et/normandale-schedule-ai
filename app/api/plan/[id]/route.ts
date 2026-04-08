import { NextResponse } from "next/server";

import { getRepository } from "@/lib/storage/memory-repository";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const plan = await getRepository().getPlan(params.id);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  return NextResponse.json(plan);
}
