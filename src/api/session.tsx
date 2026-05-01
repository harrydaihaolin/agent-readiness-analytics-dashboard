/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnalyticsClient } from "./client";

interface Session {
  tenantId: string;
  token: string;
}

interface SessionContextValue {
  session: Session | null;
  baseUrl: string;
  staticMode: boolean;
  signIn: (s: Session) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
}

const STORAGE_KEY = "ar.session.v1";

const SessionContext = createContext<SessionContextValue | null>(null);

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed?.tenantId && parsed?.token) return parsed;
  } catch {
    /* fall through */
  }
  return null;
}

export function SessionProvider({
  baseUrl,
  initial,
  staticMode = false,
  children,
}: {
  baseUrl: string;
  initial?: Session | null;
  staticMode?: boolean;
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(
    initial ?? (staticMode ? null : loadSession()),
  );

  useEffect(() => {
    if (staticMode) return;
    if (session) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [session, staticMode]);

  const signIn = useCallback<SessionContextValue["signIn"]>(
    async (s) => {
      if (staticMode) {
        setSession(s);
        return { ok: true };
      }
      const probe = new AnalyticsClient({ baseUrl, token: s.token });
      const ok = await probe.ping();
      if (!ok) return { ok: false, error: "Cannot reach analytics API." };
      try {
        await probe.overview(s.tenantId);
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status === 401) {
          return { ok: false, error: "Invalid token." };
        }
        if (status === 402) {
          return {
            ok: false,
            error: "Tenant is not on Silver+ tier.",
          };
        }
        return {
          ok: false,
          error:
            err instanceof Error ? err.message : "Sign-in failed.",
        };
      }
      setSession(s);
      return { ok: true };
    },
    [baseUrl, staticMode],
  );

  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo<SessionContextValue>(
    () => ({ session, baseUrl, staticMode, signIn, signOut }),
    [session, baseUrl, staticMode, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <SessionProvider>");
  }
  return ctx;
}
