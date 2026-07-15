import { NextResponse } from "next/server";
import { setRouteStatus } from "@/server/operations-store";

export async function POST(request: Request) {
  const { routeId } = (await request.json()) as { routeId?: string };
  if (!routeId) return NextResponse.json({ error: "A route is required." }, { status: 400 });
  try {
    return NextResponse.json(setRouteStatus(routeId, "dispatched"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Dispatch failed." }, { status: 404 });
  }
}

