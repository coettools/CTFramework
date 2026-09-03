import { execFileSync } from "node:child_process";
import { chmodSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const gitDirectory = path.join(projectDirectory, ".git");

if (!existsSync(gitDirectory)) {
  console.log("CTFramework Git hooks are ready to activate when this project has a Git repository.");
  process.exit(0);
}

execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: projectDirectory,
  stdio: "inherit"
});

if (process.platform !== "win32") {
  for (const name of ["pre-commit", "post-commit"]) {
    chmodSync(path.join(projectDirectory, ".githooks", name), 0o755);
  }
}

console.log("CTFramework pre-commit checks and post-commit project synchronization enabled.");
