"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users } from "lucide-react";

interface ConflictToastProps {
  message: string | null;
  onDismiss: () => void;
}

/**
 * Concurrency Conflict Toast (Design.md §4.4)
 * Displays capacity concurrency alerts (e.g. Shirin losing last seat race) with a stable key
 * and smooth easeOut animation to eliminate double-render blinking/flicker.
 */
// Auto-dismiss timeout for transient concurrency alerts (6 seconds)
const CONFLICT_TOAST_AUTO_DISMISS_MS = 6000;

export function ConflictToast({ message, onDismiss }: ConflictToastProps) {
  // Auto-dismiss after timeout so user is not blocked if they don't click the X button
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, CONFLICT_TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key="conflict-toast-banner"
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed top-5 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-md z-[70] p-4 rounded-2xl glass-elevated border-l-4 border-l-danger border-white/80 shadow-2xl flex items-start gap-3.5 text-ink"
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
            aria-label="Dismiss alert"
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
