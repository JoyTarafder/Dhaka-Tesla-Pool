"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BrandLogo } from "@/components/BrandLogo";

export default function HomePage() {
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
      {/* 1. VoltPeak Light Glass Navigation Bar (Design.md §2.1) */}
      <header className="sticky top-3 sm:top-4 z-50 flex justify-between items-center px-5 sm:px-8 py-3.5 rounded-full glass border border-white/80 shadow-card backdrop-blur-xl">
        {/* Brand Logo */}
        <BrandLogo />

        {/* Centered Navigation Links (Design.md §2.1) */}
        <nav className="hidden md:flex items-center gap-7 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <Link href="#hero" className="hover:text-ink transition-colors">
            Home
          </Link>
          <Link href="#how-it-works" className="hover:text-ink transition-colors">
            How It Works
          </Link>
          <Link href="#fares" className="hover:text-ink transition-colors">
            Fares
          </Link>
          <Link href="#safety" className="hover:text-ink transition-colors">
            Support
          </Link>
        </nav>

        {/* Right Auth Action */}
        <div className="flex items-center gap-3">
          {isAuthLoading && !user ? (
            <div className="w-24 h-8 rounded-full bg-white/60 animate-pulse border border-white" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-ink block">{user.name}</span>
                <span className="text-[10px] text-accent font-mono uppercase tracking-wider font-semibold">
                  {user.role}
                </span>
              </div>
              <Link
                href={user.role === "DRIVER" ? "/driver" : "/passenger"}
                className="px-4 py-2 rounded-full bg-black text-white hover:bg-zinc-800 text-[11px] font-semibold uppercase tracking-wider transition-all shadow-sm"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-full bg-white/70 border border-[#d4d8ee] text-ink-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-all cursor-pointer shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-muted hover:text-ink px-2 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="px-5 py-2.5 rounded-full bg-black text-white hover:bg-zinc-800 text-[12px] font-semibold uppercase tracking-[0.08em] transition-all shadow-md active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section (VoltPeak Reference Style, Design.md §2.1 & §4.9) */}
      <section id="hero" className="my-8 sm:my-14 lg:my-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
        {/* Left Column: Bold Headline & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="lg:col-span-5 space-y-6 text-left z-10"
        >
          {/* Top Pill Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/70 border border-white text-ink text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Electric Corridor Commute
          </div>

          {/* 2-Line Bold Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.03em] text-ink leading-[1.04]">
            Share the Ride. <br />
            <span className="text-accent">Split the Fare.</span>
          </h1>

          {/* Sub Text */}
          <p className="text-sm sm:text-base text-ink-muted max-w-[420px] leading-relaxed font-normal">
            Dhaka&apos;s smart electric carpooling network. Match with verified riders on your corridor,
            lock your guaranteed seat in Bullet, and split costs fairly.
          </p>

          {/* Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            {user ? (
              <Link
                href={user.role === "DRIVER" ? "/driver" : "/passenger"}
                className="px-7 py-3.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-[0.08em] transition-all shadow-pill flex items-center gap-2 group"
              >
                <span>{user.role === "DRIVER" ? "Driver Console" : "Request a Ride"}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-7 py-3.5 rounded-full bg-black text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-[0.08em] transition-all shadow-pill flex items-center gap-2 group"
                >
                  <span>Request a Ride</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="px-6 py-3.5 rounded-full bg-white/70 hover:bg-white border border-white/80 text-ink text-xs font-semibold uppercase tracking-[0.08em] transition-all shadow-sm"
                >
                  How It Works
                </Link>
              </>
            )}
          </div>

          {/* Micro Stat Feature */}
          <div className="pt-4 flex items-center gap-5 text-xs text-ink-muted">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Zero Overbooking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>Integer Poisha Math</span>
            </div>
          </div>
        </motion.div>

        {/* Right/Center Column: Hero Visual with Tesla Bullet EV & Floating Callouts (Design.md §2.1) */}
        <div className="lg:col-span-7 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
          {/* Subtle Decorative Arc Background Ring */}
          <div className="absolute w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full border border-white/60 pointer-events-none -z-0" />
          <div className="absolute w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] rounded-full bg-gradient-to-tr from-accent/15 via-white/40 to-transparent blur-2xl pointer-events-none -z-0" />

          {/* Central Car Image with Floor Shadow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[580px] mx-auto"
          >
            <div className="relative">
              {/* Soft Ground Contact Shadow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-slate-900/20 rounded-full blur-xl pointer-events-none" />
              <Image
                src="/bullet-ev.png"
                alt="Bullet Electric Vehicle"
                width={1142}
                height={437}
                priority
                className="w-full h-auto object-contain relative z-10 drop-shadow-[0_20px_25px_rgba(20,25,45,0.22)]"
              />
            </div>
          </motion.div>

          {/* Floating Callout 1: Seat Pooling (Design.md §2.1) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="absolute top-2 left-0 sm:left-4 z-20 p-3 sm:p-3.5 rounded-2xl glass border border-white/80 shadow-card max-w-[190px]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                Seat Pooling
              </span>
            </div>
            <p className="text-xs font-bold text-ink">3-Seat Bullet</p>
            <p className="text-[11px] text-ink-muted mt-0.5">Strict capacity checks prevent overbooking.</p>
          </motion.div>

          {/* Floating Callout 2: Fare Breakdown (Design.md §2.1) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25 }}
            className="absolute -bottom-2 sm:bottom-4 left-2 sm:left-12 z-20 p-3 sm:p-3.5 rounded-2xl glass border border-white/80 shadow-card max-w-[210px]"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-success">
                Fare Breakdown
              </span>
              <span className="text-[10px] font-mono font-bold text-success bg-success-soft px-1.5 py-0.5 rounded-full">
                -20% POOL
              </span>
            </div>
            <p className="text-xs font-bold text-ink">Corridor Discount</p>
            <p className="text-[11px] text-ink-muted">Per-seat poisha fare without surge pricing.</p>
          </motion.div>

          {/* Floating Callout 3: Live Status (Design.md §2.1) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
            className="absolute top-6 right-0 sm:right-2 z-20 p-3 sm:p-3.5 rounded-2xl glass border border-white/80 shadow-card max-w-[190px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Live Status
              </span>
            </div>
            <p className="text-xs font-bold text-ink">Bullet En Route</p>
            <p className="text-[11px] text-ink-muted font-mono mt-0.5">Banani &rarr; Mohakhali</p>
          </motion.div>
        </div>
      </section>

      {/* 3. Social Proof & Key Metric Bar (Design.md §2.1) */}
      <section className="my-6 p-5 sm:p-6 rounded-2xl glass border border-white/80 shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Overlapping Avatar Stack (Nusrat, Rafiq, Shirin) */}
          <div className="flex -space-x-2.5 items-center">
            <div
              className="h-10 w-10 rounded-full ring-2 ring-white bg-[#10b981] text-white flex items-center justify-center font-bold text-xs shadow-sm"
              title="Nusrat"
            >
              N
            </div>
            <div
              className="h-10 w-10 rounded-full ring-2 ring-white bg-[#0b0b0c] text-white flex items-center justify-center font-bold text-xs shadow-sm"
              title="Rafiq"
            >
              R
            </div>
            <div
              className="h-10 w-10 rounded-full ring-2 ring-white bg-[#3b82f6] text-white flex items-center justify-center font-bold text-xs shadow-sm"
              title="Shirin"
            >
              S
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-ink">Nusrat, Rafiq, Shirin &amp; more</span>
            </div>
            <span className="text-xs text-ink-muted">Active passengers pooling on the Banani corridor</span>
          </div>
        </div>

        <div className="flex items-center gap-6 sm:gap-10 border-t sm:border-t-0 sm:border-l border-[#d4d8ee] pt-4 sm:pt-0 sm:pl-8 w-full sm:w-auto justify-around sm:justify-end">
          <div>
            <span className="text-xl sm:text-2xl font-black text-ink font-mono block">500+</span>
            <span className="text-[11px] text-ink-muted uppercase tracking-wider">Riders daily</span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-accent font-mono block">3 Seats</span>
            <span className="text-[11px] text-ink-muted uppercase tracking-wider">Zero Overbook</span>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-success font-mono block">20%</span>
            <span className="text-[11px] text-ink-muted uppercase tracking-wider">Pool Savings</span>
          </div>
        </div>
      </section>

      {/* 4. Feature Cards (Design.md §2 & §1.1) */}
      <section id="how-it-works" className="my-8 sm:my-12 space-y-6">
        <div className="text-left space-y-1">
          <span className="text-[11px] font-bold text-accent uppercase tracking-[0.08em]">
            Purposeful Technology
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            How Dhaka Tesla Pool Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl glass border border-white/80 hover:shadow-card-hover transition-all duration-300 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-ink text-base">Transactional Capacity</h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Enforced at the PostgreSQL transaction level. Row-locking ensures Bullet never exceeds its
              exact 3-seat threshold.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass border border-white/80 hover:shadow-card-hover transition-all duration-300 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-success-soft text-success flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-ink text-base">Corridor Matching</h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Overlapping commutes along Banani, Mohakhali, and Gulshan 1 are pooled smoothly without
              unnecessary detours.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass border border-white/80 hover:shadow-card-hover transition-all duration-300 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-ink text-base">Fair Individual Fares</h3>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Every passenger pays strictly for their traveled distance, plus an instant 20% pool discount,
              calculated in integer poisha.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Minimal Clean Footer */}
      <footer className="pt-8 pb-4 border-t border-[#d4d8ee]/80 flex flex-col sm:flex-row justify-between items-center text-xs text-ink-muted gap-3 text-center sm:text-left">
        <span>&copy; {new Date().getFullYear()} Dhaka Tesla Pool. Electric Corridor Fleet.</span>
        <span className="font-mono text-[11px] text-ink-muted/80">
          VoltPeak Architecture &bull; Integer Poisha Precision
        </span>
      </footer>
    </main>
  );
}
