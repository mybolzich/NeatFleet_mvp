import { NextResponse } from "next/server";
import { optimizeRoutes } from "@/server/operations-store";

export async function POST() {
  return NextResponse.json(optimizeRoutes());
}

