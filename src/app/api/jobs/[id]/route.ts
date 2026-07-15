import { NextResponse } from "next/server";
import { deleteJob } from "@/server/planner-repository";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return (await deleteJob(id))
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: "Job not found." }, { status: 404 });
}

