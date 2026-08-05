"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

function getDisplayName(user: { user_metadata?: Record<string, string>; email?: string | null }) {
  const meta = user.user_metadata ?? {};
  return meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Player";
}

export default function AuthButtons() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded-full bg-white/5" />;
  }

  if (user) {
    const name = getDisplayName(user);
    const avatar = user.user_metadata?.avatar_url as string | undefined;

    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/my-games"
          className="hidden rounded-full px-3 py-2 text-sm text-zinc-400 transition hover:text-white sm:inline-flex"
        >
          My games
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          {avatar ? (
            <img src={avatar} alt="" className="h-7 w-7 rounded-full border border-white/10" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-medium">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="max-w-[120px] truncate text-sm text-zinc-400">{name}</span>
        </div>
        <Link
          href="/create"
          className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:px-5"
        >
          Make a game
        </Link>
        <button
          onClick={() => signOut().then(() => window.location.assign("/"))}
          className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-400 transition hover:border-white/20 hover:text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/signin"
        className="rounded-full px-4 py-2 text-sm text-zinc-400 transition hover:text-white"
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:px-5"
      >
        Get started
      </Link>
    </div>
  );
}

export function GoogleSignInButton({
  label = "Continue with Google",
  callbackUrl = "/create",
}: {
  label?: string;
  callbackUrl?: string;
}) {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {label}
    </button>
  );
}
