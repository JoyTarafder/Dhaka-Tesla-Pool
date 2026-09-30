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
      <div className="p-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs flex items-center justify-between shadow-sm">
        <span className="font-bold">Ride Request Cancelled</span>
        <span className="text-[11px] text-ink-muted">Reserved seats released back to Bullet</span>
      </div>
    );
  }

  return (
    <div className="relative pt-3 pb-2">
      {/* Horizontal Connector Line running directly through centers of step icons */}
      <div className="absolute top-7 left-[8.33%] right-[8.33%] h-1.5 bg-[#d4d8ee] -translate-y-1/2 rounded-full overflow-hidden z-0 shadow-inner">
        <motion.div
          className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(59,130,246,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
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
                    ? "bg-accent text-white font-bold shadow-[0_0_16px_rgba(59,130,246,0.45)] ring-2 ring-accent/40 ring-offset-2 ring-offset-white"
                    : isPassed
                    ? "bg-white text-accent border-2 border-accent shadow-sm"
                    : "bg-white/90 border border-[#d4d8ee] text-[#8e95a5]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </motion.div>

              <span
                className={`text-[9px] sm:text-[11px] tracking-tight block truncate max-w-full transition-colors ${
                  isCurrent
                    ? "text-accent font-bold"
                    : isPassed
                    ? "text-ink font-semibold"
                    : "text-ink-muted"
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
