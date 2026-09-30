"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MapPin,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  Clock,
  Tag,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BrandLogo } from "@/components/BrandLogo";
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
import { FareBreakdownSkeleton } from "@/components/motion/SkeletonShimmer";
import { PaymentModal, PaymentMethodChoice } from "@/components/motion/PaymentModal";

export default function PassengerDashboardPage() {
  const { user, token, isLoading: isAuthLoading, logout } = useAuth();

  const [zones, setZones] = useState<Zone[]>([]);
  const [pickupZone, setPickupZone] = useState("BANANI");
  const [destinationZone, setDestinationZone] = useState("MOHAKHALI");
  const [seatCount, setSeatCount] = useState(1);

  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Hydrate active ride from localStorage on mount to prevent layout shifts
  const [activeRide, setActiveRide] = useState<RideRequest | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("dhaka_tesla_active_ride");
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
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

  // Stable handler for dismissing conflict toast
  const handleDismissConflictToast = useCallback(() => {
    setConflictToastMessage(null);
  }, []);

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

  // Fetch passenger's active ride & history (silent = true disables full screen skeleton and error toast on background poll)
  const loadRides = async (silent = false) => {
    if (!token) return;
    try {
      if (!silent) setIsLoadingRides(true);
      const res = await apiGetMyRides(token);
      setActiveRide(res.activeRide);
      if (res.activeRide) {
        localStorage.setItem("dhaka_tesla_active_ride", JSON.stringify(res.activeRide));
      } else {
        localStorage.removeItem("dhaka_tesla_active_ride");
      }
      setHistory(res.history);
    } catch (err) {
      const apiErr = err as ApiError;
      if (!silent) setError(apiErr.message || "Could not load ride status.");
    } finally {
      if (!silent) setIsLoadingRides(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading && !user) return;

    if (token && user?.role === "PASSENGER") {
      loadRides();
    } else if (!isAuthLoading) {
      setIsLoadingRides(false);
    }
  }, [token, user, isAuthLoading]);

  // Real-time live status updates: Poll active ride status periodically so UI reflects driver actions seamlessly
  useEffect(() => {
    if (!token || user?.role !== "PASSENGER" || !activeRide) return;

    // Stop polling if ride has reached terminal state
    const terminalStatuses = ["COMPLETED", "CANCELLED"];
    if (terminalStatuses.includes(activeRide.status)) return;

    const intervalId = setInterval(() => {
      loadRides(true);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [token, user, activeRide?.id, activeRide?.status]);

  // Recalculate fare estimation whenever pickup, destination, or seat count changes
  // Avoid unnecessary estimation on reload if activeRide is present
  useEffect(() => {
    if (isAuthLoading || activeRide) {
      return;
    }

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
  }, [pickupZone, destinationZone, seatCount, activeRide, isAuthLoading]);

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
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setConflictToastMessage(null);
    // Close payment modal first so user sees the dashboard and alerts without backdrop obstruction
    setIsPaymentModalOpen(false);

    try {
      await apiCreateRideRequest(token, pickupZone, destinationZone, seatCount, method);
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
  // Guard: Auth loading state to prevent unauthorized flash during hydration
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Guard: Unauthorized state (Design.md §3)
  if (!isLoadingRides && (!user || user.role !== "PASSENGER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <div className="max-w-md w-full p-8 rounded-2xl glass-elevated border border-white text-center space-y-5 shadow-2xl relative z-10">
          <div className="p-4 w-14 h-14 mx-auto rounded-2xl bg-danger/10 border border-danger/25 text-danger flex items-center justify-center shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-ink tracking-tight">Passenger Sign-In Required</h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Please sign in as Nusrat, Rafiq, or Shirin to request rides and access this portal.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/auth/login"
              className="py-3 px-5 rounded-full bg-black text-white font-semibold text-xs uppercase tracking-wider hover:bg-zinc-800 transition-all shadow-md"
            >
              Sign In to Passenger Account
            </Link>
            <Link href="/" className="text-xs text-ink-muted hover:text-ink transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="sticky top-3 sm:top-4 z-40 mb-6 glass border border-white/80 rounded-full shadow-card px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <BrandLogo badge="Passenger Console" />

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <span className="text-xs sm:text-sm font-semibold text-ink block">{user?.name}</span>
            <span className="text-[11px] text-accent font-mono font-medium">Passenger &bull; Active</span>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-2 sm:px-4 sm:py-2 rounded-full bg-white/70 border border-[#d4d8ee] text-ink-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
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
          <div className="p-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs sm:text-sm flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ACTIVE RIDE SECTION (Rendered only when user has an active ride) */}
        {activeRide && (
          <div className="p-5 sm:p-7 rounded-2xl glass-elevated border border-white space-y-6 shadow-card relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#d4d8ee]/70 pb-5 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1.5 px-3 py-0.5 rounded-full bg-accent-soft border border-accent/30">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Active Ride Tracker
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-ink flex items-center gap-2 tracking-tight">
                  <span>{activeRide.pickupZone}</span>
                  <span className="text-accent">&rarr;</span>
                  <span>{activeRide.destinationZone}</span>
                </h3>
              </div>

              <div className="w-full sm:w-auto flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-[#d4d8ee]/40 sm:border-0">
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-ink-muted block uppercase tracking-wider">Individual Fare</span>
                  <span className="text-lg sm:text-xl font-bold text-accent font-mono tracking-tight">{activeRide.formattedFare}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openRideHistory(activeRide.id)}
                    className="px-4 py-2 rounded-full bg-white/70 hover:bg-white border border-[#d4d8ee] text-ink text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="View chronological audit history of status transitions"
                  >
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    Audit
                  </button>
                  <button
                    type="button"
                    onClick={handlePromptCancel}
                    disabled={isCancelling || activeRide.status === "STARTED"}
                    className="px-4 py-2 rounded-full bg-danger/10 border border-danger/25 text-danger hover:bg-danger/20 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-sm"
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
        )}

        {/* NEW RIDE REQUEST FORM (Shown if no active ride exists) */}
        {!activeRide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Request Form */}
            <div className="md:col-span-2 p-5 sm:p-7 rounded-2xl glass border border-white/80 space-y-6 shadow-card relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold text-ink tracking-tight">Book Shared Pool Ride</h3>
                <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                  Share Bullet (3-seat EV) along compatible Dhaka corridors. Fares split automatically.
                </p>
              </div>

              <form onSubmit={handlePromptPayment} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Origin Zone */}
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                      Pickup Zone
                    </label>
                    <div className="relative">
                      <select
                        value={pickupZone}
                        onChange={(e) => setPickupZone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#d4d8ee] text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        {zones.map((z) => (
                          <option key={z.code} value={z.code} className="bg-white text-ink">
                            {z.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
                        <MapPin className="w-4 h-4 text-accent" />
                      </div>
                    </div>
                  </div>

                  {/* Destination Zone */}
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                      Destination Zone
                    </label>
                    <div className="relative">
                      <select
                        value={destinationZone}
                        onChange={(e) => setDestinationZone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#d4d8ee] text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all appearance-none cursor-pointer shadow-sm"
                      >
                        {zones.map((z) => (
                          <option key={z.code} value={z.code} className="bg-white text-ink">
                            {z.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
                        <MapPin className="w-4 h-4 text-accent" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seat Count Picker */}
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-2">
                    Seats Required (Max 3 on Bullet)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((num) => (
                      <motion.button
                        key={num}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setSeatCount(num)}
                        className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                          seatCount === num
                            ? "bg-accent border-accent text-white shadow-md shadow-accent/25"
                            : "bg-white/70 border-[#d4d8ee] text-ink-muted hover:border-accent/40 hover:text-ink"
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
                  className="w-full py-4 px-6 rounded-full bg-black text-white hover:bg-zinc-800 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-pill focus:outline-none select-none"
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
            <div className="p-5 sm:p-7 rounded-2xl glass border border-white/80 flex flex-col space-y-5 shadow-card relative overflow-hidden">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#d4d8ee]/70 relative z-10">
                <div className="flex items-center gap-2 text-ink font-bold text-base">
                  <Tag className="w-4 h-4 text-accent" />
                  <span>Fare Estimate</span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/25 font-semibold">
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
                  <div className="py-12 text-center text-xs text-ink-muted">
                    Select pickup and destination to view live fare calculation.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RIDE HISTORY LIST */}
        <div className="p-5 sm:p-7 rounded-2xl glass border border-white/80 space-y-5 shadow-card relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 border-b border-[#d4d8ee]/70">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <span>Ride History</span>
            </h3>
            <span className="text-xs text-ink-muted">{history.length} past rides</span>
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-ink-muted">
              No previous rides recorded. Your completed or cancelled trips will be archived here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((ride) => (
                <div
                  key={ride.id}
                  className="p-3.5 rounded-xl bg-white/70 hover:bg-white border border-[#d4d8ee] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs shadow-sm"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink block">
                      {ride.pickupZone} &rarr; {ride.destinationZone}
                    </span>
                    <span className="text-ink-muted text-[11px]">
                      {new Date(ride.createdAt).toLocaleDateString()} &bull; {ride.seatCount}{" "}
                      {ride.seatCount === 1 ? "seat" : "seats"} &bull; {ride.estimatedDistanceKm} km
                    </span>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-[#d4d8ee]/40 sm:border-0">
                    <span className="font-mono text-accent font-bold">{ride.formattedFare}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        ride.status === "COMPLETED"
                          ? "bg-success-soft text-success border border-success/30"
                          : "bg-danger/10 text-danger border border-danger/25"
                      }`}
                    >
                      {ride.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => openRideHistory(ride.id)}
                      className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-black/5 transition-colors text-xs cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl glass-elevated border border-white p-5 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[#d4d8ee]/70 pb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base tracking-tight">Ride Transition Audit Trail</h3>
                  <span className="text-[11px] text-ink-muted">Deterministic state timeline</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-black/5 transition-colors text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-ink-muted text-xs">
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                <span>Loading transition history...</span>
              </div>
            ) : selectedRideHistory && selectedRideHistory.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 relative z-10">
                {selectedRideHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white/70 border border-[#d4d8ee] space-y-1.5 text-xs shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-ink flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent" />
                        <span>{item.fromStatus}</span>
                        <span className="text-accent">&rarr;</span>
                        <span>{item.toStatus}</span>
                      </span>
                      <span className="text-[11px] text-ink-muted font-mono">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.reason && (
                      <p className="text-ink-muted text-[11px] italic pl-3 border-l-2 border-accent/40">
                        &quot;{item.reason}&quot;
                      </p>
                    )}
                    <div className="text-[10px] text-ink-muted/80 pt-1 flex justify-between items-center">
                      <span>Actor: <strong className="text-ink font-semibold">{item.changedByName}</strong></span>
                      <span className="font-mono">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-ink-muted">No status audit entries found.</p>
            )}

            <div className="pt-2 flex justify-end relative z-10">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm"
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
        onDismiss={handleDismissConflictToast}
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
      <footer className="pt-8 border-t border-[#d4d8ee] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-ink-muted">
        <p>&copy; {new Date().getFullYear()} Dhaka Tesla Pool &bull; Passenger Corridor Network.</p>
        <div className="flex gap-4">
          <Link href="/" className="hover:text-ink transition-colors font-medium">
            Home
          </Link>
          <Link href="/auth/login" className="hover:text-ink transition-colors font-medium">
            Switch Account
          </Link>
        </div>
      </footer>
    </div>
  );
}
