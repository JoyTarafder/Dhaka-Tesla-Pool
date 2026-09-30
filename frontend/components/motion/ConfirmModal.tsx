"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="confirm-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) {
              onCancel();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 backdrop-blur-md"
        >
          {/* Modal Card with smooth scale and stopPropagation */}
          <motion.div
            key="confirm-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-2xl glass-elevated border border-white space-y-4 shadow-2xl z-10"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDestructive
                    ? "bg-danger/10 text-danger border border-danger/25"
                    : "bg-accent/10 text-accent border border-accent/25"
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">{title}</h3>
                <p className="text-xs text-ink-muted mt-0.5">{message}</p>
              </div>
            </div>

            <div className="pt-3 grid grid-cols-2 sm:flex sm:justify-end items-center gap-2.5 sm:gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/70 border border-[#d4d8ee] text-ink text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 text-center cursor-pointer shadow-sm"
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-center cursor-pointer ${
                  isDestructive
                    ? "bg-danger hover:bg-rose-700 text-white shadow-md shadow-danger/20"
                    : "bg-black hover:bg-zinc-800 text-white shadow-md"
                }`}
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmLabel}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
