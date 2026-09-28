"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  MapPin,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { motion } from "framer-motion";
import {
  apiGetZones,
  apiEstimateFare,
  apiCreateRideRequest,
  apiGetMyRides,
  apiCancelRide,
  apiGetRideHistory,
  Zone,
  FareEstimate,
  RideRequest,
  RideStatusHistoryItem,
  ApiError,
} from "@/lib/api";
import { StatusStepper } from "@/components/motion/StatusStepper";
import { FareBreakdown } from "@/components/motion/FareBreakdown";
import { ConfirmModal } from "@/components/motion/ConfirmModal";
import { ConflictToast } from "@/components/motion/ConflictToast";
import { RideCardSkeleton, FareBreakdownSkeleton } from "@/components/motion/SkeletonShimmer";
import { PaymentModal, PaymentMethodChoice } from "@/components/motion/PaymentModal";



export default function PassengerDashboardPage() {
  const { user, token, logout } = useAuth();

  const [zones, setZones] = useState<Zone[]>([]);
  const [pickupZone, setPickupZone] = useState("BANANI");
  const [destinationZone, setDestinationZone] = useState("MOHAKHALI");
  const [seatCount, setSeatCount] = useState(1);

  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [history, setHistory] = useState<RideRequest[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status audit logs modal state (Phase 6)
  const [selectedRideHistory, setSelectedRideHistory] = useState<RideStatusHistoryItem[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // UI Hardening states (Phase 7 - Design.md §3 & §4)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [conflictToastMessage, setConflictToastMessage] = useState<string | null>(null);

  // Payment Selection Modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const openRideHistory = async (rideId: string) => {
    if (!token) return;
    setIsLoadingHistory(true);
    setHistoryModalOpen(true);
    setSelectedRideHistory(null);
    try {
      const res = await apiGetRideHistory(token, rideId);
      setSelectedRideHistory(res.history);
    } catch {
      // History load failure is non-critical; modal will show empty state
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load zones on mount
  useEffect(() => {
    apiGetZones()
      .then((res) => setZones(res.zones))
      .catch(() => {
        // Zone list failure is non-fatal; selects will remain empty
      });
  }, []);

  // Fetch passenger's active ride & history
  const loadRides = async () => {
    if (!token) return;
    try {
      const res = await apiGetMyRides(token);
      setActiveRide(res.activeRide);
      setHistory(res.history);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Could not load ride status.");
    } finally {
      setIsLoadingRides(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === "PASSENGER") {
      loadRides();
    } else {
      setIsLoadingRides(false);
    }
  }, [token, user]);

  // Recalculate fare estimation whenever pickup, destination, or seat count changes
  useEffect(() => {
    if (pickupZone && destinationZone && pickupZone !== destinationZone) {
      setIsEstimating(true);
      apiEstimateFare(pickupZone, destinationZone, seatCount)
        .then((res) => {
          setFareEstimate(res);
          setError(null);
        })
        .catch((err) => {
          const apiErr = err as ApiError;
          setError(apiErr.message);
        })
        .finally(() => {
          setIsEstimating(false);
        });
    } else {
      setFareEstimate(null);
    }
  }, [pickupZone, destinationZone, seatCount]);

  // Handle ride request trigger: open payment modal to choose Cash or Online
  const handlePromptPayment = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!token || pickupZone === destinationZone) return;
    setError(null);
    setConflictToastMessage(null);
    setIsPaymentModalOpen(true);
  };

  // Execute ride booking once payment method (Cash or Online) is selected
  const handleConfirmPaymentAndBook = async (method: PaymentMethodChoice) => {
    if (!token) return;
    setIsSubmitting(true);
    setError(null);
    setConflictToastMessage(null);

    try {
      await apiCreateRideRequest(token, pickupZone, destinationZone, seatCount, method);
      setIsPaymentModalOpen(false);
      await loadRides();
    } catch (err) {
      const apiErr = err as ApiError;
      if (
        apiErr.code === "POOL_CAPACITY_EXCEEDED" ||
        apiErr.code === "CAPACITY_EXCEEDS_VEHICLE" ||
        apiErr.message?.toLowerCase().includes("remaining seats") ||
        apiErr.message?.toLowerCase().includes("capacity")
      ) {
        setConflictToastMessage(
          "The last remaining seat on Bullet was just booked by another passenger in this corridor. Capacity limit reached."
        );
      } else {
        setError(apiErr.message || "Failed to create ride request.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger confirmation modal for cancellation (Design.md §2)
  const handlePromptCancel = () => {
    if (!activeRide || activeRide.status === "STARTED") return;
    setCancelConfirmOpen(true);
  };

  // Execute confirmed ride cancellation with atomic capacity rollback
  const handleConfirmCancel = async () => {
    if (!token || !activeRide) return;
    setIsCancelling(true);
    setError(null);

    try {
      await apiCancelRide(token, activeRide.id, "Cancelled from passenger dashboard");
      setCancelConfirmOpen(false);
      await loadRides();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to cancel ride.");
    } finally {
      setIsCancelling(false);
    }
  };


  // Guard: Unauthorized state (Design.md §3)
  if (!isLoadingRides && (!user || user.role !== "PASSENGER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 text-center space-y-5 shadow-2xl relative z-10">
          <div className="p-4 w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Passenger Sign-In Required</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Please sign in as Nusrat, Rafiq, or Shirin to request rides and access this portal.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/auth/login"
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-semibold text-sm hover:from-emerald-300 hover:to-teal-300 transition-all shadow-glow-sm hover:shadow-glow"
            >
              Sign In to Passenger Account
            </Link>
            <Link href="/" className="text-xs text-zinc-400 hover:text-white transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <header className="sticky top-4 z-40 mb-6 backdrop-blur-xl bg-zinc-950/80 border border-zinc-800/80 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-glow-sm group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-tight">Dhaka Tesla Pool</span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Electric Fleet Network</span>
            </div>
          </Link>
          <span className="hidden sm:inline-flex text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            Passenger Console
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <span className="text-xs sm:text-sm font-semibold text-white block">{user?.name}</span>
            <span className="text-[11px] text-emerald-400 font-mono">Passenger &bull; Active</span>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mb-8 space-y-6 sm:space-y-8 flex-1">
        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ACTIVE RIDE SECTION */}
        {isLoadingRides ? (
          <RideCardSkeleton />
        ) : activeRide ? (
          <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/70 backdrop-blur-xl border border-emerald-500/30 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-5 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Ride Tracker
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                  <span>{activeRide.pickupZone}</span>
                  <span className="text-emerald-400">&rarr;</span>
                  <span>{activeRide.destinationZone}</span>
                </h3>
              </div>

              <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-zinc-800/40 sm:border-0">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-zinc-400 block">Individual Fare</span>
                  <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono tracking-tight">{activeRide.formattedFare}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openRideHistory(activeRide.id)}
                    className="px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="View chronological audit history of status transitions"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Audit
                  </button>
                  <button
                    type="button"
                    onClick={handlePromptCancel}
                    disabled={isCancelling || activeRide.status === "STARTED"}
                    className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                    title={
                      activeRide.status === "STARTED"
                        ? "Rides in progress cannot be cancelled"
                        : "Cancel this ride"
                    }
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Cancel Ride"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar (Design.md §4.1) */}
            <div className="relative z-10">
              <StatusStepper currentStatus={activeRide.status} />
            </div>
          </div>
        ) : null}

        {/* NEW RIDE REQUEST FORM (Shown if no active ride exists) */}
        {!activeRide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Request Form */}
            <div className="md:col-span-2 p-5 sm:p-7 rounded-3xl bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">Book Shared Pool Ride</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Share Bullet (3-seat EV) along compatible Dhaka corridors. Fares split automatically.
                </p>
              </div>

              <form onSubmit={handlePromptPayment} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Origin Zone */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Pickup Zone
                    </label>
                    <div className="relative">
                      <select
                        value={pickupZone}
                        onChange={(e) => setPickupZone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/90 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
                      >
                        {zones.map((z) => (
                          <option key={z.code} value={z.code} className="bg-zinc-900 text-white">
                            {z.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  {/* Destination Zone */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                      Destination Zone
                    </label>
                    <div className="relative">
                      <select
                        value={destinationZone}
                        onChange={(e) => setDestinationZone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/90 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all appearance-none cursor-pointer"
                      >
                        {zones.map((z) => (
                          <option key={z.code} value={z.code} className="bg-zinc-900 text-white">
                            {z.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                        <MapPin className="w-4 h-4 text-teal-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seat Count Picker */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                    Seats Required (Max 3 on Bullet)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((num) => (
                      <motion.button
                        key={num}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setSeatCount(num)}
                        className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                          seatCount === num
                            ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400 text-emerald-300 shadow-glow-sm"
                            : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{num} {num === 1 ? "Seat" : "Seats"}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handlePromptPayment}
                  disabled={isSubmitting || pickupZone === destinationZone}
                  className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-bold text-sm sm:text-base hover:from-emerald-300 hover:to-teal-300 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-glow-sm hover:shadow-glow focus:outline-none select-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Request Ride on Bullet</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>

            {/* Fare Breakdown Reveal (Design.md §4.5) */}
            <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 flex flex-col space-y-5 shadow-2xl relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 relative z-10">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  <span>Fare Estimate</span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  20% Pool Active
                </span>
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-center">
                {fareEstimate ? (
                  <div className={`transition-opacity duration-150 ${isEstimating ? "opacity-60" : "opacity-100"}`}>
                    <FareBreakdown fare={fareEstimate} />
                  </div>
                ) : isEstimating ? (
                  <FareBreakdownSkeleton />
                ) : (
                  <div className="py-12 text-center text-xs text-zinc-500">
                    Select pickup and destination to view live fare calculation.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIDE HISTORY LIST */}
        <div className="p-5 sm:p-7 rounded-3xl bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/80">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Ride History</span>
            </h3>
            <span className="text-xs text-zinc-500">{history.length} past rides</span>
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500">
              No previous rides recorded. Your completed or cancelled trips will be archived here.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((ride) => (
                <div
                  key={ride.id}
                  className="p-3.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/60 hover:border-zinc-700/80 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block">
                      {ride.pickupZone} &rarr; {ride.destinationZone}
                    </span>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(ride.createdAt).toLocaleDateString()} &bull; {ride.seatCount}{" "}
                      {ride.seatCount === 1 ? "seat" : "seats"} &bull; {ride.estimatedDistanceKm} km
                    </span>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-zinc-800/40 sm:border-0">
                    <span className="font-mono text-emerald-400 font-semibold">{ride.formattedFare}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        ride.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {ride.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openRideHistory(ride.id)}
                      className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-xs cursor-pointer"
                      title="View transition audit log"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Status History / Audit Trail Modal (Phase 6) */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-950/95 border border-zinc-800/90 p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base tracking-tight">Ride Transition Audit Trail</h3>
                  <span className="text-[11px] text-zinc-400">Deterministic state timeline</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Loading transition history...</span>
              </div>
            ) : selectedRideHistory && selectedRideHistory.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 relative z-10">
                {selectedRideHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1.5 text-xs shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-glow-sm" />
                        <span>{item.fromStatus}</span>
                        <span className="text-emerald-400">&rarr;</span>
                        <span>{item.toStatus}</span>
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-zinc-400 text-[11px] italic pl-3 border-l-2 border-emerald-500/30">
                        &quot;{item.reason}&quot;
                      </p>
                    )}
                    <div className="text-[10px] text-zinc-500 pt-1 flex justify-between items-center">
                      <span>Actor: <strong className="text-zinc-400 font-semibold">{item.changedByName}</strong></span>
                      <span className="font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-zinc-500">No status audit entries found.</p>
            )}

            <div className="pt-2 flex justify-end relative z-10">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Dialog (Phase 7 - Design.md §2) */}
      <ConfirmModal
        isOpen={cancelConfirmOpen}
        title="Cancel Ride Request?"
        message="Are you sure you want to cancel this ride request? Your reserved seat in Bullet will be immediately released back to other waiting passengers in this corridor."
        confirmLabel="Yes, Cancel Ride"
        cancelLabel="Keep My Ride"
        isDestructive={true}
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelConfirmOpen(false)}
      />

      {/* Capacity Conflict Toast (Phase 7 - Design.md §4.4) */}
      <ConflictToast
        message={conflictToastMessage}
        onDismiss={() => setConflictToastMessage(null)}
      />

      {/* Payment Selection Modal (Cash vs Online) */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        pickupZoneName={zones.find((z) => z.code === pickupZone)?.name || pickupZone}
        destinationZoneName={zones.find((z) => z.code === destinationZone)?.name || destinationZone}
        seatCount={seatCount}
        formattedFare={fareEstimate?.formattedBdt.finalFare || "৳0.00"}
        isLoading={isSubmitting}
        onConfirm={handleConfirmPaymentAndBook}
        onCancel={() => setIsPaymentModalOpen(false)}
      />

      {/* Footer */}
      <footer className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Dhaka Tesla Pool &bull; Passenger Corridor Network.</p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            Home
          </Link>
          <Link href="/auth/login" className="hover:text-emerald-400 transition-colors">
            Switch Account
          </Link>
        </div>
      </footer>
    </div>
  );
}
