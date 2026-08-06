import { Suspense } from "react";
import { redirect } from "next/navigation";
import CreatePageClient from "@/app/create/CreatePageClient";
import { getExamplePrompts } from "@/lib/generator";
import { getAuthProfile } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function CreatePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="mb-4 text-2xl font-bold">Setup required</h1>
        <p className="text-zinc-400">Configure Supabase in .env.local to create games.</p>
      </div>
    );
  }

  const profile = await getAuthProfile();
  if (!profile) {
    redirect("/signin?callbackUrl=/create");
  }

  const examples = getExamplePrompts();

  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
        </div>
      }
    >
      <CreatePageClient userName={profile.name} examples={examples} />
    </Suspense>
  );
}
