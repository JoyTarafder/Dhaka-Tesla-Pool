"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Banknote, CreditCard, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export type PaymentMethodChoice = "CASH" | "ONLINE";

interface PaymentModalProps {
  isOpen: boolean;
  pickupZoneName: string;
  destinationZoneName: string;
  seatCount: number;
  formattedFare: string;
  isLoading?: boolean;
  onConfirm: (method: PaymentMethodChoice) => void;
  onCancel: () => void;
}

export function PaymentModal({
  isOpen,
  pickupZoneName,
  destinationZoneName,
  seatCount,
  formattedFare,
  isLoading = false,
  onConfirm,
  onCancel,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodChoice>("ONLINE");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="payment-modal-backdrop"
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
            key="payment-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-2xl glass-elevated border border-white space-y-4 sm:space-y-5 shadow-2xl z-10"
          >
            {/* Header & Ride Summary */}
            <div>
              <h3 className="text-lg font-bold text-ink tracking-tight">Choose Payment Method</h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Select how you would like to pay for this shared pool trip.
              </p>
            </div>

            {/* Trip Snapshot */}
            <div className="p-3.5 rounded-xl bg-white/70 border border-[#d4d8ee] flex justify-between items-center text-xs shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Trip Corridor</span>
                <span className="font-semibold text-ink">
                  {pickupZoneName} &rarr; {destinationZoneName}
                </span>
                <span className="text-ink-muted block text-[11px]">
                  {seatCount} {seatCount === 1 ? "seat" : "seats"} requested
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-ink-muted uppercase tracking-wider block">Total Fare</span>
                <span className="text-base font-bold text-accent font-mono">{formattedFare}</span>
              </div>
            </div>

            {/* Payment Options Selection */}
            <div className="space-y-3">
              {/* Option 1: Online Payment */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod("ONLINE")}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                  selectedMethod === "ONLINE"
                    ? "bg-accent-soft/80 border-accent text-ink shadow-md shadow-accent/10"
                    : "bg-white/60 border-[#d4d8ee] text-ink hover:border-accent/40 hover:bg-white/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      selectedMethod === "ONLINE"
                        ? "bg-accent text-white font-bold shadow-md shadow-accent/25"
                        : "bg-[#d4d8ee] text-ink-muted"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">Online Payment</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/30">
                        Instant
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted block mt-0.5">
                      Pay via bKash, Nagad, or TeslaPay simulator.
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {selectedMethod === "ONLINE" ? (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#d4d8ee]" />
                  )}
                </div>
              </motion.div>

              {/* Option 2: Cash Payment */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod("CASH")}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                  selectedMethod === "CASH"
                    ? "bg-accent-soft/80 border-accent text-ink shadow-md shadow-accent/10"
                    : "bg-white/60 border-[#d4d8ee] text-ink hover:border-accent/40 hover:bg-white/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      selectedMethod === "CASH"
                        ? "bg-accent text-white font-bold shadow-md shadow-accent/25"
                        : "bg-[#d4d8ee] text-ink-muted"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-ink">Cash on Drop-off</span>
                    </div>
                    <span className="text-xs text-ink-muted block mt-0.5">
                      Pay cash directly to Jashim when you reach your destination.
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {selectedMethod === "CASH" ? (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[#d4d8ee]" />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <div className="pt-2 grid grid-cols-2 sm:flex sm:justify-end items-center gap-2.5 sm:gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/70 border border-[#d4d8ee] text-ink text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 text-center cursor-pointer shadow-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => onConfirm(selectedMethod)}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-md transition-all disabled:opacity-50 text-center cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <span className="truncate">Confirm ({formattedFare})</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
