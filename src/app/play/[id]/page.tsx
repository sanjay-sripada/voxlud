import { Suspense } from "react";
import PlayPageClient from "./PlayPageClient";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
        </div>
      }
    >
      <PlayPageClient />
    </Suspense>
  );
}
