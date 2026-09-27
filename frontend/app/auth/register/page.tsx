"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, AlertCircle, Loader2, User, Car, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"PASSENGER" | "DRIVER">("PASSENGER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register(name, email, password, role);
      router.push("/");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-3 sm:p-4 bg-background overflow-hidden">
      <div className="w-full max-w-md bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-xl space-y-3 sm:space-y-3.5 max-h-[96vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Navigation back to home */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Dhaka Tesla Pool</span>
        </div>

        <div className="text-center space-y-1">
          <div className="inline-flex p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mb-0.5">
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">Create an Account</h2>
          <p className="text-xs text-zinc-400">Join Dhaka Tesla Pool as a passenger or driver</p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("PASSENGER")}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  role === "PASSENGER"
                    ? "bg-emerald-500/10 border-emerald-400 text-emerald-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold">Passenger</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("DRIVER")}
                className={`py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  role === "DRIVER"
                    ? "bg-emerald-500/10 border-emerald-400 text-emerald-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <Car className="w-4 h-4" />
                <span className="text-xs font-semibold">Driver</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nusrat Jahan"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nusrat@example.com"
              className="w-full px-3.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-3.5 pr-10 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1 rounded-md focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-1"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-center text-center text-xs text-zinc-400 gap-2">
          <div>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-400 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}