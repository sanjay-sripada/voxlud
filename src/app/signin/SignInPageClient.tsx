"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/AuthButtons";

export default function SignInPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/create";
  const authError = searchParams.get("error") === "auth";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(authError ? "Authentication failed. Please try again." : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[100px]" />
      </div>

      <div className="relative">
        <h1 className="mb-2 text-center text-3xl font-bold">Welcome back</h1>
        <p className="mb-8 text-center text-zinc-400">Sign in to create and manage your games</p>

        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <GoogleSignInButton callbackUrl={callbackUrl} onError={setError} />

          <div className="relative flex items-center py-2">
            <div className="flex-1 border-t border-white/10" />
            <span className="px-4 text-xs text-zinc-500">or continue with email</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-zinc-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-indigo-500/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm text-zinc-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-indigo-500/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
