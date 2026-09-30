"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick fill demo accounts for Dhaka Tesla Pool assessment scenario
  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
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
          <div className="inline-flex p-2.5 rounded-full bg-accent text-white shadow-md shadow-accent/25 mb-1">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">Sign In</h2>
          <p className="text-xs text-ink-muted">Enter your credentials or choose a test persona</p>
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
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Cast Quick Fill Section */}
        <div className="pt-3 border-t border-[#d4d8ee]/70 space-y-2">
          <p className="text-[10px] sm:text-[11px] font-bold text-ink-muted text-center uppercase tracking-wider">
            Quick Persona Login (Evaluation Presets)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials("nusrat@example.com")}
              className="p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-white/90 text-left transition-all group shadow-sm"
            >
              <span className="font-bold text-ink block text-xs group-hover:text-accent transition-colors">Nusrat</span>
              <span className="text-ink-muted text-[10px] block leading-tight">Passenger (Banani)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("rafiq@example.com")}
              className="p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-white/90 text-left transition-all group shadow-sm"
            >
              <span className="font-bold text-ink block text-xs group-hover:text-accent transition-colors">Rafiq</span>
              <span className="text-ink-muted text-[10px] block leading-tight">Passenger (Gulshan)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("shirin@example.com")}
              className="p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-white/90 text-left transition-all group shadow-sm"
            >
              <span className="font-bold text-ink block text-xs group-hover:text-accent transition-colors">Shirin</span>
              <span className="text-ink-muted text-[10px] block leading-tight">Passenger (Racer)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("jashim@example.com")}
              className="p-2.5 rounded-2xl bg-accent/10 hover:bg-accent/15 border border-accent/30 text-left transition-all group shadow-sm"
            >
              <span className="font-bold text-accent block text-xs group-hover:text-blue-600 transition-colors">Jashim</span>
              <span className="text-ink-muted text-[10px] block leading-tight">Driver (Bullet EV)</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-[#d4d8ee]/70 flex items-center justify-center text-center text-xs text-ink-muted">
          <div>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-accent hover:text-blue-600 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
