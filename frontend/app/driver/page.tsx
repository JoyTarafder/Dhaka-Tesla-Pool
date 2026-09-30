"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Car,
  Shield,
  Power,
  Loader2,
  AlertCircle,
  Users,
  CheckCircle2,
  MapPin,
  Navigation,
  Play,
  Check,
  LogOut,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BrandLogo } from "@/components/BrandLogo";
import { motion } from "framer-motion";
import {
  apiGetDriverVehicle,
  apiUpdateDriverAvailability,
  apiGetDriverPools,
  apiAcceptPool,
  apiArrivePool,
  apiStartPool,
  apiCompletePool,
  Vehicle,
  Pool,
  ApiError,
} from "@/lib/api";
import { SeatCapacityVisualizer } from "@/components/motion/SeatCapacityVisualizer";
import { DriverConsoleSkeleton } from "@/components/motion/SkeletonShimmer";

export default function DriverDashboardPage() {
  const { user, token, isLoading: isAuthLoading, logout } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load driver's assigned vehicle and active pool (silent = true disables spinner and error banner on background poll)
  const loadDriverData = async (silent = false) => {
    if (!token || user?.role !== "DRIVER") {
      if (!silent && !isAuthLoading) setIsLoading(false);
      return;
    }

    try {
      if (!silent) setIsLoading(true);
      const [vehicleRes, poolRes] = await Promise.all([
        apiGetDriverVehicle(token),
        apiGetDriverPools(token).catch(() => ({ pool: null })),
      ]);

      setVehicle(vehicleRes.vehicle);
      setActivePool(poolRes.pool);
    } catch (err) {
      const apiErr = err as ApiError;
      if (!silent) setError(apiErr.message || "Could not load driver console data.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading && !user) return;
    loadDriverData();
  }, [token, user, isAuthLoading]);

  // Real-time live updates: Poll active pool data periodically so new passenger bookings appear automatically
  useEffect(() => {
    if (!token || user?.role !== "DRIVER") return;

    const intervalId = setInterval(() => {
      loadDriverData(true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [token, user]);

  // Handle availability toggle
  const toggleAvailability = async () => {
    if (!token || !vehicle) return;
    setIsUpdating(true);
    setError(null);

    try {
      const nextStatus = !vehicle.isOnline;
      const res = await apiUpdateDriverAvailability(token, nextStatus);
      setVehicle(res.vehicle);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to update availability status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle driver lifecycle transition actions (Phase 6)
  const handleLifecycleTransition = async (action: "accept" | "arrive" | "start" | "complete") => {
    if (!token || !activePool) return;
    setIsTransitioning(true);
    setError(null);

    try {
      let res: { pool: Pool };
      if (action === "accept") {
        res = await apiAcceptPool(token, activePool.id);
      } else if (action === "arrive") {
        res = await apiArrivePool(token, activePool.id);
      } else if (action === "start") {
        res = await apiStartPool(token, activePool.id);
      } else {
        res = await apiCompletePool(token, activePool.id);
      }

      setActivePool(res.pool);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to update pool lifecycle state");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Guard: Auth loading state to prevent unauthorized flash during hydration
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DriverConsoleSkeleton />
      </div>
    );
  }

  // Guard: Unauthorized state (Design.md §3)
  if (!isLoading && (!user || user.role !== "DRIVER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card border border-white/80 text-center space-y-4 shadow-[0_20px_50px_rgba(20,25,45,0.08)]">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-danger/10 text-danger flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-ink">Driver Access Restricted</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            This dashboard is dedicated to drivers like Jashim. Please sign in with a registered driver account.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="py-3 px-6 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              Sign In as Driver (Jashim)
            </Link>
            <Link href="/" className="text-xs text-ink-muted hover:text-ink font-medium">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const occupiedSeatsCount = activePool?.occupiedSeats ?? 0;
  const totalCapacity = vehicle?.capacity ?? 3;

  return (
    <div className="min-h-screen text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
      {/* Top Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 flex justify-between items-center px-5 sm:px-8 py-3.5 rounded-full glass border border-white/80 shadow-card">
        <BrandLogo badge="Driver Console" />

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/driver/payment-history"
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-white/90 text-ink hover:bg-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Payment History</span>
          </Link>

          <div className="text-right">
            <span className="text-xs sm:text-sm font-bold text-ink block">{user?.name}</span>
            <span className="hidden sm:block text-[10px] text-accent font-mono uppercase tracking-wider font-semibold">Driver</span>
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

      {/* Main Content */}
      <main className="my-6 sm:my-8 space-y-6 sm:space-y-7 flex-1">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl glass-elevated border-l-4 border-l-danger text-danger text-xs sm:text-sm flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Skeleton Loading State */}
        {isLoading ? (
          <DriverConsoleSkeleton />
        ) : (
          <>
            {/* Vehicle & Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Vehicle Information */}
              <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/80 shadow-[0_10px_35px_rgba(20,25,45,0.05)] space-y-4 md:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                        {vehicle?.name || "Bullet"}
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/80 text-ink-muted border border-[#d4d8ee]">
                          {vehicle?.registrationNumber || "DHK-TESLA-001"}
                        </span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-ink-muted">
                        3-Seat Electric Shared Commuter &bull; Banani Corridor
                      </p>
                    </div>
                  </div>

                  {/* Online / Offline Status Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      vehicle?.isOnline
                        ? "bg-success/15 border-success/30 text-success"
                        : "bg-white/80 border-[#d4d8ee] text-ink-muted"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        vehicle?.isOnline ? "bg-success animate-pulse" : "bg-ink-muted/50"
                      }`}
                    />
                    {vehicle?.isOnline ? "Online & Ready" : "Offline"}
                  </div>
                </div>

                {/* 3-Seat Capacity Visualizer (Design.md §4.2) */}
                <div className="pt-4 border-t border-[#d4d8ee]/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-ink-muted">
                    <span className="font-semibold text-ink">Physical Seat Occupancy &bull; Bullet (3-Seat EV)</span>
                    <span className="font-mono text-ink-muted text-[11px]">
                      Strict Row-Lock Allocation
                    </span>
                  </div>
                  <SeatCapacityVisualizer
                    occupiedSeats={occupiedSeatsCount}
                    totalCapacity={totalCapacity}
                  />
                </div>
              </div>

              {/* Driver Availability Action Switch */}
              <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/80 shadow-[0_10px_35px_rgba(20,25,45,0.05)] flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-ink text-sm">Shift Availability</h4>
                  <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                    Toggle your status to accept or pause incoming shared ride pools.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={toggleAvailability}
                  disabled={isUpdating}
                  className={`w-full py-3 px-4 rounded-full font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    vehicle?.isOnline
                      ? "bg-white/80 hover:bg-white text-ink border border-white/90"
                      : "bg-black hover:bg-zinc-800 text-white"
                  }`}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                  {vehicle?.isOnline ? "Go Offline" : "Go Online Now"}
                </motion.button>

                {/* Quick Link to Payment History */}
                <Link
                  href="/driver/payment-history"
                  className="pt-1 flex items-center justify-between text-xs text-ink-muted hover:text-ink transition-colors group"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Receipt className="w-3.5 h-3.5 text-accent" />
                    <span>View Payment History &amp; Earnings</span>
                  </span>
                  <span className="text-ink-muted group-hover:text-ink font-mono text-[11px]">&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Active Pool Overview (Phase 5 & 6) */}
            <div className="p-5 sm:p-6 rounded-3xl glass-card border border-white/80 shadow-[0_12px_40px_rgba(20,25,45,0.06)] space-y-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-ink text-base">Active Pool Dispatch</h3>
                </div>
                {activePool && (
                  <span className="text-xs px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-bold uppercase tracking-wider">
                    {activePool.status}
                  </span>
                )}
              </div>

              {activePool ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/70 border border-white/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs">
                    <div>
                      <span className="text-ink-muted block text-[11px] font-semibold uppercase tracking-wider">Approved Route Corridor</span>
                      <span className="font-bold text-ink text-sm">
                        {activePool.pickupZone} &bull; {activePool.routeCode}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-ink-muted block text-[11px] font-semibold uppercase tracking-wider">Occupancy</span>
                      <span className="font-mono text-accent font-bold text-sm">
                        {activePool.occupiedSeats} / {activePool.totalCapacity} Seats Reserved
                      </span>
                    </div>
                  </div>

                  {/* Passenger Manifest */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block">
                      Pooled Passengers ({activePool.members.length})
                    </span>
                    <div className="divide-y divide-[#d4d8ee]/60 border border-white/80 rounded-2xl overflow-hidden bg-white/60">
                      {activePool.members.map((member) => (
                        <div
                          key={member.membershipId}
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink text-sm">{member.passengerName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-white/80 text-ink-muted text-[10px] font-semibold border border-[#d4d8ee]">
                                {member.seatsReserved} {member.seatsReserved === 1 ? "seat" : "seats"}
                              </span>
                            </div>
                            <div className="text-ink-muted flex items-center gap-1.5 text-xs font-medium">
                              <MapPin className="w-3.5 h-3.5 text-accent" />
                              <span>{member.pickupZone}</span>
                              <span>&rarr;</span>
                              <span>{member.destinationZone}</span>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t border-[#d4d8ee]/50 sm:border-0">
                            <span className="text-[11px] text-ink-muted block font-medium">Individual Split Fare</span>
                            <span className="font-mono text-accent font-bold text-sm">
                              {member.formattedFare}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Driver Lifecycle Action Controls (Phase 6) */}
                  <div className="pt-4 border-t border-[#d4d8ee]/70">
                    <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-3">
                      Trip Controls
                    </span>

                    {activePool.status === "MATCHING" && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleLifecycleTransition("accept")}
                        disabled={isTransitioning}
                        className="w-full py-3.5 px-6 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.15)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isTransitioning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Accept Pool Dispatch (Jashim)
                      </motion.button>
                    )}

                    {activePool.status === "ACCEPTED" && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleLifecycleTransition("arrive")}
                        disabled={isTransitioning}
                        className="w-full py-3.5 px-6 rounded-full bg-accent hover:bg-blue-600 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(59,130,246,0.25)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isTransitioning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Navigation className="w-4 h-4" />
                        )}
                        Mark Arrival at Pickup ({activePool.pickupZone})
                      </motion.button>
                    )}

                    {activePool.status === "DRIVER_ARRIVED" && (
                      <div className="space-y-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleLifecycleTransition("start")}
                          disabled={isTransitioning}
                          className="w-full py-3.5 px-6 rounded-full bg-accent hover:bg-blue-600 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(59,130,246,0.25)] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isTransitioning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                          Start Trip &bull; In Transit
                        </motion.button>
                        <p className="text-[11px] text-ink-muted text-center font-medium">
                          Locks passenger cancellation &bull; Commences shared commute
                        </p>
                      </div>
                    )}

                    {activePool.status === "STARTED" && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleLifecycleTransition("complete")}
                        disabled={isTransitioning}
                        className="w-full py-3.5 px-6 rounded-full bg-success hover:bg-emerald-600 text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(16,185,129,0.25)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isTransitioning ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Complete Trip &bull; All Dropped Off
                      </motion.button>
                    )}

                    {activePool.status === "COMPLETED" && (
                      <div className="p-6 rounded-3xl glass-card border border-success/30 text-ink text-center space-y-2.5">
                        <CheckCircle2 className="w-8 h-8 mx-auto text-success" />
                        <p className="font-bold text-base text-ink">Trip Completed Successfully!</p>
                        <p className="text-xs text-ink-muted">
                          Bullet is now ready to be dispatched on new shared corridors.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActivePool(null)}
                          className="mt-2 px-6 py-2.5 rounded-full bg-white/80 hover:bg-white text-ink text-xs font-semibold uppercase tracking-wider transition-colors border border-white/90 shadow-sm"
                        >
                          Dismiss &amp; Stand By
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty State (Design.md §3) */
                <div className="py-14 px-4 rounded-3xl glass border border-dashed border-[#c5cbee] text-center space-y-2.5">
                  <p className="text-sm font-bold text-ink">No active pool currently assigned</p>
                  <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
                    When passengers like Nusrat (Banani &rarr; Mohakhali) or Rafiq (Banani &rarr; Gulshan 1)
                    request rides, matched pooling trips will appear here with live seat occupancy.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#d4d8ee] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-ink-muted">
        <span>Dhaka Tesla Pool &bull; Vehicle &amp; Pooling Module</span>
        <div className="flex gap-4">
          <Link href="/driver/payment-history" className="hover:text-ink transition-colors font-medium">
            Payment History
          </Link>
          <Link href="/" className="hover:text-ink transition-colors font-medium">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
