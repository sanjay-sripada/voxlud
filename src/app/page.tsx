import Link from "next/link";
import PromptInput from "@/components/PromptInput";
import GameCard from "@/components/GameCard";
import { getExamplePrompts } from "@/lib/generator";
import { getAllGames } from "@/lib/games";
import { isSupabaseConfigured } from "@/lib/env";

export default async function HomePage() {
  const examples = getExamplePrompts();
  let featured: Awaited<ReturnType<typeof getAllGames>> = [];

  if (isSupabaseConfigured()) {
    try {
      const games = await getAllGames();
      featured = games.filter((g) => g.featured).slice(0, 4);
    } catch {
      featured = [];
    }
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-pulse-glow absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-pink-600/10 blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Text to playable game
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
          <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            Voxlud
          </span>
        </h1>

        <p className="mx-auto mb-2 max-w-2xl text-lg text-indigo-300/90 md:text-xl">
          Words into play.
        </p>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl">
          Turn text prompts into party, co-op, competitive, local, online, and solo games.
          Sign up free to create and share your own.
        </p>

        <div className="mx-auto max-w-2xl">
          <PromptInput
            large
            placeholder="Describe your game idea..."
            examples={examples.slice(0, 4)}
          />
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/create"
            className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-8 py-3 font-medium text-white transition hover:opacity-90"
          >
            Make a game
          </Link>
          <Link
            href="/explore"
            className="rounded-full border border-white/10 px-8 py-3 font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
          >
            Explore games
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-indigo-400">
            No-code game generator
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Turn group game ideas into games people can actually play
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Multiplayer games",
              desc: "Create competitive, cooperative, party, and local multiplayer games ready to play and share.",
              icon: "👥",
            },
            {
              title: "Rooms and share links",
              desc: "Generate online multiplayer games to share with friends, classmates, teams, or communities.",
              icon: "🔗",
            },
            {
              title: "Solo games too",
              desc: "Make single-player prototypes, mobile games, puzzles, clickers, or runners first.",
              icon: "🎮",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition hover:border-indigo-500/20"
            >
              <div className="mb-4 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured games */}
      {featured.length > 0 && (
        <section className="relative mx-auto max-w-6xl px-6 py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-sm font-medium uppercase tracking-wider text-pink-400">
                Built for friends
              </p>
              <h2 className="text-3xl font-bold">Featured games</h2>
            </div>
            <Link href="/explore" className="text-sm text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="relative mx-auto max-w-3xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">FAQ</p>
          <h2 className="text-3xl font-bold">AI game maker questions</h2>
        </div>
        <div className="space-y-6">
          {[
            {
              q: "What is Voxlud?",
              a: "Voxlud is an AI game maker that turns written game ideas into playable browser games. Generate competitive, cooperative, party, local multiplayer, and online games without a game engine.",
            },
            {
              q: "Do I need to code?",
              a: "No. Voxlud is built for no-code game creation. Describe the game you want, play it immediately, and keep iterating from there.",
            },
            {
              q: "Can I make solo games too?",
              a: "Yes. Voxlud supports solo games, mobile-friendly games, puzzle games, arcade games, and prototypes alongside multiplayer experiences.",
            },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
              <h3 className="mb-2 font-semibold">{item.q}</h3>
              <p className="text-sm text-zinc-400">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-6xl px-6 py-20 text-center">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 p-12">
          <h2 className="mb-4 text-3xl font-bold">Ready to create your first game?</h2>
          <p className="mb-8 text-zinc-400">Describe any game idea and play it in seconds.</p>
          <Link
            href="/create"
            className="inline-flex rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-8 py-3 font-medium text-white transition hover:opacity-90"
          >
            Start creating — it&apos;s free
          </Link>
        </div>
      </section>
    </div>
  );
}
