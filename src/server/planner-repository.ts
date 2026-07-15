import { randomUUID } from "node:crypto";
import type { CreateJobInput, PlannerSnapshot, Route, Vehicle, Visit, Worker } from "@/domain/models";
import { ensureDatabase, pool } from "./db";

type JobRow = {
  id: string; job_code: string; kind: Visit["kind"]; customer_name: string; address: string;
  lat: number; lng: number; service_minutes: number; window_start: string; window_end: string;
  required_skills: string[]; demand_units: number; priority: Visit["priority"]; status: Visit["status"];
};

export async function getPlannerSnapshot(): Promise<PlannerSnapshot> {
  await ensureDatabase();
  const [jobsResult, workersResult, vehiclesResult, routesResult, stopsResult] = await Promise.all([
    pool.query<JobRow>("SELECT * FROM jobs ORDER BY created_at, job_code"),
    pool.query("SELECT * FROM workers ORDER BY name"), pool.query("SELECT * FROM vehicles ORDER BY label"),
    pool.query("SELECT * FROM routes ORDER BY id"), pool.query("SELECT * FROM route_stops ORDER BY route_id, sequence"),
  ]);
  const visits = jobsResult.rows.map(mapJob);
  const workers: Worker[] = workersResult.rows.map((row) => ({ id: row.id, name: row.name, initials: row.initials, skills: row.skills, shift: { start: row.shift_start, end: row.shift_end } }));
  const vehicles: Vehicle[] = vehiclesResult.rows.map((row) => ({ id: row.id, label: row.label, capacity: { units: row.capacity_units } }));
  const routes: Route[] = routesResult.rows.map((row) => ({
    id: row.id, label: row.label, workerId: row.worker_id, vehicleId: row.vehicle_id,
    color: row.color, status: row.status, totalDistanceKm: Number(row.total_distance_km), totalMinutes: row.total_minutes,
    stops: stopsResult.rows.filter((stop) => stop.route_id === row.id).map((stop) => ({ visitId: stop.visit_id, sequence: stop.sequence, eta: stop.eta, travelMinutes: stop.travel_minutes })),
  }));
  return { visits, workers, vehicles, routes };
}

export async function createJob(input: CreateJobInput) {
  await ensureDatabase();
  const id = `v-${randomUUID().slice(0, 8)}`;
  const count = await pool.query<{ next_code: number }>("SELECT COALESCE(MAX(SUBSTRING(job_code FROM 4)::INTEGER), 2400) + 1 AS next_code FROM jobs");
  const point = generatedCoordinate(input.address);
  const result = await pool.query<JobRow>(`
    INSERT INTO jobs (id, job_code, kind, customer_name, address, lat, lng, service_minutes, window_start, window_end, required_skills, demand_units, priority, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,ARRAY[]::TEXT[],1,$11,'unassigned') RETURNING *
  `, [id, `NF-${count.rows[0].next_code}`, input.kind, input.customerName, input.address, point.lat, point.lng, input.serviceMinutes, input.timeWindow.start, input.timeWindow.end, input.priority]);
  return mapJob(result.rows[0]);
}

export async function deleteJob(id: string) {
  await ensureDatabase();
  return (await pool.query("DELETE FROM jobs WHERE id = $1 RETURNING id", [id])).rowCount === 1;
}

export async function dispatchRoute(id: string) {
  await ensureDatabase();
  return (await pool.query("UPDATE routes SET status = 'dispatched', updated_at = NOW() WHERE id = $1 AND status IN ('draft','ready') RETURNING id", [id])).rowCount === 1;
}

function mapJob(row: JobRow): Visit {
  return { id: row.id, jobId: row.job_code, kind: row.kind, customerName: row.customer_name, address: row.address,
    location: { lat: row.lat, lng: row.lng }, serviceMinutes: row.service_minutes,
    timeWindow: { start: row.window_start, end: row.window_end }, requiredSkills: row.required_skills,
    demand: { units: row.demand_units }, priority: row.priority, status: row.status };
}

function generatedCoordinate(seed: string) {
  const value = [...seed].reduce((total, character) => total + character.charCodeAt(0), 0);
  return { lat: 14.545 + (value % 240) / 10000, lng: 121.015 + (value % 360) / 10000 };
}

