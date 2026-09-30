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
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-5 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-md z-[60] p-4 rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-[0_15px_50px_rgba(0,0,0,0.85)] flex items-start gap-3.5 text-zinc-100 backdrop-blur-xl ring-1 ring-amber-500/20"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Capacity Concurrency Alert
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
