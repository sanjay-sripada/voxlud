import { redirect } from "next/navigation";
import PromptInput from "@/components/PromptInput";
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
    <div className="relative mx-auto max-w-3xl px-6 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[100px]" />
      </div>

      <div className="relative text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-indigo-400">
          Create
        </p>
        <h1 className="mb-4 text-4xl font-bold">Make a game</h1>
        <p className="mb-2 text-zinc-400">
          Describe your game in plain English. Voxlud generates a playable browser game you can
          test, share, and iterate on instantly.
        </p>
        <p className="mb-10 text-sm text-indigo-400">Signed in as {profile.name}</p>
      </div>

      <PromptInput
        large
        placeholder="e.g. A two-player pong game where paddles shrink after every point"
        examples={examples}
      />

      <div className="relative mt-16 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h2 className="mb-4 font-semibold">Prompt tips</h2>
        <ul className="space-y-3 text-sm text-zinc-400">
          <li>
            <strong className="text-white">Game type + mechanic + theme</strong> — &quot;A space
            shooter where enemies get faster every wave&quot;
          </li>
          <li>
            <strong className="text-white">Add player count</strong> — &quot;4-player online food
            fight with power-ups&quot;
          </li>
          <li>
            <strong className="text-white">Specify controls</strong> — &quot;Tap to flip
            gravity&quot; or &quot;Arrow keys to move&quot;
          </li>
          <li>
            <strong className="text-white">Set the vibe</strong> — &quot;cozy&quot;, &quot;fast&quot;,
            &quot;hard&quot;, &quot;neon&quot;, &quot;retro&quot;
          </li>
        </ul>
      </div>
    </div>
  );
}
