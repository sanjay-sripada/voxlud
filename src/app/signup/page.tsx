import { Suspense } from "react";
import SignUpPageClient from "./SignUpPageClient";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">Loading...</div>}>
      <SignUpPageClient />
    </Suspense>
  );
}
