import { NextResponse } from "next/server";
import { optimizeRoutes } from "@/server/optimizer";
import { getPlannerSnapshot } from "@/server/planner-repository";

export async function POST() {
  try {
    await optimizeRoutes();
    return NextResponse.json(await getPlannerSnapshot());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Routes could not be optimized.";
    return NextResponse.json({ error: message }, { status: message.startsWith("Dispatched") ? 409 : 500 });
  }
}

