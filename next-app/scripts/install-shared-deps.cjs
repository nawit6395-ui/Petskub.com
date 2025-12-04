const { execSync } = require("node:child_process");
const { existsSync } = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..", "..");
const rootPackageJson = path.join(rootDir, "package.json");
const rootNodeModules = path.join(rootDir, "node_modules");

const shouldInstall = process.env.VERCEL === "1" || process.env.CI === "true";

if (!shouldInstall) {
  process.exit(0);
}

if (!existsSync(rootPackageJson)) {
  console.warn("[postinstall] Skipping shared dependency install: root package.json not found");
  process.exit(0);
}

if (existsSync(rootNodeModules)) {
  console.log("[postinstall] Shared dependencies already installed at repo root. Skipping.");
  process.exit(0);
}

console.log("[postinstall] Installing repo root dependencies for shared modules...");

try {
  execSync("npm install --omit=dev", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("[postinstall] Root dependencies installed.");
} catch (error) {
  console.error("[postinstall] Failed to install root dependencies", error);
  process.exit(1);
}
