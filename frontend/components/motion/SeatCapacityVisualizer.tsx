"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface SeatCapacityVisualizerProps {
  totalCapacity?: number;
  occupiedSeats: number;
}

export function SeatCapacityVisualizer({
  totalCapacity = 3,
  occupiedSeats,
}: SeatCapacityVisualizerProps) {
  // Generate array representing each seat's occupancy status
  const seats = Array.from({ length: totalCapacity }, (_, i) => i < occupiedSeats);

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <div className="flex items-center gap-2.5">
        {seats.map((isOccupied, index) => (
          <motion.div
            key={index}
            layout
            initial={false}
            animate={{
              scale: isOccupied ? [1, 1.14, 1] : 1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold border transition-all duration-300 relative ${
              isOccupied
                ? "bg-accent border-accent text-white shadow-[0_4px_16px_rgba(59,130,246,0.35)]"
                : "bg-white/80 border-[#d4d8ee] text-ink-muted hover:border-accent/40"
            }`}
            title={`Seat ${index + 1}: ${isOccupied ? "Occupied" : "Available"}`}
          >
            <span className="font-mono text-xs font-extrabold">S{index + 1}</span>
            <span className={`text-[9px] font-semibold tracking-tighter ${isOccupied ? "text-white/90" : "text-ink-muted/80"}`}>
              {isOccupied ? "BOOKED" : "OPEN"}
            </span>
            {isOccupied && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent border-2 border-white" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="pl-1 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border ${
          occupiedSeats === totalCapacity
            ? "bg-danger/10 border-danger/30 text-danger"
            : occupiedSeats > 0
            ? "bg-accent-soft border-accent/30 text-accent"
            : "bg-white/60 border-[#d4d8ee] text-ink-muted"
        }`}>
          {occupiedSeats === totalCapacity ? "Full Capacity (3/3)" : `${occupiedSeats} / ${totalCapacity} Booked`}
        </span>
      </div>
    </div>
  );
}
