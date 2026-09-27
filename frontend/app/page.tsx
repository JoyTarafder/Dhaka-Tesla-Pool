"use client";

import Link from "next/link";
import { Zap, Users, ShieldCheck, MapPin, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-8 lg:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Dhaka Tesla Pool</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="text-right">
                <span className="text-xs sm:text-sm font-semibold text-white block">{user.name}</span>
                <span className="text-[11px] sm:text-xs text-emerald-400 font-mono tracking-wider">{user.role}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-xs sm:text-sm font-medium bg-emerald-400 text-black px-3 sm:px-4 py-2 rounded-lg hover:bg-emerald-300 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="my-10 sm:my-16 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Electric Shared Commute for Dhaka
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Smart pooling for <br />
          <span className="text-emerald-400">cleaner, faster</span> Dhaka transit.
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Share 3-seat electric vehicle along compatible Dhaka corridors.
          Guaranteed seat allocation, zero overbooking, and split fares calculated in integer poisha.
        </p>

        {user ? (
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 max-w-lg">
            <div>
              <p className="text-[11px] text-zinc-400">Active Session</p>
              <p className="text-xs sm:text-sm font-semibold text-white">
                {user.role === "DRIVER" ? "Driver Console Ready" : "Passenger Ride Booking Ready"}
              </p>
            </div>
            <Link
              href={user.role === "DRIVER" ? "/driver" : "/passenger"}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-400 text-black px-3.5 py-2 rounded-lg hover:bg-emerald-300 transition-colors w-full sm:w-auto text-center"
            >
              Enter {user.role === "DRIVER" ? "Driver View" : "Rider View"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="pt-2 flex items-center gap-4">
            <Link
              href="/auth/login"
              className="px-5 sm:px-6 py-3 rounded-xl bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition-colors text-xs sm:text-sm flex items-center gap-2"
            >
              Try Scenario Login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-8">
          <div className="p-4 sm:p-5 rounded-xl bg-card border border-border space-y-2">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Transactional Capacity</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Database row locks prevent overbooking even when Shirin and Rafiq book simultaneously.
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-card border border-border space-y-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Corridor Pooling</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Banani Road 11 → Mohakhali &amp; Gulshan 1 matched on compatible overlapping routes.
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-xl bg-card border border-border space-y-2">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Individual Fares</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Each passenger pays exclusively for their distance with an automatic 20% pooling discount.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-border flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 gap-2 sm:gap-4 text-center sm:text-left">
        <span>&copy; {new Date().getFullYear()} Dhaka Tesla Pool. Assessment &amp; Internship Project.</span>
      </footer>
    </main>
  );
}
