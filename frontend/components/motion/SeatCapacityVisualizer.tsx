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
    <div className="flex items-center gap-3">
      {seats.map((isOccupied, index) => (
        <motion.div
          key={index}
          layout
          initial={false}
          animate={{
            scale: isOccupied ? [1, 1.15, 1] : 1,
            backgroundColor: isOccupied ? "#34d399" : "#27272a",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border transition-colors shadow-sm ${
            isOccupied
              ? "border-emerald-400 text-black shadow-emerald-500/20"
              : "border-zinc-700/60 text-zinc-500"
          }`}
          title={`Seat ${index + 1}: ${isOccupied ? "Occupied" : "Available"}`}
        >
          <span className="font-mono">{index + 1}</span>
        </motion.div>
      ))}

      <div className="ml-2 text-xs text-zinc-400">
        <span className="font-bold text-white text-sm">{occupiedSeats}</span>
        <span className="text-zinc-500"> / {totalCapacity} Booked</span>
      </div>
    </div>
  );
}
