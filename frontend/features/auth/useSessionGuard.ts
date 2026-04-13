"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSession, roleHome } from "@/services/auth";
import { SessionData, Role } from "@/types";

export function useSessionGuard(requiredRole: Role) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getSession();
    if (!data) {
      router.replace("/login");
      return;
    }
    if (data.user.role !== requiredRole) {
      router.replace(roleHome(data.user.role));
      return;
    }
    setSession(data);
    setLoading(false);
  }, [requiredRole, router]);

  return { session, loading };
}
