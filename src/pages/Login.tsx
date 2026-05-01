import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/Button";
import { useSession } from "@/api/session";
import { color, radius } from "@/design/tokens";

const FORM_FIELD: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const INPUT_STYLE: React.CSSProperties = {
  padding: "8px 10px",
  background: color.bgCanvas,
  color: color.textPrimary,
  border: `1px solid ${color.borderDefault}`,
  borderRadius: radius.button,
  fontSize: 14,
};

export function LoginPage() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const next = search.get("next") ?? "/";

  const [tenantId, setTenantId] = useState(
    () => import.meta.env.VITE_TENANT_ID ?? "",
  );
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn({ tenantId: tenantId.trim(), token: token.trim() });
    setBusy(false);
    if (res.ok) {
      navigate(next, { replace: true });
    } else {
      setError(res.error ?? "Sign-in failed.");
    }
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "10vh auto 0",
        padding: 24,
        background: color.bgSurface,
        border: `1px solid ${color.borderDefault}`,
        borderRadius: radius.card,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <h1 style={{ marginTop: 0, fontSize: 22, color: color.textPrimary }}>
        Sign in
      </h1>
      <p style={{ color: color.textMuted, fontSize: 13, marginTop: -4 }}>
        agent-readiness analytics — Silver+ tier.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <div style={FORM_FIELD}>
          <label htmlFor="tenant">Tenant id</label>
          <input
            id="tenant"
            name="tenant"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            autoComplete="username"
            required
            aria-required="true"
            style={INPUT_STYLE}
          />
        </div>
        <div style={FORM_FIELD}>
          <label htmlFor="token">Bearer token</label>
          <input
            id="token"
            name="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="current-password"
            required
            aria-required="true"
            style={INPUT_STYLE}
          />
        </div>
        {error && (
          <div role="alert" style={{ color: color.danger, fontSize: 13 }}>
            {error}
          </div>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
