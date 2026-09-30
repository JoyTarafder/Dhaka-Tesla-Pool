"use client";

import Link from "next/link";
import { Zap, Users, ShieldCheck, MapPin, LogOut, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto relative">
      {/* Floating Glass Header */}
      <header className="sticky top-3 sm:top-4 z-40 flex justify-between items-center px-4 sm:px-6 py-3 rounded-2xl bg-zinc-950/75 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/25 to-emerald-400/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
            Dhaka Tesla Pool
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthLoading && !user ? (
            <div className="w-24 h-7 rounded-xl bg-zinc-900/60 animate-pulse border border-white/[0.05]" />
          ) : user ? (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="text-right">
                <span className="text-xs sm:text-sm font-bold text-white block">{user.name}</span>
                <span className="text-[10px] sm:text-[11px] text-emerald-400 font-mono tracking-wider font-semibold uppercase">{user.role}</span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/[0.05] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 text-zinc-950 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:from-emerald-300 hover:to-emerald-200 transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="my-10 sm:my-16 space-y-7">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(52,211,153,0.12)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Electric Shared Commute for Dhaka
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12]">
          Smart pooling for <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(52,211,153,0.25)]">
            cleaner, faster
          </span>{" "}
          Dhaka transit.
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed font-normal">
          Share 3-seat electric vehicles along compatible Dhaka corridors.
          Guaranteed seat allocation, zero overbooking, and split fares calculated in integer poisha.
        </p>

        {user ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-white/[0.08] backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">Active Session</span>
              <p className="text-sm font-bold text-white">
                {user.role === "DRIVER" ? "Driver Console Ready" : "Passenger Ride Booking Ready"}
              </p>
            </div>
            <Link
              href={user.role === "DRIVER" ? "/driver" : "/passenger"}
              className="inline-flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 text-zinc-950 px-4 py-2.5 rounded-xl hover:from-emerald-300 hover:to-emerald-200 transition-all shadow-[0_0_18px_rgba(52,211,153,0.25)] w-full sm:w-auto text-center active:scale-[0.98]"
            >
              Enter {user.role === "DRIVER" ? "Driver View" : "Rider View"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <Link
              href="/auth/login"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 text-zinc-950 font-bold hover:from-emerald-300 hover:to-emerald-200 transition-all text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(52,211,153,0.3)] active:scale-[0.98]"
            >
              Try Scenario Login
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/register"
              className="px-5 py-3 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-zinc-300 font-semibold hover:bg-zinc-800 hover:text-white transition-all text-xs sm:text-sm"
            >
              Create Account
            </Link>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-4 sm:pt-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/60 border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 space-y-2.5 backdrop-blur-md shadow-lg group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(52,211,153,0.25)] transition-all">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Transactional Capacity</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Database row locks prevent overbooking even when Shirin and Rafiq book simultaneously.
            </p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/60 border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 space-y-2.5 backdrop-blur-md shadow-lg group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(52,211,153,0.25)] transition-all">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Corridor Pooling</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Banani Road 11 &rarr; Mohakhali &amp; Gulshan 1 matched on compatible overlapping routes.
            </p>
          </div>
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/60 border border-white/[0.06] hover:border-emerald-500/30 transition-all duration-300 space-y-2.5 backdrop-blur-md shadow-lg group hover:-translate-y-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:shadow-[0_0_16px_rgba(52,211,153,0.25)] transition-all">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm sm:text-base">Individual Fares</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Each passenger pays exclusively for their distance with an automatic 20% pooling discount.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-500 gap-2 sm:gap-4 text-center sm:text-left">
        <span>&copy; {new Date().getFullYear()} Dhaka Tesla Pool. Electric Shared Commute.</span>
        <span className="font-mono text-[11px] text-zinc-600">Zero Overbooking &bull; Integer Poisha Precision</span>
      </footer>
    </main>
  );
}
