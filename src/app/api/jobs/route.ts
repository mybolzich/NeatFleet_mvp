import { NextResponse } from "next/server";
import type { CreateJobInput, JobKind } from "@/domain/models";
import { createJob } from "@/server/planner-repository";

const kinds: JobKind[] = ["service", "delivery", "pickup", "inspection", "installation"];

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateJobInput>;
  if (!body.customerName?.trim() || !body.address?.trim() || !body.kind || !kinds.includes(body.kind)) {
    return NextResponse.json({ error: "Customer, address, and job type are required." }, { status: 400 });
  }
  const serviceMinutes = Number(body.serviceMinutes);
  if (!Number.isFinite(serviceMinutes) || serviceMinutes < 5 || serviceMinutes > 480) {
    return NextResponse.json({ error: "Service time must be between 5 and 480 minutes." }, { status: 400 });
  }
  const input: CreateJobInput = {
    customerName: body.customerName.trim(), address: body.address.trim(), kind: body.kind,
    serviceMinutes, timeWindow: body.timeWindow ?? { start: "09:00", end: "17:00" },
    priority: body.priority ?? "normal",
  };
  try {
    return NextResponse.json(await createJob(input), { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "The job could not be created." }, { status: 500 });
  }
}

