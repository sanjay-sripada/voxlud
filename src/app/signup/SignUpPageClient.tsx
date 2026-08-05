"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GoogleSignInButton } from "@/components/AuthButtons";

export default function SignUpPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/create";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push(callbackUrl);
      router.refresh();
      return;
    }

    setConfirmEmail(true);
  };

  if (confirmEmail) {
    return (
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Check your email</h1>
        <p className="text-zinc-400">
          We sent a confirmation link to <strong className="text-white">{email}</strong>.
          Click it to activate your account.
        </p>
        <Link href="/signin" className="mt-6 text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/2 h-[300px] w-[400px] -translate-x-1/2 rounded-full bg-pink-600/15 blur-[100px]" />
      </div>

      <div className="relative">
        <h1 className="mb-2 text-center text-3xl font-bold">Create your account</h1>
        <p className="mb-8 text-center text-zinc-400">
          Sign up to turn your game ideas into playable browser games
        </p>

        <div className="space-y-4">
          {error && <p className="text-sm text-red-400">{error}</p>}

          <GoogleSignInButton label="Sign up with Google" callbackUrl={callbackUrl} onError={setError} />

          <div className="relative flex items-center py-2">
            <div className="flex-1 border-t border-white/10" />
            <span className="px-4 text-xs text-zinc-500">or sign up with email</span>
            <div className="flex-1 border-t border-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm text-zinc-400">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-indigo-500/50"
                placeholder="Your name"
              />
            </div>
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
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-indigo-500/50"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
