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
  const { user, token, logout } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load driver's assigned vehicle and active pool on mount
  const loadDriverData = async () => {
    if (!token || user?.role !== "DRIVER") {
      setIsLoading(false);
      return;
    }

    try {
      const [vehicleRes, poolRes] = await Promise.all([
        apiGetDriverVehicle(token),
        apiGetDriverPools(token).catch(() => ({ pool: null })),
      ]);

      setVehicle(vehicleRes.vehicle);
      setActivePool(poolRes.pool);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Could not load driver console data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
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

  // Guard: Unauthorized state (Design.md §3)
  if (!isLoading && (!user || user.role !== "DRIVER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border text-center space-y-4">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Driver Access Restricted</h2>
          <p className="text-sm text-zinc-400">
            This dashboard is dedicated to drivers like Jashim. Please sign in with a registered driver account.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="py-2.5 px-4 rounded-lg bg-emerald-400 text-black font-semibold text-sm hover:bg-emerald-300 transition-colors"
            >
              Sign In as Driver (Jashim)
            </Link>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
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
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto relative">
      {/* Top Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 flex justify-between items-center px-4 sm:px-6 py-3 rounded-2xl bg-zinc-950/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/25 to-emerald-400/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)] group-hover:scale-105 transition-all">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Dhaka Tesla Pool
            </span>
          </Link>
          <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">
            Driver Console
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/driver/payment-history"
            className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] hover:border-emerald-500/30 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Payment History</span>
          </Link>

          <div className="text-right">
            <span className="text-xs sm:text-sm font-bold text-white block">{user?.name}</span>
            <span className="hidden sm:block text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-semibold">Bullet Pilot</span>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center gap-1.5 text-xs font-semibold"
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
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
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
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-4 md:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        {vehicle?.name || "Bullet"}
                        <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.06]">
                          {vehicle?.registrationNumber || "DHK-TESLA-001"}
                        </span>
                      </h3>
                      <p className="text-[11px] sm:text-xs text-zinc-400">
                        3-Seat Electric Shared Commuter &bull; Banani Corridor
                      </p>
                    </div>
                  </div>

                  {/* Online / Offline Status Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      vehicle?.isOnline
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                        : "bg-zinc-900 border-white/[0.08] text-zinc-400"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        vehicle?.isOnline ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                      }`}
                    />
                    {vehicle?.isOnline ? "Online & Ready" : "Offline"}
                  </div>
                </div>

                {/* 3-Seat Capacity Visualizer (Design.md §4.2) */}
                <div className="pt-4 border-t border-white/[0.06] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-zinc-400">
                    <span className="font-medium text-zinc-300">Physical Seat Occupancy &bull; Bullet (3-Seat EV)</span>
                    <span className="font-mono text-zinc-400 text-[11px]">
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
              <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Shift Availability</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Toggle your status to accept or pause incoming shared ride pools.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={toggleAvailability}
                  disabled={isUpdating}
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    vehicle?.isOnline
                      ? "bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08]"
                      : "bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 text-zinc-950 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
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
                  className="pt-1 flex items-center justify-between text-xs text-zinc-400 hover:text-white transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Payment History &amp; Earnings</span>
                  </span>
                  <span className="text-zinc-600 group-hover:text-emerald-400 font-mono text-[11px]">&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Active Pool Overview (Phase 5 & 6) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-white text-base">Active Pool Dispatch</h3>
                </div>
                {activePool && (
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                    {activePool.status}
                  </span>
                )}
              </div>

              {activePool ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[11px] font-semibold uppercase tracking-wider">Approved Route Corridor</span>
                      <span className="font-bold text-white text-sm">
                        {activePool.pickupZone} &bull; {activePool.routeCode}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-zinc-400 block text-[11px] font-semibold uppercase tracking-wider">Occupancy</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        {activePool.occupiedSeats} / {activePool.totalCapacity} Seats Reserved
                      </span>
                    </div>
                  </div>

                  {/* Passenger Manifest */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                      Pooled Passengers ({activePool.members.length})
                    </span>
                    <div className="divide-y divide-white/[0.05] border border-white/[0.06] rounded-xl overflow-hidden bg-zinc-900/40">
                      {activePool.members.map((member) => (
                        <div
                          key={member.membershipId}
                          className="p-3.5 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{member.passengerName}</span>
                              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-semibold border border-white/[0.05]">
                                {member.seatsReserved} {member.seatsReserved === 1 ? "seat" : "seats"}
                              </span>
                            </div>
                            <div className="text-zinc-400 flex items-center gap-1.5 text-xs">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{member.pickupZone}</span>
                              <span>&rarr;</span>
                              <span>{member.destinationZone}</span>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t border-zinc-800/40 sm:border-0">
                            <span className="text-[11px] text-zinc-500 block">Individual Split Fare</span>
                            <span className="font-mono text-emerald-400 font-bold text-sm">
                              {member.formattedFare}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Driver Lifecycle Action Controls (Phase 6) */}
                  <div className="pt-4 border-t border-white/[0.08]">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
                      Trip Controls
                    </span>

                    {activePool.status === "MATCHING" && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleLifecycleTransition("accept")}
                        disabled={isTransitioning}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 hover:from-emerald-300 hover:to-emerald-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all cursor-pointer disabled:opacity-50"
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
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-400 hover:to-blue-300 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer disabled:opacity-50"
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
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isTransitioning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                          Start Trip &bull; In Transit
                        </motion.button>
                        <p className="text-[11px] text-zinc-500 text-center font-medium">
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
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50"
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
                      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-center space-y-2.5">
                        <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
                        <p className="font-bold text-base text-white">Trip Completed Successfully!</p>
                        <p className="text-xs text-zinc-400">
                          Bullet is now ready to be dispatched on new shared corridors.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActivePool(null)}
                          className="mt-2 px-5 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] hover:bg-zinc-800 text-white text-xs font-semibold transition-colors"
                        >
                          Dismiss &amp; Stand By
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty State (Design.md §3) */
                <div className="py-14 px-4 rounded-2xl bg-zinc-900/30 border border-dashed border-white/[0.08] text-center space-y-2.5">
                  <p className="text-sm font-bold text-zinc-200">No active pool currently assigned</p>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
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
      <footer className="py-4 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-zinc-500">
        <span>Dhaka Tesla Pool &bull; Vehicle &amp; Pooling Module</span>
        <div className="flex gap-4">
          <Link href="/driver/payment-history" className="hover:text-emerald-400 transition-colors">
            Payment History
          </Link>
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
