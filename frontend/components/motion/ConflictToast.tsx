"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Users } from "lucide-react";

interface ConflictToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function ConflictToast({ message, onDismiss }: ConflictToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed top-5 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-md z-[60] p-4 rounded-2xl glass-elevated border-l-4 border-l-danger border-white/80 shadow-2xl flex items-start gap-3.5 text-ink"
        >
          <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-danger uppercase tracking-wider">
                Capacity Concurrency Alert
              </span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">{message}</p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
