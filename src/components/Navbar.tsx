import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";

export default function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a12]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-sm font-bold text-white">
            V
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Voxlud</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/explore" className="text-sm text-zinc-400 transition hover:text-white">
            Explore
          </Link>
          <Link href="/my-games" className="text-sm text-zinc-400 transition hover:text-white">
            My Games
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center gap-0.5">
            <Link
              href="/create"
              className="rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:px-5"
            >
              Create game
            </Link>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/90">
              Beta
            </span>
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
}
