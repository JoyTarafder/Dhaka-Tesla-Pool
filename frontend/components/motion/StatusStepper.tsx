"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock, MapPin, Navigation, Car, Flag } from "lucide-react";

export const STATUS_STEPS = [
  { key: "REQUESTED", label: "Requested", icon: Clock },
  { key: "MATCHED", label: "Matched", icon: MapPin },
  { key: "ACCEPTED", label: "Accepted", icon: Navigation },
  { key: "DRIVER_ARRIVED", label: "Arrived", icon: Car },
  { key: "STARTED", label: "In Transit", icon: Flag },
  { key: "COMPLETED", label: "Completed", icon: CheckCircle2 },
];

interface StatusStepperProps {
  currentStatus: string;
}

export function StatusStepper({ currentStatus }: StatusStepperProps) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  const isCancelled = currentStatus === "CANCELLED";

  // Calculate percentage of progress line
  const progressPercent =
    currentIndex >= 0
      ? (currentIndex / (STATUS_STEPS.length - 1)) * 100
      : isCancelled
      ? 100
      : 0;

  if (isCancelled) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
        <span className="font-bold">Ride Request Cancelled</span>
        <span className="text-[11px] text-zinc-400">Reserved seats have been released back to Bullet</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Animated Glowing Progress Bar */}
      <div className="relative h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden p-0.5 border border-white/[0.05]">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Stepper Node Icons & Labels */}
      <div className="grid grid-cols-6 gap-1 text-center">
        {STATUS_STEPS.map((step, idx) => {
          const isPassed = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 group">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.35 }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                  isCurrent
                    ? "bg-gradient-to-tr from-emerald-400 to-emerald-300 text-zinc-950 font-bold shadow-[0_0_15px_rgba(52,211,153,0.4)] ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-zinc-950"
                    : isPassed
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-zinc-900 border border-white/[0.08] text-zinc-600"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {isCurrent && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </motion.div>

              <span
                className={`text-[9px] sm:text-[11px] font-medium tracking-tight block truncate max-w-full transition-colors ${
                  isCurrent
                    ? "text-emerald-300 font-bold"
                    : isPassed
                    ? "text-zinc-300 font-medium"
                    : "text-zinc-600"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
