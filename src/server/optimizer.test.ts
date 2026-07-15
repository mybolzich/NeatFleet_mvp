import { describe, expect, it } from "vitest";
import { optimizerInternals } from "./optimizer";

describe("route optimizer calculations", () => {
  it("calculates zero distance for the same coordinate", () => {
    expect(optimizerInternals.distance({ lat: 14.55, lng: 121.03 }, { lat: 14.55, lng: 121.03 })).toBe(0);
  });
  it("round-trips planner time values", () => {
    expect(optimizerInternals.minutesToTime(optimizerInternals.timeToMinutes("13:45"))).toBe("13:45");
  });
});

