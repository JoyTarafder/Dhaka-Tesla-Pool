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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85"
        >
          {/* Modal Card with smooth scale and stopPropagation */}
          <motion.div
            key="payment-modal-card"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 sm:space-y-5 shadow-2xl z-10"
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
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors duration-150 flex items-center justify-between gap-3 ${
                  selectedMethod === "ONLINE"
                    ? "bg-emerald-500/10 border-emerald-400/80 text-white shadow-md shadow-emerald-500/10"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      selectedMethod === "ONLINE"
                        ? "bg-emerald-400 text-black font-bold"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Online Payment</span>
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
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
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors duration-150 flex items-center justify-between gap-3 ${
                  selectedMethod === "CASH"
                    ? "bg-emerald-500/10 border-emerald-400/80 text-white shadow-md shadow-emerald-500/10"
                    : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${
                      selectedMethod === "CASH"
                        ? "bg-emerald-400 text-black font-bold"
                        : "bg-zinc-800 text-zinc-400"
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50 text-center"
              >
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => onConfirm(selectedMethod)}
                disabled={isLoading}
                className="w-full sm:w-auto px-3 sm:px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 text-center"
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
