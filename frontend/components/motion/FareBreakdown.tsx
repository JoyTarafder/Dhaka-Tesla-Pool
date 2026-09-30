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
      className="space-y-3.5 pt-1"
    >
      {/* Route Corridor Info Chip */}
      <motion.div
        variants={itemVariants}
        className="p-3 rounded-xl bg-white/60 border border-[#d4d8ee] flex items-center justify-between text-xs shadow-sm"
      >
        <span className="flex items-center gap-2 text-ink-muted">
          <Navigation className="w-3.5 h-3.5 text-accent" />
          <span>Estimated Trip Distance</span>
        </span>
        <span className="font-mono text-ink font-semibold px-2 py-0.5 rounded-md bg-[#eef0fb] border border-[#d4d8ee]">
          {fare.distanceKm} km
        </span>
      </motion.div>

      {/* Fare Components Breakdown */}
      <div className="space-y-2.5 text-xs divide-y divide-[#d4d8ee]/60 p-3.5 rounded-xl bg-white/70 border border-[#d4d8ee] shadow-sm">
        <motion.div variants={itemVariants} className="flex justify-between items-center text-ink-muted pt-0.5">
          <span>Base Flag Fare</span>
          <span className="font-mono text-ink font-semibold">{fare.formattedBdt.baseFare}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-ink-muted pt-2.5">
          <span>Distance Rate Charge</span>
          <span className="font-mono text-ink font-semibold">{fare.formattedBdt.distanceCharge}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-success pt-2.5">
          <span className="flex items-center gap-1.5 font-medium">
            <Tag className="w-3.5 h-3.5" />
            <span>Corridor Pooling Discount (20%)</span>
          </span>
          <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-success-soft border border-success/30 text-success">
            -{fare.formattedBdt.discount}
          </span>
        </motion.div>
      </div>

      {/* Individual Payable Total Highlight Box */}
      <motion.div
        variants={itemVariants}
        className="p-4 rounded-xl bg-accent-soft/70 border border-accent/30 flex items-center justify-between gap-3 shadow-md relative overflow-hidden"
      >
        <div className="space-y-0.5">
          <span className="text-xs sm:text-sm font-bold text-ink block">
            Individual Payable Total
          </span>
          <span className="text-[11px] text-ink-muted block">
            Guaranteed whole-number fare
          </span>
        </div>

        <span className="font-mono text-accent text-xl sm:text-2xl font-black tracking-tight shrink-0 drop-shadow-sm">
          {fare.formattedBdt.finalFare}
        </span>
      </motion.div>
    </motion.div>
  );
}

