"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@/components/ui/loader";

// Demo/local bypass: without a real Google session we still want the
// dashboard usable (local demo, offline classrooms). Set
// NEXT_PUBLIC_DEMO_LOGIN=1 to enter as a "Demo Teacher".
const DEMO_LOGIN = process.env.NEXT_PUBLIC_DEMO_LOGIN === "1";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !DEMO_LOGIN) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (!DEMO_LOGIN && (loading || !user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
