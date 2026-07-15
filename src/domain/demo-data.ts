import type { Route, Vehicle, Visit, Worker } from "./models";

export const visits: Visit[] = [
  { id: "v-101", jobId: "NF-2401", kind: "service", customerName: "Luna Dental Studio", address: "Salcedo Village, Makati", location: { lat: 14.5586, lng: 121.0216 }, serviceMinutes: 45, timeWindow: { start: "09:00", end: "11:00" }, requiredSkills: ["equipment"], demand: { units: 2 }, priority: "urgent", status: "unassigned" },
  { id: "v-102", jobId: "NF-2402", kind: "inspection", customerName: "Maven Coffee Roasters", address: "Legazpi Village, Makati", location: { lat: 14.5534, lng: 121.0171 }, serviceMinutes: 30, timeWindow: { start: "10:00", end: "13:00" }, requiredSkills: ["inspection"], demand: { units: 1 }, priority: "normal", status: "unassigned" },
  { id: "v-103", jobId: "NF-2403", kind: "installation", customerName: "Northpoint Offices", address: "BGC, Taguig", location: { lat: 14.5515, lng: 121.0482 }, serviceMinutes: 90, timeWindow: { start: "13:00", end: "16:00" }, requiredSkills: ["installation"], demand: { units: 4 }, priority: "high", status: "unassigned" },
  { id: "v-104", jobId: "NF-2397", kind: "service", customerName: "Harbor Wellness", address: "Rockwell Center, Makati", location: { lat: 14.5652, lng: 121.0369 }, serviceMinutes: 40, timeWindow: { start: "08:30", end: "10:30" }, requiredSkills: ["maintenance"], demand: { units: 2 }, priority: "normal", status: "planned" },
  { id: "v-105", jobId: "NF-2398", kind: "delivery", customerName: "Aster Home", address: "Poblacion, Makati", location: { lat: 14.5658, lng: 121.0296 }, serviceMinutes: 15, timeWindow: { start: "10:00", end: "12:00" }, requiredSkills: [], demand: { units: 3 }, priority: "normal", status: "planned" },
  { id: "v-106", jobId: "NF-2399", kind: "inspection", customerName: "Common Ground", address: "Uptown, BGC", location: { lat: 14.5565, lng: 121.0537 }, serviceMinutes: 35, timeWindow: { start: "09:00", end: "12:00" }, requiredSkills: ["inspection"], demand: { units: 1 }, priority: "high", status: "planned" },
  { id: "v-107", jobId: "NF-2400", kind: "pickup", customerName: "Sora Kitchen", address: "Kapitolyo, Pasig", location: { lat: 14.5732, lng: 121.0594 }, serviceMinutes: 20, timeWindow: { start: "11:30", end: "14:30" }, requiredSkills: [], demand: { units: 2 }, priority: "normal", status: "planned" },
];

export const workers: Worker[] = [
  { id: "w-1", name: "Mika Santos", initials: "MS", skills: ["maintenance", "equipment"], shift: { start: "08:00", end: "17:00" } },
  { id: "w-2", name: "Paolo Reyes", initials: "PR", skills: ["inspection", "installation"], shift: { start: "08:30", end: "17:30" } },
];

export const vehicles: Vehicle[] = [
  { id: "veh-1", label: "Van 04", capacity: { units: 12 } },
  { id: "veh-2", label: "Van 07", capacity: { units: 10 } },
];

export const routes: Route[] = [
  { id: "r-1", label: "Central AM", workerId: "w-1", vehicleId: "veh-1", color: "#186b58", status: "ready", stops: [{ visitId: "v-104", sequence: 1, eta: "08:42", travelMinutes: 18 }, { visitId: "v-105", sequence: 2, eta: "09:38", travelMinutes: 16 }], totalDistanceKm: 18.4, totalMinutes: 146 },
  { id: "r-2", label: "East Loop", workerId: "w-2", vehicleId: "veh-2", color: "#e06b3c", status: "draft", stops: [{ visitId: "v-106", sequence: 1, eta: "09:04", travelMinutes: 24 }, { visitId: "v-107", sequence: 2, eta: "10:08", travelMinutes: 29 }], totalDistanceKm: 24.7, totalMinutes: 177 },
];

