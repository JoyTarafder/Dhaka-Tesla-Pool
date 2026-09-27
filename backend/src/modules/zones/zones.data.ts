// Predefined Dhaka zones and static distance matrix per PRD.md §6

export interface DhakaZone {
  code: string;
  name: string;
  description: string;
}

export const DHAKA_ZONES: DhakaZone[] = [
  { code: "BANANI", name: "Banani", description: "Banani Road 11 & Commercial Area" },
  { code: "GULSHAN_1", name: "Gulshan 1", description: "Gulshan 1 Circle & South Avenue" },
  { code: "GULSHAN_2", name: "Gulshan 2", description: "Gulshan 2 Circle & Diplomatic Zone" },
  { code: "MOHAKHALI", name: "Mohakhali", description: "Mohakhali Wireless & DOHS" },
  { code: "FARMGATE", name: "Farmgate", description: "Farmgate Hub & Khamarbari" },
  { code: "DHANMONDI", name: "Dhanmondi", description: "Dhanmondi Lake & Satmasjid Road" },
  { code: "MIRPUR", name: "Mirpur", description: "Mirpur 10 Circle" },
  { code: "UTTARA", name: "Uttara", description: "Uttara Sector 3 & Airport Road" },
  { code: "BASHUNDHARA", name: "Bashundhara", description: "Bashundhara R/A Gate" },
];

// Symmetric distance matrix in kilometers
// Key: `${origin}-${destination}`
const DISTANCE_MATRIX_KM: Record<string, number> = {
  // Reference scenarios from PRD.md §2 & §7
  "BANANI-MOHAKHALI": 4.0, // Nusrat reference scenario: 4 km
  "BANANI-GULSHAN_1": 5.0, // Rafiq reference scenario: 5 km
  "BANANI-GULSHAN_2": 3.0,
  "BANANI-FARMGATE": 7.0,
  "BANANI-DHANMONDI": 10.0,
  "BANANI-MIRPUR": 11.0,
  "BANANI-UTTARA": 12.0,
  "BANANI-BASHUNDHARA": 8.0,

  "GULSHAN_1-MOHAKHALI": 3.5,
  "GULSHAN_1-GULSHAN_2": 2.5,
  "GULSHAN_1-FARMGATE": 6.5,
  "GULSHAN_1-DHANMONDI": 9.5,
  "GULSHAN_1-BASHUNDHARA": 7.0,

  "MOHAKHALI-FARMGATE": 4.0,
  "MOHAKHALI-DHANMONDI": 7.5,
  "MOHAKHALI-GULSHAN_2": 4.5,
};

// Retrieve pre-calculated distance between two Dhaka zones
export function getZoneDistanceKm(origin: string, destination: string): number {
  if (origin === destination) {
    return 0;
  }

  const key1 = `${origin}-${destination}`;
  const key2 = `${destination}-${origin}`;

  const dist = DISTANCE_MATRIX_KM[key1] ?? DISTANCE_MATRIX_KM[key2];

  // Default fallback if pair not explicitly listed
  return dist ?? 6.0;
}
