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
    <div className="h-screen w-full flex items-center justify-center p-3 sm:p-4 overflow-hidden relative text-ink">
      <div className="w-full max-w-md glass-card border border-white/80 p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(20,25,45,0.08)] space-y-4 max-h-[96vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10">
        {/* Navigation back to home */}
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink font-medium transition-colors py-1 px-2 rounded-full hover:bg-white/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[10px] sm:text-[11px] font-mono text-accent uppercase tracking-widest font-bold">Dhaka Tesla Pool</span>
        </div>

        <div className="text-center space-y-1.5">
          <div className="inline-flex p-2.5 rounded-full bg-black text-white shadow-sm mb-1">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Create an Account</h2>
          <p className="text-xs text-ink-muted">Join Dhaka Tesla Pool as a passenger or driver</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl glass-elevated border-l-4 border-l-danger text-danger text-xs flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("PASSENGER")}
                className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === "PASSENGER"
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white/70 border-white/90 text-ink-muted hover:bg-white hover:text-ink"
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold">Passenger</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("DRIVER")}
                className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  role === "DRIVER"
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white/70 border-white/90 text-ink-muted hover:bg-white hover:text-ink"
                }`}
              >
                <Car className="w-4 h-4" />
                <span className="text-xs font-semibold">Driver</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nusrat Jahan"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[#d4d8ee] text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nusrat@example.com"
              className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[#d4d8ee] text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1.5">
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
                className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white/80 border border-[#d4d8ee] text-ink placeholder:text-ink-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink transition-colors p-1 rounded-md focus:outline-none"
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
            className="w-full py-3 px-6 rounded-full bg-black text-white font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider mt-2 shadow-[0_8px_24px_rgba(0,0,0,0.15)] active:scale-[0.98] cursor-pointer"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="pt-2 border-t border-[#d4d8ee]/70 flex items-center justify-center text-center text-xs text-ink-muted">
          <div>
            Already have an account?{" "}
            <Link href="/auth/login" className="text-accent hover:text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}