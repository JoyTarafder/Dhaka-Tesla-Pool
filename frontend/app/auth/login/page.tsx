"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen flex items-center justify-center p-3.5 sm:p-4 bg-background">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 bg-card border border-border p-5 sm:p-8 rounded-2xl shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 text-emerald-400 mb-1 sm:mb-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Sign In to Dhaka Tesla Pool</h2>
          <p className="text-xs sm:text-sm text-zinc-400">Enter your credentials or choose a story persona</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. nusrat@example.com"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg bg-emerald-400 text-black font-semibold hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Demo Cast Quick Fill Section */}
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs font-medium text-zinc-400 text-center uppercase tracking-wider">
            Quick Persona Login (Evaluation Presets)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials("nusrat@example.com")}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
            >
              <span className="font-semibold text-white block">Nusrat</span>
              <span className="text-zinc-500 text-[11px]">Passenger (Banani)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("rafiq@example.com")}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
            >
              <span className="font-semibold text-white block">Rafiq</span>
              <span className="text-zinc-500 text-[11px]">Passenger (Gulshan)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("shirin@example.com")}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
            >
              <span className="font-semibold text-white block">Shirin</span>
              <span className="text-zinc-500 text-[11px]">Passenger (Racer)</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("jashim@example.com")}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left transition-colors"
            >
              <span className="font-semibold text-emerald-400 block">Jashim</span>
              <span className="text-zinc-500 text-[11px]">Driver (Bullet)</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-emerald-400 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
