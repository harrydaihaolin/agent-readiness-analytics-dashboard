/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { AnalyticsClient } from "./client";
import { useSession } from "./session";

interface AnalyticsContextValue {
  client: AnalyticsClient;
  tenantId: string;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

/**
 * Bridges the active session to a configured AnalyticsClient. Components
 * call `useAnalytics()` and never see the token directly.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { session, baseUrl, staticMode } = useSession();
  const value = useMemo<AnalyticsContextValue | null>(() => {
    if (!session) return null;
    return {
      client: new AnalyticsClient({
        token: session.token,
        baseUrl,
        static: staticMode,
      }),
      tenantId: session.tenantId,
    };
  }, [session, baseUrl, staticMode]);
  if (!value) return <>{children}</>;
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error(
      "useAnalytics must be used inside <AnalyticsProvider> with an active session",
    );
  }
  return ctx;
}
