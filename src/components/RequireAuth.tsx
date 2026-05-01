import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/api/session";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const loc = useLocation();
  if (!session) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <>{children}</>;
}
