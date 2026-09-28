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
        className="p-3 rounded-xl bg-zinc-900/70 border border-white/[0.06] flex items-center justify-between text-xs"
      >
        <span className="flex items-center gap-2 text-zinc-400">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Estimated Trip Distance</span>
        </span>
        <span className="font-mono text-zinc-200 font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60">
          {fare.distanceKm} km
        </span>
      </motion.div>

      {/* Fare Components Breakdown */}
      <div className="space-y-2.5 text-xs divide-y divide-white/[0.05] p-3 rounded-xl bg-zinc-900/40 border border-white/[0.04]">
        <motion.div variants={itemVariants} className="flex justify-between items-center text-zinc-400 pt-0.5">
          <span>Base Flag Fare</span>
          <span className="font-mono text-zinc-200 font-semibold">{fare.formattedBdt.baseFare}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-zinc-400 pt-2.5">
          <span>Distance Rate Charge</span>
          <span className="font-mono text-zinc-200 font-semibold">{fare.formattedBdt.distanceCharge}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-emerald-400 pt-2.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Tag className="w-3.5 h-3.5" />
            <span>Corridor Pooling Discount (20%)</span>
          </span>
          <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
            -{fare.formattedBdt.discount}
          </span>
        </motion.div>
      </div>

      {/* Individual Payable Total Highlight Box */}
      <motion.div
        variants={itemVariants}
        className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5 relative overflow-hidden"
      >
        <div className="space-y-0.5">
          <span className="text-xs sm:text-sm font-bold text-white block">
            Individual Payable Total
          </span>
          <span className="text-[11px] text-zinc-400 block">
            Guaranteed whole-number fare
          </span>
        </div>

        <span className="font-mono text-emerald-400 text-xl sm:text-2xl font-black tracking-tight shrink-0 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
          {fare.formattedBdt.finalFare}
        </span>
      </motion.div>
    </motion.div>
  );
}

