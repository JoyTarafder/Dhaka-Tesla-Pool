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
      {/* Animated Progress Bar (Design.md §4.1) */}
      <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-emerald-400 shadow-sm shadow-emerald-400/50"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Stepper Node Icons & Labels */}
      <div className="grid grid-cols-6 gap-1 text-center">
        {STATUS_STEPS.map((step, idx) => {
          const isPassed = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.2, 1] : 1,
                  backgroundColor: isCurrent ? "#34d399" : isPassed ? "#10b981" : "#27272a",
                }}
                transition={{ duration: 0.35 }}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-colors ${
                  isCurrent
                    ? "text-black shadow-md shadow-emerald-500/30"
                    : isPassed
                    ? "text-black"
                    : "text-zinc-500 border border-zinc-800"
                }`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </motion.div>

              <span
                className={`text-[8px] sm:text-[10px] font-medium tracking-tight block truncate max-w-full ${
                  isCurrent
                    ? "text-emerald-400 font-bold"
                    : isPassed
                    ? "text-zinc-300"
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
