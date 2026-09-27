"use client";

import { motion } from "framer-motion";
import { Tag, Navigation } from "lucide-react";
import { FareEstimate } from "@/lib/api";

interface FareBreakdownProps {
  fare: FareEstimate;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

export function FareBreakdown({ fare }: FareBreakdownProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-4 pt-1"
    >
      {/* Route Corridor Info Chip */}
      <motion.div
        variants={itemVariants}
        className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs"
      >
        <span className="flex items-center gap-1.5 text-zinc-400">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Estimated Distance</span>
        </span>
        <span className="font-mono text-zinc-200 font-semibold">{fare.distanceKm} km</span>
      </motion.div>

      {/* Fare Components Breakdown */}
      <div className="space-y-2 text-xs divide-y divide-zinc-800/80">
        <motion.div variants={itemVariants} className="flex justify-between items-center text-zinc-400 pt-1">
          <span>Base Flag Fare</span>
          <span className="font-mono text-zinc-200 font-medium">{fare.formattedBdt.baseFare}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-zinc-400 pt-2">
          <span>Distance Rate</span>
          <span className="font-mono text-zinc-200 font-medium">{fare.formattedBdt.distanceCharge}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-emerald-400 pt-2">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Corridor Pooling Discount (20%)</span>
          </span>
          <span className="font-mono font-semibold">-{fare.formattedBdt.discount}</span>
        </motion.div>
      </div>

      {/* Individual Payable Total Highlight Box */}
      <motion.div
        variants={itemVariants}
        className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 shadow-md shadow-emerald-500/5"
      >
        <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
          Individual Payable Total
        </span>

        <span className="font-mono text-emerald-400 text-lg sm:text-xl font-bold tracking-tight shrink-0">
          {fare.formattedBdt.finalFare}
        </span>
      </motion.div>
    </motion.div>
  );
}

