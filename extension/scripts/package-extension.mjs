import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const extensionRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(extensionRoot, "..");
const distDir = resolve(extensionRoot, "dist");
const packagesDir = resolve(repoRoot, "Packages");
const manifest = JSON.parse(readFileSync(resolve(extensionRoot, "manifest.json"), "utf8"));
const packageName = `web-visual-ai-editor-v${manifest.version}.zip`;
const packagePath = resolve(packagesDir, packageName);

mkdirSync(packagesDir, { recursive: true });
rmSync(packagePath, { force: true });

execFileSync("zip", ["-qr", packagePath, "."], {
  cwd: distDir,
  stdio: "inherit"
});

console.log(`Packaged ${packagePath}`);
