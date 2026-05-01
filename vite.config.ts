import { copyFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * GitHub project Pages often still shows the stock 404 for /repo/deep/path.
 * When custom 404 works, redirect to hash URL so the SPA loads.
 */
function ghPagesSpaFallback(): Plugin {
  let outDir = "dist";
  return {
    name: "gh-pages-spa-fallback",
    apply: "build",
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir);
    },
    closeBundle() {
      const dist = outDir;
      const trimmed = (process.env.VITE_BASE_PATH ?? "/").replace(/^\/+|\/+$/g, "");
      const repoSegment = trimmed.split("/").filter(Boolean)[0];
      if (!repoSegment) {
        copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
        return;
      }
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redirecting…</title>
  <script>
(function () {
  var repo = ${JSON.stringify(repoSegment)};
  var parts = location.pathname.split("/").filter(Boolean);
  var rest = parts.length && parts[0] === repo
    ? (parts.length <= 1 ? "/" : "/" + parts.slice(1).join("/"))
    : "/";
  location.replace(location.origin + "/" + repo + "/#" + rest + location.search);
})();
  </script>
</head>
<body><p>Redirecting…</p></body>
</html>`;
      writeFileSync(path.join(dist, "404.html"), html, "utf8");
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [react(), ghPagesSpaFallback()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_ANALYTICS_API ?? "http://localhost:8089",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
