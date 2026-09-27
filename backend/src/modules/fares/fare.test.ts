import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../app.js";
import { fareService } from "./fare.service.js";

describe("Phase 4 — Fare Calculation & Zones Tests", () => {
  describe("FareService Integer Poisha Logic (Rule 13 & PRD.md §7)", () => {
    it("should calculate exact reference fare for Nusrat (Banani -> Mohakhali, 4km): 6240 poisha (৳62.40)", () => {
      const fare = fareService.calculateFare("BANANI", "MOHAKHALI", 1, true);

      // Verify integer-only poisha values
      expect(Number.isInteger(fare.baseFarePoisha)).toBe(true);
      expect(Number.isInteger(fare.distanceChargePoisha)).toBe(true);
      expect(Number.isInteger(fare.grossFarePoisha)).toBe(true);
      expect(Number.isInteger(fare.discountPoisha)).toBe(true);
      expect(Number.isInteger(fare.finalFarePoisha)).toBe(true);

      expect(fare.distanceKm).toBe(4.0);
      expect(fare.baseFarePoisha).toBe(3000); // ৳30.00
      expect(fare.distanceChargePoisha).toBe(4800); // 4 * ৳12 = ৳48.00
      expect(fare.grossFarePoisha).toBe(7800); // ৳78.00
      expect(fare.discountPoisha).toBe(1560); // 20% of 7800 = 1560
      expect(fare.finalFarePoisha).toBe(6240); // ৳62.40
      expect(fare.formattedBdt.finalFare).toBe("৳62.40");
    });

    it("should calculate exact reference fare for Rafiq (Banani -> Gulshan 1, 5km): 7200 poisha (৳72.00)", () => {
      const fare = fareService.calculateFare("BANANI", "GULSHAN_1", 1, true);

      expect(fare.distanceKm).toBe(5.0);
      expect(fare.baseFarePoisha).toBe(3000); // ৳30.00
      expect(fare.distanceChargePoisha).toBe(6000); // 5 * ৳12 = ৳60.00
      expect(fare.grossFarePoisha).toBe(9000); // ৳90.00
      expect(fare.discountPoisha).toBe(1800); // 20% of 9000 = 1800
      expect(fare.finalFarePoisha).toBe(7200); // ৳72.00
      expect(fare.formattedBdt.finalFare).toBe("৳72.00");
    });

    it("should reject same origin and destination", () => {
      expect(() => fareService.calculateFare("BANANI", "BANANI", 1, true)).toThrowError(
        "Pickup zone and destination zone cannot be the same"
      );
    });

    it("should reject invalid seat counts (>3 or <=0)", () => {
      expect(() => fareService.calculateFare("BANANI", "MOHAKHALI", 4, true)).toThrowError(
        "Requested seats must be between 1 and 3"
      );
      expect(() => fareService.calculateFare("BANANI", "MOHAKHALI", 0, true)).toThrowError(
        "Requested seats must be between 1 and 3"
      );
    });
  });

  describe("API Endpoints", () => {
    it("GET /api/fares/zones should list predefined Dhaka zones", async () => {
      const response = await request(app).get("/api/fares/zones");
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.zones).toBeInstanceOf(Array);
      expect(response.body.data.zones.length).toBeGreaterThanOrEqual(8);
    });

    it("POST /api/fares/estimate should return structured fare breakdown", async () => {
      const response = await request(app)
        .post("/api/fares/estimate")
        .send({
          pickupZone: "BANANI",
          destinationZone: "MOHAKHALI",
          seatCount: 1,
          isPooled: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.finalFarePoisha).toBe(6240);
      expect(response.body.data.formattedBdt.finalFare).toBe("৳62.40");
    });
  });
});
