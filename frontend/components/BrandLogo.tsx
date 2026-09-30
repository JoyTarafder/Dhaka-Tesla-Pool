"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

interface BrandLogoProps {
  href?: string;
  badge?: string;
  className?: string;
}

/**
 * Unified Brand Logo Component (Design.md §2.1)
 * Standardizes the Dhaka Tesla Pool logo mark (Electric blue Zap badge + bold uppercase brand title)
 * across the Home page, Passenger console, Driver dashboard, and Auth views.
 */
export function BrandLogo({ href = "/", badge, className = "" }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Link href={href} className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-md shadow-accent/25 group-hover:scale-105 transition-transform shrink-0">
          <Zap className="w-4 h-4 fill-white text-white" />
        </div>
        <span className="text-sm sm:text-base font-bold tracking-tight text-ink uppercase whitespace-nowrap">
          Dhaka Tesla Pool
        </span>
      </Link>
      {badge && (
        <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/25 whitespace-nowrap">
          {badge}
        </span>
      )}
    </div>
  );
}
