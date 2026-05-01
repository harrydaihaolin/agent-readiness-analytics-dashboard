import { Link, NavLink, Route, Routes } from "react-router-dom";
import { useSession } from "@/api/session";
import { BrandMark } from "@/components/BrandMark";
import { ControlPanelPage } from "@/pages/ControlPanel";
import { LoginPage } from "@/pages/Login";
import { RecommendationsPage } from "@/pages/Recommendations";
import { RepoListPage } from "@/pages/RepoList";
import { RepoPage } from "@/pages/Repo";
import { RequireAuth } from "@/components/RequireAuth";
import { SiteFooter } from "@/components/SiteFooter";
import { color } from "@/design/tokens";

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  color: isActive ? color.accentPrimary : color.textSecondary,
  textDecoration: "none",
  fontSize: 14,
  paddingBottom: 2,
  borderBottom: isActive
    ? `2px solid ${color.accentPrimary}`
    : "2px solid transparent",
});

export function App() {
  const { session, signOut, staticMode } = useSession();
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          height: 56,
          borderBottom: `1px solid ${color.borderDefault}`,
          background: "rgba(11,13,16,0.8)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1152,
            margin: "0 auto",
            padding: "0 24px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <Link to="/" style={{ textDecoration: "none" }}>
              <BrandMark />
            </Link>
            {session && (
              <nav style={{ display: "flex", gap: 24 }}>
                <NavLink to="/" end style={navStyle}>
                  Control panel
                </NavLink>
                <NavLink to="/repos" style={navStyle}>
                  Repos
                </NavLink>
                <NavLink to="/recommendations" style={navStyle}>
                  Recommendations
                </NavLink>
              </nav>
            )}
          </div>
          <div style={{ fontSize: 13, color: color.textMuted }}>
            {session ? (
              <>
                <span style={{ marginRight: 12 }}>
                  {staticMode ? "demo · " : "signed in as "}
                  <code>{session.tenantId}</code>
                </span>
                {!staticMode && (
                  <button
                    onClick={signOut}
                    style={{
                      background: "transparent",
                      border: 0,
                      color: color.accentPrimary,
                      cursor: "pointer",
                      fontSize: 13,
                      padding: 0,
                    }}
                  >
                    sign out
                  </button>
                )}
              </>
            ) : (
              <NavLink
                to="/login"
                style={{
                  color: color.accentPrimary,
                  textDecoration: "none",
                  fontSize: 14,
                }}
              >
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </header>
      <main
        style={{
          maxWidth: 1152,
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px",
          flex: 1,
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <ControlPanelPage />
              </RequireAuth>
            }
          />
          <Route
            path="/repos"
            element={
              <RequireAuth>
                <RepoListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/repos/:repo"
            element={
              <RequireAuth>
                <RepoPage />
              </RequireAuth>
            }
          />
          <Route
            path="/recommendations"
            element={
              <RequireAuth>
                <RecommendationsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
      <div style={{ maxWidth: 1152, width: "100%", margin: "0 auto", padding: "0 24px" }}>
        <SiteFooter />
      </div>
    </div>
  );
}
