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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
        >
          {/* Modal Card with smooth scale and stopPropagation */}
          <motion.div
            key="payment-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-2xl bg-zinc-950/95 border border-white/[0.1] space-y-4 sm:space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10"
          >

            {/* Header & Ride Summary */}
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Choose Payment Method</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Select how you would like to pay for this shared pool trip.
              </p>
            </div>

            {/* Trip Snapshot */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Trip Corridor</span>
                <span className="font-semibold text-white">
                  {pickupZoneName} &rarr; {destinationZoneName}
                </span>
                <span className="text-zinc-500 block text-[11px]">
                  {seatCount} {seatCount === 1 ? "seat" : "seats"} requested
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-zinc-400 uppercase tracking-wider block">Total Fare</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{formattedFare}</span>
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
                    ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border-emerald-400 text-white shadow-md shadow-emerald-500/10"
                    : "bg-zinc-900/50 border-white/[0.06] text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      selectedMethod === "ONLINE"
                        ? "bg-gradient-to-tr from-emerald-400 to-emerald-300 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                        : "bg-zinc-800/80 text-zinc-400"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Online Payment</span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Instant
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 block mt-0.5">
                      Pay via bKash, Nagad, or TeslaPay simulator.
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {selectedMethod === "ONLINE" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-700" />
                  )}
                </div>
              </motion.div>

              {/* Option 2: Cash Payment */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod("CASH")}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                  selectedMethod === "CASH"
                    ? "bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border-emerald-400 text-white shadow-md shadow-emerald-500/10"
                    : "bg-zinc-900/50 border-white/[0.06] text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      selectedMethod === "CASH"
                        ? "bg-gradient-to-tr from-emerald-400 to-emerald-300 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                        : "bg-zinc-800/80 text-zinc-400"
                    }`}
                  >
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Cash on Drop-off</span>
                    </div>
                    <span className="text-xs text-zinc-400 block mt-0.5">
                      Pay cash directly to Jashim when you reach your destination.
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {selectedMethod === "CASH" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-zinc-700" />
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 text-center"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => onConfirm(selectedMethod)}
                disabled={isLoading}
                className="w-full sm:w-auto px-3 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 text-center"
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
