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
    <div className="relative pt-3 pb-2">
      {/* Horizontal Connector Line running directly through centers of step icons */}
      <div className="absolute top-7 left-[8.33%] right-[8.33%] h-1 bg-zinc-800/90 -translate-y-1/2 rounded-full overflow-hidden z-0">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Stepper Node Icons & Labels */}
      <div className="grid grid-cols-6 gap-1 text-center relative z-10">
        {STATUS_STEPS.map((step, idx) => {
          const isPassed = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 group">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.35 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                  isCurrent
                    ? "bg-gradient-to-tr from-emerald-400 to-emerald-300 text-zinc-950 font-bold shadow-[0_0_18px_rgba(52,211,153,0.5)] ring-2 ring-emerald-400/60 ring-offset-2 ring-offset-zinc-950"
                    : isPassed
                    ? "bg-zinc-950 text-emerald-400 border-2 border-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.25)]"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-600"
                }`}
              >
                <Icon className="w-4 h-4" />
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
