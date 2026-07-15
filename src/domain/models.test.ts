import { describe, expect, it } from "vitest";
import { routes, vehicles, visits } from "./demo-data";
import { summarizeRoute } from "./models";

describe("summarizeRoute", () => {
  it("calculates stop count and vehicle utilization", () => {
    expect(summarizeRoute(routes[0], visits, vehicles[0])).toEqual({
      stopCount: 2,
      totalDistanceKm: 18.4,
      totalMinutes: 146,
      utilizationPercent: 42,
    });
  });

  it("keeps the domain flexible across job types", () => {
    expect(new Set(visits.map((visit) => visit.kind))).toEqual(
      new Set(["service", "inspection", "installation", "delivery", "pickup"]),
    );
  });
});

