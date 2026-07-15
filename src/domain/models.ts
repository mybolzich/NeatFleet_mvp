export type JobKind = "service" | "delivery" | "pickup" | "inspection" | "installation";
export type JobStatus = "unassigned" | "planned" | "in_progress" | "completed" | "exception";
export type RouteStatus = "draft" | "ready" | "dispatched" | "active" | "completed";

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Visit {
  id: string;
  jobId: string;
  kind: JobKind;
  customerName: string;
  address: string;
  location: Coordinate;
  serviceMinutes: number;
  timeWindow: { start: string; end: string };
  requiredSkills: string[];
  demand: { units: number };
  priority: "normal" | "high" | "urgent";
  status: JobStatus;
}

export interface Worker {
  id: string;
  name: string;
  initials: string;
  skills: string[];
  shift: { start: string; end: string };
}

export interface Vehicle {
  id: string;
  label: string;
  capacity: { units: number };
}

export interface PlannedStop {
  visitId: string;
  sequence: number;
  eta: string;
  travelMinutes: number;
}

export interface Route {
  id: string;
  label: string;
  workerId: string;
  vehicleId: string;
  color: string;
  status: RouteStatus;
  stops: PlannedStop[];
  totalDistanceKm: number;
  totalMinutes: number;
}

export interface RouteSummary {
  stopCount: number;
  totalDistanceKm: number;
  totalMinutes: number;
  utilizationPercent: number;
}

export interface PlannerSnapshot {
  visits: Visit[];
  workers: Worker[];
  vehicles: Vehicle[];
  routes: Route[];
}

export interface CreateJobInput {
  kind: JobKind;
  customerName: string;
  address: string;
  serviceMinutes: number;
  timeWindow: { start: string; end: string };
  priority: Visit["priority"];
}

export function summarizeRoute(route: Route, visits: Visit[], vehicle: Vehicle): RouteSummary {
  const visitById = new Map(visits.map((visit) => [visit.id, visit]));
  const usedUnits = route.stops.reduce(
    (total, stop) => total + (visitById.get(stop.visitId)?.demand.units ?? 0),
    0,
  );

  return {
    stopCount: route.stops.length,
    totalDistanceKm: route.totalDistanceKm,
    totalMinutes: route.totalMinutes,
    utilizationPercent: vehicle.capacity.units
      ? Math.round((usedUnits / vehicle.capacity.units) * 100)
      : 0,
  };
}
