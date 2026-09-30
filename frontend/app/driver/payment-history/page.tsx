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
import { BrandLogo } from "@/components/BrandLogo";
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
      <div className="min-h-screen text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <PaymentHistorySkeleton />
      </div>
    );
  }

  // Guard: Unauthorized state for non-drivers
  if (!isLoading && (!user || user.role !== "DRIVER")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card border border-white/80 text-center space-y-4 shadow-[0_20px_50px_rgba(20,25,45,0.08)]">
          <div className="p-3 w-12 h-12 mx-auto rounded-full bg-danger/10 text-danger flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-ink">Driver Access Restricted</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Payment history is exclusively available to registered drivers. Please sign in with a driver account.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/auth/login"
              className="py-3 px-6 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-sm"
            >
              Sign In as Driver
            </Link>
            <Link href="/" className="text-xs text-ink-muted hover:text-ink font-medium">
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
    <div className="min-h-screen text-ink flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
      {/* Top Navbar */}
      <header className="sticky top-3 sm:top-4 z-40 flex justify-between items-center px-5 sm:px-8 py-3.5 rounded-full glass border border-white/80 shadow-card">
        <BrandLogo href="/driver" badge="Payment Telemetry" />

        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/driver"
            className="px-3.5 py-1.5 rounded-full bg-white/80 border border-white/90 text-ink hover:bg-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Driver Console</span>
          </Link>

          <div className="hidden md:block text-right">
            <span className="text-xs sm:text-sm font-bold text-ink block">
              {user?.name}
            </span>
            <span className="text-[10px] text-accent font-mono uppercase tracking-wider font-semibold">Driver</span>
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

      {/* Main Content Area */}
      <main className="my-6 sm:my-8 space-y-6 sm:space-y-7 flex-1">
        {/* Page Title & Context */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                <Receipt className="w-6 h-6" />
              </div>
              <span>Payment History</span>
            </h1>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Complete breakdown of collected fares, passenger payments, and trip earnings for Bullet.
            </p>
          </div>

          <Link
            href="/driver"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-blue-600 px-4 py-2 rounded-full bg-white/80 border border-white/90 shadow-sm transition-all"
          >
            <Car className="w-4 h-4" />
            <span>Open Trip Console &rarr;</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl glass-elevated border-l-4 border-l-danger text-danger text-xs sm:text-sm flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
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
              <div className="p-4 sm:p-5 rounded-3xl glass-card border border-white/80 shadow-[0_10px_35px_rgba(20,25,45,0.05)] space-y-2 relative overflow-hidden group hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Total Earnings</span>
                  <div className="p-2 rounded-2xl bg-accent/10 text-accent">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-accent font-mono tracking-tight">
                  {summary.formattedTotalEarnings}
                </div>
                <p className="text-[11px] text-ink-muted font-medium">Gross collected fares</p>
              </div>

              {/* Card 2: Completed Trips */}
              <div className="p-4 sm:p-5 rounded-3xl glass-card border border-white/80 shadow-[0_10px_35px_rgba(20,25,45,0.05)] space-y-2 group hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs font-bold uppercase tracking-wider">Completed Trips</span>
                  <div className="p-2 rounded-2xl bg-accent/10 text-accent">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-ink font-mono tracking-tight">
                  {summary.totalTrips}
                </div>
                <p className="text-[11px] text-ink-muted font-medium">Successful pool runs</p>
              </div>

              {/* Card 3: Passengers Served */}
              <div className="p-4 sm:p-5 rounded-3xl glass-card border border-white/80 shadow-[0_10px_35px_rgba(20,25,45,0.05)] space-y-2 group hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs font-bold uppercase tracking-wider">Passengers</span>
                  <div className="p-2 rounded-2xl bg-accent/10 text-accent">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-ink font-mono tracking-tight">
                  {summary.totalPassengersServed}
                </div>
                <p className="text-[11px] text-ink-muted font-medium">Commuters pooled</p>
              </div>

              {/* Card 4: Avg Trip Fare */}
              <div className="p-4 sm:p-5 rounded-3xl glass-card border border-white/80 shadow-[0_10px_35px_rgba(20,25,45,0.05)] space-y-2 group hover:border-accent/40 transition-all">
                <div className="flex items-center justify-between text-ink-muted">
                  <span className="text-xs font-bold uppercase tracking-wider">Avg Pool Fare</span>
                  <div className="p-2 rounded-2xl bg-accent/10 text-accent">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-bold text-ink font-mono tracking-tight">
                  {avgFareFormatted}
                </div>
                <p className="text-[11px] text-ink-muted font-medium">Revenue per trip</p>
              </div>
            </div>

            {/* Trip History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-ink flex items-center gap-2">
                  <span>Completed Trips</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
                    {data?.trips.length || 0}
                  </span>
                </h2>
                <span className="text-xs text-ink-muted hidden sm:inline">
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
                        className="rounded-3xl glass-card border border-white/80 overflow-hidden transition-all hover:border-accent/30 shadow-[0_8px_30px_rgba(20,25,45,0.04)]"
                      >
                        {/* Trip Summary Row */}
                        <div
                          onClick={() => toggleExpand(trip.poolId)}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 cursor-pointer select-none"
                        >
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-bold">
                                {trip.routeCode.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-ink-muted flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-ink-muted" />
                                {formattedDate}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-ink-muted font-medium">
                              <span>
                                Pickup: <strong className="text-ink">{trip.pickupZone}</strong>
                              </span>
                              <span>&bull;</span>
                              <span>
                                Passengers: <strong className="text-ink">{trip.totalPassengers}</strong> ({trip.totalSeats} seats)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#d4d8ee]/60">
                            <div className="text-left sm:text-right">
                              <div className="text-lg sm:text-xl font-bold text-accent font-mono">
                                {trip.formattedTotalFare}
                              </div>
                              <span className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold block">
                                Total Collected
                              </span>
                            </div>

                            <div className="p-2 rounded-full bg-white/80 border border-white text-ink-muted hover:text-ink transition-colors shadow-sm">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Passenger Breakdown Dropdown */}
                        <AnimatePresence mode="wait">
                          {isExpanded && (
                            <motion.div
                              key={`trip-breakdown-${trip.poolId}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-[#d4d8ee]/70 bg-white/50 p-4 sm:p-5 space-y-3"
                            >
                              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                                Passenger Fare Breakdown
                              </div>

                              <div className="space-y-2">
                                {trip.breakdown.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3.5 rounded-2xl bg-white/80 border border-white flex flex-col sm:flex-row justify-between sm:items-center gap-2 shadow-sm"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#d4d8ee] text-ink font-bold flex items-center justify-center text-xs">
                                        {item.passengerName.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-ink">
                                          {item.passengerName}
                                        </div>
                                        <div className="text-xs text-ink-muted flex items-center gap-1 font-medium">
                                          <MapPin className="w-3 h-3 text-accent" />
                                          <span>{item.pickupZone} &rarr; {item.destinationZone}</span>
                                          <span className="text-ink-muted/50">&bull;</span>
                                          <span>{item.seats} {item.seats === 1 ? "seat" : "seats"}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                                      {/* Payment Method Badge */}
                                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#d4d8ee] text-[11px] text-ink font-medium">
                                        {item.paymentMethod === "TESLA_PAY" ? (
                                          <>
                                            <CreditCard className="w-3 h-3 text-accent" />
                                            <span>TeslaPay</span>
                                          </>
                                        ) : (
                                          <>
                                            <Banknote className="w-3 h-3 text-amber-500" />
                                            <span>Cash</span>
                                          </>
                                        )}
                                      </div>

                                      {/* Paid Status */}
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                                        {item.paymentStatus}
                                      </span>

                                      {/* Individual Fare Amount */}
                                      <span className="text-sm font-bold text-accent font-mono">
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
                <div className="p-8 sm:p-14 rounded-3xl glass border border-dashed border-[#c5cbee] text-center space-y-4 shadow-sm">
                  <div className="p-4 w-16 h-16 mx-auto rounded-full bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
                    <Receipt className="w-8 h-8" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <h3 className="text-lg font-bold text-ink tracking-tight">No Payment History Yet</h3>
                    <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                      When you accept ride pools and complete passenger drops with Bullet, your fare earnings and transaction receipts will be archived here.
                    </p>
                  </div>
                  <div className="pt-2 relative z-10">
                    <Link
                      href="/driver"
                      className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-black hover:bg-zinc-800 text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-sm"
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
      <footer className="pt-6 border-t border-[#d4d8ee] flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-ink-muted">
        <p>&copy; {new Date().getFullYear()} Dhaka Tesla Pool &bull; Driver Payment Telemetry.</p>
        <div className="flex gap-4">
          <Link href="/driver" className="hover:text-ink transition-colors font-medium">
            Driver Console
          </Link>
          <Link href="/" className="hover:text-ink transition-colors font-medium">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
