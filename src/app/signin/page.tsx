import { Suspense } from "react";
import SignInPageClient from "./SignInPageClient";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <SignInPageClient />
    </Suspense>
  );
}
