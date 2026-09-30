import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { AppMotionConfig } from "@/components/motion/AppMotionConfig";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Dhaka Tesla Pool",
  description: "Shared ride-pooling for Dhaka with strict capacity enforcement and fair pricing.",
  icons: {
    icon: [{ url: "/brand-icon.svg", type: "image/svg+xml" }],
    shortcut: "/brand-icon.svg",
    apple: "/brand-icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} text-ink antialiased min-h-screen selection:bg-accent/20`}>
        <AuthProvider>
          <AppMotionConfig>{children}</AppMotionConfig>
        </AuthProvider>
      </body>
    </html>
  );
}
