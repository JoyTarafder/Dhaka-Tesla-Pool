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
    <div className="h-screen w-full flex items-center justify-center p-3 sm:p-4 bg-background overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-950/85 backdrop-blur-2xl border border-white/[0.1] p-5 sm:p-7 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-3.5 sm:space-y-4 max-h-[96vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10">
        {/* Navigation back to home */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors py-1 px-2 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400/80 uppercase tracking-widest font-semibold">Dhaka Tesla Pool</span>
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-emerald-400/10 border border-emerald-500/30 text-emerald-400 mb-0.5 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
            <Zap className="w-5 h-5 fill-emerald-400/20" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Create an Account</h2>
          <p className="text-xs text-zinc-400">Join Dhaka Tesla Pool as a passenger or driver</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("PASSENGER")}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === "PASSENGER"
                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                    : "bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-bold">Passenger</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("DRIVER")}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === "DRIVER"
                    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                    : "bg-zinc-900/60 border-white/[0.06] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <Car className="w-4 h-4" />
                <span className="text-xs font-bold">Driver</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nusrat Jahan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/60 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nusrat@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/60 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400/60 text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors p-1 rounded-md focus:outline-none"
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
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 text-zinc-950 font-bold hover:from-emerald-300 hover:to-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-1.5 shadow-[0_0_20px_rgba(52,211,153,0.3)] active:scale-[0.98]"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-center text-center text-xs text-zinc-400">
          <div>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}