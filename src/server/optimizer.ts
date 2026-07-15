import type { Route, Visit, Worker } from "@/domain/models";
import { ensureDatabase, pool } from "./db";
import { getPlannerSnapshot } from "./planner-repository";

const depot = { lat: 14.5547, lng: 121.0346 };

export async function optimizeRoutes() {
  await ensureDatabase();
  const snapshot = await getPlannerSnapshot();
  if (snapshot.routes.some((route) => route.status === "dispatched" || route.status === "active")) {
    throw new Error("Dispatched routes are locked. Complete or recall them before optimizing again.");
  }

  const assigned = new Map<string, Visit[]>();
  snapshot.routes.forEach((route) => assigned.set(route.id, []));
  const orderedJobs = [...snapshot.visits].sort((a, b) =>
    priorityRank(b.priority) - priorityRank(a.priority) || a.timeWindow.start.localeCompare(b.timeWindow.start),
  );

  for (const job of orderedJobs) {
    const compatible = snapshot.routes.filter((route) => {
      const worker = snapshot.workers.find((item) => item.id === route.workerId)!;
      return job.requiredSkills.every((skill) => worker.skills.includes(skill));
    });
    const choices = compatible.length ? compatible : snapshot.routes;
    const route = choices.sort((a, b) => routeLoad(a, assigned, snapshot.visits) - routeLoad(b, assigned, snapshot.visits))[0];
    assigned.get(route.id)!.push(job);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM route_stops");
    for (const route of snapshot.routes) {
      const worker = snapshot.workers.find((item) => item.id === route.workerId)!;
      const plan = buildRoutePlan(assigned.get(route.id)!, worker);
      for (const stop of plan.stops) {
        await client.query(
          "INSERT INTO route_stops (route_id, visit_id, sequence, eta, travel_minutes) VALUES ($1,$2,$3,$4,$5)",
          [route.id, stop.visitId, stop.sequence, stop.eta, stop.travelMinutes],
        );
      }
      await client.query(
        "UPDATE routes SET status = 'ready', total_distance_km = $2, total_minutes = $3, updated_at = NOW() WHERE id = $1",
        [route.id, plan.distanceKm, plan.totalMinutes],
      );
    }
    await client.query("UPDATE jobs SET status = 'planned'");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function buildRoutePlan(jobs: Visit[], worker: Worker) {
  const remaining = [...jobs];
  const ordered: Visit[] = [];
  let point = depot;
  while (remaining.length) {
    remaining.sort((a, b) => distance(point, a.location) - distance(point, b.location));
    const next = remaining.shift()!;
    ordered.push(next);
    point = next.location;
  }

  let clock = timeToMinutes(worker.shift.start);
  let distanceKm = 0;
  point = depot;
  const stops = ordered.map((job, index) => {
    const leg = distance(point, job.location);
    const travelMinutes = Math.max(4, Math.round((leg / 25) * 60));
    distanceKm += leg;
    clock = Math.max(clock + travelMinutes, timeToMinutes(job.timeWindow.start));
    const eta = minutesToTime(clock);
    clock += job.serviceMinutes;
    point = job.location;
    return { visitId: job.id, sequence: index + 1, eta, travelMinutes };
  });
  const returnKm = ordered.length ? distance(point, depot) : 0;
  distanceKm += returnKm;
  clock += Math.round((returnKm / 25) * 60);
  return { stops, distanceKm: Math.round(distanceKm * 10) / 10, totalMinutes: Math.max(0, clock - timeToMinutes(worker.shift.start)) };
}

function routeLoad(route: Route, assigned: Map<string, Visit[]>, allJobs: Visit[]) {
  const jobs = assigned.get(route.id) ?? [];
  return jobs.reduce((sum, job) => sum + job.serviceMinutes + job.demand.units * 8, 0) + allJobs.length * 0;
}

function priorityRank(priority: Visit["priority"]) { return { normal: 0, high: 1, urgent: 2 }[priority]; }
function timeToMinutes(time: string) { const [hours, minutes] = time.split(":").map(Number); return hours * 60 + minutes; }
function minutesToTime(value: number) { const normalized = value % 1440; return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`; }
function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180; const earthKm = 6371;
  const dLat = (b.lat - a.lat) * rad; const dLng = (b.lng - a.lng) * rad;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return earthKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export const optimizerInternals = { distance, timeToMinutes, minutesToTime };

