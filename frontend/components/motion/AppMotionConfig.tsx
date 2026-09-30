"use client";

import React from "react";
import { MotionConfig } from "framer-motion";

/**
 * Global Motion Configuration wrapper (Design.md §4)
 * Respects user OS reduced-motion accessibility preference across all animations
 */
export function AppMotionConfig({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
