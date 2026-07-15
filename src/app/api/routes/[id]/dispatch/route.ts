import { NextResponse } from "next/server";
import { dispatchRoute } from "@/server/planner-repository";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return (await dispatchRoute(id))
    ? NextResponse.json({ status: "dispatched" })
    : NextResponse.json({ error: "This route cannot be dispatched." }, { status: 409 });
}

