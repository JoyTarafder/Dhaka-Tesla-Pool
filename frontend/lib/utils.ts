import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to cleanly merge Tailwind CSS classes
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Convert integer poisha to formatted BDT currency string
export function formatPoishaToBdt(poisha: number): string {
  const taka = poisha / 100;
  return `৳${taka.toFixed(2)}`;
}
