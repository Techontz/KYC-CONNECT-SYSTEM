import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginScreen } from "@/components/auth/LoginScreen";

export const metadata: Metadata = { title: "Ingia / Sign in" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen showDemo={process.env.NODE_ENV !== "production"} />
    </Suspense>
  );
}
