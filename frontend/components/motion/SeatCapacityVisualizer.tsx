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
              scale: isOccupied ? [1, 1.12, 1] : 1,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold border transition-all duration-300 relative ${
              isOccupied
                ? "bg-gradient-to-b from-emerald-300 to-emerald-400 border-emerald-300 text-zinc-950 shadow-[0_0_18px_rgba(52,211,153,0.35)]"
                : "bg-zinc-900/80 border-white/[0.08] text-zinc-500 hover:border-zinc-700"
            }`}
            title={`Seat ${index + 1}: ${isOccupied ? "Occupied" : "Available"}`}
          >
            <span className="font-mono text-xs font-extrabold">S{index + 1}</span>
            <span className={`text-[9px] font-semibold tracking-tighter ${isOccupied ? "text-zinc-900/80" : "text-zinc-600"}`}>
              {isOccupied ? "BOOKED" : "OPEN"}
            </span>
            {isOccupied && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 border-2 border-zinc-950" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="pl-1 flex items-center gap-2">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border ${
          occupiedSeats === totalCapacity
            ? "bg-red-500/10 border-red-500/25 text-red-400"
            : occupiedSeats > 0
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
            : "bg-zinc-800/80 border-zinc-700 text-zinc-400"
        }`}>
          {occupiedSeats === totalCapacity ? "Full Capacity" : `${occupiedSeats} / ${totalCapacity} Booked`}
        </span>
      </div>
    </div>
  );
}
