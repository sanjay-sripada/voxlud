import { isSupabaseConfigured } from "@/lib/env";
import Link from "next/link";

export default function SetupBanner() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200">
      Supabase is not configured. Copy{" "}
      <code className="rounded bg-black/30 px-1.5 py-0.5">.env.example</code> to{" "}
      <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code> and run the{" "}
      <Link href="https://supabase.com/dashboard" className="underline">
        Supabase setup
      </Link>
      .
    </div>
  );
}
