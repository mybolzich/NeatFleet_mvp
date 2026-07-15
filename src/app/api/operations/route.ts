import { NextResponse } from "next/server";
import { createVisit, getOperationsState } from "@/server/operations-store";
import type { JobKind, Visit } from "@/domain/models";

export async function GET() {
  return NextResponse.json(getOperationsState());
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Pick<Visit, "customerName" | "address" | "kind" | "serviceMinutes" | "timeWindow" | "priority">>;
  if (!body.customerName || !body.address || !body.kind) {
    return NextResponse.json({ error: "Customer name, address, and job type are required." }, { status: 400 });
  }
  const visit = createVisit({
    customerName: body.customerName,
    address: body.address,
    kind: body.kind as JobKind,
    serviceMinutes: Number(body.serviceMinutes) || 30,
    timeWindow: body.timeWindow ?? { start: "09:00", end: "17:00" },
    priority: body.priority ?? "normal",
  });
  return NextResponse.json(visit, { status: 201 });
}

