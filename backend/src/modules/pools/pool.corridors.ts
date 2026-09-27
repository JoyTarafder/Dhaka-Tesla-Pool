// Dhaka corridor definitions for pooling compatibility per PRD.md §6

export interface RouteCorridor {
  code: string;
  name: string;
  pickupZone: string;
  compatibleDestinations: string[];
}

export const ROUTE_CORRIDORS: RouteCorridor[] = [
  {
    code: "CORRIDOR_BANANI_SOUTH",
    name: "Banani to Mohakhali / Gulshan Corridor",
    pickupZone: "BANANI",
    compatibleDestinations: ["MOHAKHALI", "GULSHAN_1", "GULSHAN_2"],
  },
  {
    code: "CORRIDOR_GULSHAN_WEST",
    name: "Gulshan to Mohakhali / Farmgate Corridor",
    pickupZone: "GULSHAN_1",
    compatibleDestinations: ["MOHAKHALI", "FARMGATE", "GULSHAN_2"],
  },
  {
    code: "CORRIDOR_MOHAKHALI_CENTRAL",
    name: "Mohakhali to Farmgate / Dhanmondi Corridor",
    pickupZone: "MOHAKHALI",
    compatibleDestinations: ["FARMGATE", "DHANMONDI"],
  },
];

// Determine if a ride request's pickup and destination are compatible with a corridor
export function findMatchingCorridor(pickupZone: string, destinationZone: string): RouteCorridor | null {
  const corridor = ROUTE_CORRIDORS.find(
    (c) => c.pickupZone === pickupZone && c.compatibleDestinations.includes(destinationZone)
  );

  return corridor ?? null;
}
