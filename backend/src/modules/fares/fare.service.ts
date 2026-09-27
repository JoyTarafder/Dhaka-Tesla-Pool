import { getZoneDistanceKm } from "../zones/zones.data.js";
import { AppError } from "../../middleware/errorHandler.js";

// Fare parameters stored in integer poisha (Rule 13)
// ৳1 = 100 poisha
const BASE_FARE_POISHA = 3000; // ৳30.00
const PER_KM_RATE_POISHA = 1200; // ৳12.00 per km
const POOL_DISCOUNT_PERCENT = 20; // 20% discount for sharing Bullet

export interface FareCalculationResult {
  pickupZone: string;
  destinationZone: string;
  distanceKm: number;
  seatCount: number;
  baseFarePoisha: number;
  distanceChargePoisha: number;
  grossFarePoisha: number;
  discountPoisha: number;
  finalFarePoisha: number;
  formattedBdt: {
    baseFare: string;
    distanceCharge: string;
    grossFare: string;
    discount: string;
    finalFare: string;
  };
}

export class FareService {
  // Convert integer poisha to human-readable BDT string
  public formatPoisha(poisha: number): string {
    return `৳${(poisha / 100).toFixed(2)}`;
  }

  // Calculate fare breakdown in integer poisha (PRD.md §7)
  public calculateFare(
    pickupZone: string,
    destinationZone: string,
    seatCount: number = 1,
    isPooled: boolean = true
  ): FareCalculationResult {
    if (pickupZone === destinationZone) {
      throw new AppError("Pickup zone and destination zone cannot be the same", 400, "SAME_ZONE_ERROR");
    }

    if (seatCount <= 0 || seatCount > 3) {
      throw new AppError("Requested seats must be between 1 and 3", 400, "INVALID_SEAT_COUNT");
    }

    const distanceKm = getZoneDistanceKm(pickupZone, destinationZone);

    // Rule 13: All seat/fare arithmetic is integer-only poisha
    const baseFarePoisha = BASE_FARE_POISHA * seatCount;
    const distanceChargePoisha = Math.round(distanceKm * PER_KM_RATE_POISHA * seatCount);
    const grossFarePoisha = baseFarePoisha + distanceChargePoisha;

    // 20% discount when pooled
    const discountPoisha = isPooled
      ? Math.round((grossFarePoisha * POOL_DISCOUNT_PERCENT) / 100)
      : 0;

    const finalFarePoisha = grossFarePoisha - discountPoisha;

    return {
      pickupZone,
      destinationZone,
      distanceKm,
      seatCount,
      baseFarePoisha,
      distanceChargePoisha,
      grossFarePoisha,
      discountPoisha,
      finalFarePoisha,
      formattedBdt: {
        baseFare: this.formatPoisha(baseFarePoisha),
        distanceCharge: this.formatPoisha(distanceChargePoisha),
        grossFare: this.formatPoisha(grossFarePoisha),
        discount: this.formatPoisha(discountPoisha),
        finalFare: this.formatPoisha(finalFarePoisha),
      },
    };
  }
}

export const fareService = new FareService();
