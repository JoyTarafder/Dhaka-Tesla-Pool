"use client";

import { motion } from "framer-motion";
import { Tag } from "lucide-react";
import { FareEstimate } from "@/lib/api";

interface FareBreakdownProps {
  fare: FareEstimate;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export function FareBreakdown({ fare }: FareBreakdownProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-3 pt-3"
    >
      <div className="space-y-2 text-xs divide-y divide-zinc-800/80">
        <motion.div variants={itemVariants} className="flex justify-between items-center text-zinc-400 pt-1">
          <span>Base Flag Fare</span>
          <span className="font-mono text-zinc-200">{fare.formattedBdt.baseFare}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-zinc-400 pt-2">
          <span>Distance Rate</span>
          <span className="font-mono text-zinc-200">{fare.formattedBdt.distanceCharge}</span>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-between items-center text-emerald-400 pt-2">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Corridor Pooling Discount (20%)
          </span>
          <span className="font-mono font-semibold">-{fare.formattedBdt.discount}</span>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-between items-center pt-3 border-t border-border font-bold"
        >
          <span className="text-white text-sm">Individual Payable Total</span>
          <span className="font-mono text-emerald-400 text-lg">{fare.formattedBdt.finalFare}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}

