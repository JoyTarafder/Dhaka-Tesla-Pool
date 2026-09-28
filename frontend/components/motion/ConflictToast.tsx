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
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md z-50 p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.7)] flex items-start gap-3.5 text-zinc-100 backdrop-blur-xl"
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
