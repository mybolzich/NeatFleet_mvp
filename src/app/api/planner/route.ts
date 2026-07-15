import { NextResponse } from "next/server";
import { getPlannerSnapshot } from "@/server/planner-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getPlannerSnapshot());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The planner database is unavailable." }, { status: 503 });
  }
}

