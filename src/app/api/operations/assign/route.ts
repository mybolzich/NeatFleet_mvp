import { NextResponse } from "next/server";
import { assignVisit } from "@/server/operations-store";

export async function POST(request: Request) {
  const { visitId, routeId } = (await request.json()) as { visitId?: string; routeId?: string };
  if (!visitId || !routeId) return NextResponse.json({ error: "A job and route are required." }, { status: 400 });
  try {
    return NextResponse.json(assignVisit(visitId, routeId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Assignment failed." }, { status: 404 });
  }
}

