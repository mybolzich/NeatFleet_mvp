import { routes as seedRoutes, vehicles, visits as seedVisits, workers } from "@/domain/demo-data";
import type { Route, RouteStatus, Visit } from "@/domain/models";

type OperationsState = { visits: Visit[]; routes: Route[] };

const globalStore = globalThis as typeof globalThis & { __neatfleetOperations?: OperationsState };

function createInitialState(): OperationsState {
  return {
    visits: structuredClone(seedVisits),
    routes: structuredClone(seedRoutes),
  };
}

export function getOperationsState(): OperationsState {
  globalStore.__neatfleetOperations ??= createInitialState();
  return globalStore.__neatfleetOperations;
}

export function createVisit(input: Pick<Visit, "customerName" | "address" | "kind" | "serviceMinutes" | "timeWindow" | "priority">): Visit {
  const state = getOperationsState();
  const visit: Visit = {
    id: `v-${Date.now()}`,
    jobId: `NF-${String(2404 + state.visits.length).padStart(4, "0")}`,
    customerName: input.customerName,
    address: input.address,
    kind: input.kind,
    location: { lat: 14.56, lng: 121.03 },
    serviceMinutes: input.serviceMinutes,
    timeWindow: input.timeWindow,
    requiredSkills: [],
    demand: { units: 1 },
    priority: input.priority,
    status: "unassigned",
  };
  state.visits.push(visit);
  return visit;
}

export function assignVisit(visitId: string, routeId: string): Route {
  const state = getOperationsState();
  const route = state.routes.find((item) => item.id === routeId);
  const visit = state.visits.find((item) => item.id === visitId);
  if (!route || !visit) throw new Error("The job or route could not be found.");
  if (route.stops.some((stop) => stop.visitId === visitId)) return route;
  route.stops.push({ visitId, sequence: route.stops.length + 1, eta: "11:30", travelMinutes: 18 });
  route.totalDistanceKm = Number((route.totalDistanceKm + 5.4).toFixed(1));
  route.totalMinutes += visit.serviceMinutes + 18;
  visit.status = "planned";
  return route;
}

export function optimizeRoutes(): { routes: Route[]; assignedVisitIds: string[]; message: string } {
  const state = getOperationsState();
  const unassigned = state.visits.filter((visit) => visit.status === "unassigned");
  const openRoutes = state.routes.filter((route) => route.status !== "completed");
  unassigned.forEach((visit, index) => {
    const route = openRoutes[index % openRoutes.length];
    assignVisit(visit.id, route.id);
  });
  return {
    routes: state.routes,
    assignedVisitIds: unassigned.map((visit) => visit.id),
    message: unassigned.length ? `${unassigned.length} jobs assigned across ${openRoutes.length} routes.` : "All jobs are already assigned.",
  };
}

export function setRouteStatus(routeId: string, status: RouteStatus): Route {
  const state = getOperationsState();
  const route = state.routes.find((item) => item.id === routeId);
  if (!route) throw new Error("The route could not be found.");
  route.status = status;
  route.stops.forEach((stop) => {
    const visit = state.visits.find((item) => item.id === stop.visitId);
    if (visit && status === "dispatched") visit.status = "planned";
  });
  return route;
}

export { vehicles, workers };

