"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Users,
  TrendingUp,
  Receipt,
  Car,
  AlertCircle,
  Loader2,
  LogOut,
  Calendar,
  CreditCard,
  Banknote,
  Shield,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import {
  apiGetDriverPaymentHistory,
  DriverPaymentHistoryResponse,
  DriverTripHistory,
  ApiError,
} from "@/lib/api";
import { PaymentHistorySkeleton } from "@/components/motion/SkeletonShimmer";

export default function DriverPaymentHistoryPage() {
  const { user, token, isLoading: isAuthLoading, logout } = useAuth();
  const [data, setData] = useState<DriverPaymentHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPoolId, setExpandedPoolId] = useState<string | null>(null);

  // Load completed trip payment history for the authenticated driver
  useEffect(() => {
    if (isAuthLoading && !user) return;

    if (!token || user?.role !== "DRIVER") {
      if (!isAuthLoading) setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const historyData = await apiGetDriverPaymentHistory(token);
        setData(historyData);
        // Expand the first trip by default if available
        if (historyData.trips.length > 0) {
          setExpandedPoolId(historyData.trips[0].poolId);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load payment history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [token, user, isAuthLoading]);

  // Guard: Auth loading state to prevent unauthorized flash during hydration
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
        <PaymentHistorySkeleton />
      </div>
    );
  }

  // Guard: Unauthorized state for non-drivers
  if (!isLoading && (!user || user.role !== "DRIVER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-border text-center space-y-4">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Driver Access Restricted</h2>
          <p className="text-sm text-zinc-400">
            Payment history is exclusively available to registered drivers. Please sign in with a driver account.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="py-2.5 px-4 rounded-lg bg-emerald-400 text-black font-semibold text-sm hover:bg-emerald-300 transition-colors"
            >
              Sign In as Driver
            </Link>
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const toggleExpand = (poolId: string) => {
    setExpandedPoolId((prev) => (prev === poolId ? null : poolId));
  };

  const summary = data?.summary || {
    totalTrips: 0,
    totalEarningsPoisha: 0,
    formattedTotalEarnings: "৳0.00",
    totalPassengersServed: 0,
  };

  // Calculate average fare per trip using integer arithmetic where possible
  const avgFareFormatted =
    summary.totalTrips > 0
      ? `৳${(Math.round(summary.totalEarningsPoisha / summary.totalTrips) / 100).toFixed(2)}`
      : "৳0.00";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto relative">
      {/* Top Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 flex justify-between items-center px-4 sm:px-6 py-3 rounded-2xl bg-zinc-950/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <Link href="/driver" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/25 to-emerald-400/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)] group-hover:scale-105 transition-all">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Dhaka Tesla Pool
            </span>
          </Link>
          <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ml-1">
            Payment Telemetry
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/driver"
            className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Driver Console</span>
          </Link>

          <div className="hidden md:block text-right">
            <span className="text-xs sm:text-sm font-bold text-white block">
              {user?.name}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider font-semibold">Bullet Pilot</span>
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

      {/* Main Content Area */}
      <main className="my-6 sm:my-8 space-y-6 sm:space-y-7 flex-1">
        {/* Page Title & Context */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Receipt className="w-6 h-6" />
              </div>
              <span>Payment History</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Complete breakdown of collected fares, passenger payments, and trip earnings for Bullet.
            </p>
          </div>

          <Link
            href="/driver"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all"
          >
            <Car className="w-4 h-4" />
            <span>Open Trip Console &rarr;</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Skeleton Loading State */}
        {isLoading ? (
          <PaymentHistorySkeleton />
        ) : (
          <>
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total Earnings */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950/80 border border-emerald-500/30 space-y-2 relative overflow-hidden backdrop-blur-xl shadow-xl shadow-emerald-500/5 group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">Total Earnings</span>
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.25)]">
                  {summary.formattedTotalEarnings}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Gross collected fares</p>
              </div>

              {/* Card 2: Completed Trips */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-2 group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Completed Trips</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {summary.totalTrips}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Successful pool runs</p>
              </div>

              {/* Card 3: Passengers Served */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-2 group hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Passengers</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {summary.totalPassengersServed}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Commuters pooled</p>
              </div>

              {/* Card 4: Avg Trip Fare */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-2 group hover:border-amber-500/30 transition-all">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-bold uppercase tracking-wider">Avg Pool Fare</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {avgFareFormatted}
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">Revenue per trip</p>
              </div>
            </div>

            {/* Trip History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <span>Completed Trips</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {data?.trips.length || 0}
                  </span>
                </h2>
                <span className="text-xs text-zinc-400 hidden sm:inline">
                  Click on any trip to see individual passenger payments
                </span>
              </div>

              {data?.trips && data.trips.length > 0 ? (
                <div className="space-y-3">
                  {data.trips.map((trip: DriverTripHistory) => {
                    const isExpanded = expandedPoolId === trip.poolId;
                    const formattedDate = trip.completedAt
                      ? new Date(trip.completedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recently Completed";

                    return (
                      <motion.div
                        key={trip.poolId}
                        layout
                        className="rounded-2xl bg-zinc-950/70 border border-white/[0.08] overflow-hidden transition-all hover:border-emerald-500/30 backdrop-blur-xl shadow-lg"
                      >
                        {/* Trip Summary Row */}
                        <div
                          onClick={() => toggleExpand(trip.poolId)}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer select-none"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                                {trip.routeCode.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                {formattedDate}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-zinc-400">
                              <span>
                                Pickup: <strong className="text-zinc-200">{trip.pickupZone}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Passengers: <strong className="text-zinc-200">{trip.totalPassengers}</strong> ({trip.totalSeats} seats)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                            <div className="text-left sm:text-right">
                              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                                {trip.formattedTotalFare}
                              </div>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                                Total Collected
                              </span>
                            </div>

                            <div className="p-2 rounded-xl bg-zinc-900 border border-white/[0.06] text-zinc-400 hover:text-white transition-colors">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Passenger Breakdown Dropdown */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-white/[0.06] bg-zinc-950/80 p-4 sm:p-5 space-y-3"
                            >
                              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                Passenger Fare Breakdown
                              </div>

                              <div className="space-y-2">
                                {trip.breakdown.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-xs">
                                        {item.passengerName.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold text-white">
                                          {item.passengerName}
                                        </div>
                                        <div className="text-xs text-zinc-400 flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-emerald-400" />
                                          <span>{item.pickupZone} &rarr; {item.destinationZone}</span>
                                          <span className="text-zinc-600">&bull;</span>
                                          <span>{item.seats} {item.seats === 1 ? "seat" : "seats"}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                                      {/* Payment Method Badge */}
                                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
                                        {item.paymentMethod === "TESLA_PAY" ? (
                                          <>
                                            <CreditCard className="w-3 h-3 text-emerald-400" />
                                            <span>TeslaPay</span>
                                          </>
                                        ) : (
                                          <>
                                            <Banknote className="w-3 h-3 text-amber-400" />
                                            <span>Cash</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Paid Status */}
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {item.paymentStatus}
                                      </span>

                                      {/* Individual Fare Amount */}
                                      <span className="text-sm font-bold text-white font-mono">
                                        {item.formattedFare}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                /* Empty State */
                <div className="p-8 sm:p-14 rounded-2xl bg-zinc-950/70 backdrop-blur-xl border border-zinc-800/80 text-center space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="p-4 w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-glow-sm">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-lg font-bold text-white tracking-tight">No Payment History Yet</h3>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                      When you accept ride pools and complete passenger drops with Bullet, your fare earnings and transaction receipts will be archived here.
                    </p>
                  </div>
                  <div className="pt-2 relative z-10">
                    <Link
                      href="/driver"
                      className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-black font-semibold text-xs sm:text-sm hover:from-emerald-300 hover:to-teal-300 transition-all shadow-glow-sm hover:shadow-glow active:scale-[0.98]"
                    >
                      <Car className="w-4 h-4" />
                      <span>Open Live Driver Console</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-zinc-500">
        <p>&copy; {new Date().getFullYear()} Dhaka Tesla Pool &bull; Driver Payment Telemetry.</p>
        <div className="flex gap-4">
          <Link href="/driver" className="hover:text-emerald-400 transition-colors">
            Driver Console
          </Link>
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
