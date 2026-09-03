import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frameworkDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleNames = ["ctframework.bundle.js", "ctframework.bundle.min.js"];
const GetInfo = async (file) => lstat(file).catch((error) => {
  if (error.code === "ENOENT") return null;
  throw error;
});
const ReadJson = async (file) => await GetInfo(file) ? JSON.parse(await readFile(file, "utf8")) : {};
const Hash = (content) => createHash("sha256").update(content).digest("hex");
const GitEnvironment = () => Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")));

export const RequireSafePath = async (root, target) => {
  const relative = path.relative(root, target);
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`Path is outside the project: ${target}`);
  }
  let current = root;
  for (const part of ["", ...relative.split(path.sep).filter(Boolean)]) {
    current = path.join(current, part);
    if ((await GetInfo(current))?.isSymbolicLink()) {
      throw new Error(`Refusing linked path: ${current}`);
    }
  }
};

const ListSourceFiles = async (directory) => {
  if (!await GetInfo(directory)) return [];
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing linked source: ${file}`);
    if (entry.isDirectory()) files.push(...await ListSourceFiles(file));
    else if (/\.(?:js|mjs|html|css)$/.test(entry.name)) files.push(file);
  }
  return files;
};

export const FindProjects = async (workspace, framework) => {
  const projects = [];
  for (const entry of await readdir(workspace, { withFileTypes: true })) {
    const directory = path.join(workspace, entry.name);
    if (directory === framework || entry.name.startsWith(".") || entry.name === "node_modules") continue;
    if (entry.isSymbolicLink()) throw new Error(`Linked workspace directory requires manual review: ${directory}`);
    if (!entry.isDirectory()) continue;
    const vendor = path.join(directory, "vendor");
    await RequireSafePath(directory, vendor);
    await RequireSafePath(directory, path.join(directory, "src"));
    await RequireSafePath(directory, path.join(directory, "package.json"));
    await RequireSafePath(directory, path.join(directory, "index.html"));
    const settings = await ReadJson(path.join(directory, "package.json"));
    const sources = await ListSourceFiles(path.join(directory, "src"));
    if (await GetInfo(path.join(directory, "index.html"))) sources.push(path.join(directory, "index.html"));
    const contents = (await Promise.all(sources.map((file) => readFile(file, "utf8")))).join("\n");
    if (/CTFramework\/src\//i.test(contents)) throw new Error(`${entry.name}: replace framework source imports with the built vendor distribution.`);
    const dependencies = { ...settings.dependencies, ...settings.devDependencies, ...settings.peerDependencies };
    if (dependencies["@coettools/ctframework"] || contents.includes("@coettools/ctframework")) {
      throw new Error(`${entry.name}: package-managed CTFramework needs an explicit dependency update; not silently skipped.`);
    }
    const usedBundles = bundleNames.filter((name) => contents.includes(name));
    const files = [];
    for (const name of bundleNames) {
      if (usedBundles.includes(name) || await GetInfo(path.join(vendor, name))) files.push(name);
    }
    if (!files.length) continue;
    for (const name of usedBundles) {
      if (!contents.includes(`vendor/${name}`)) throw new Error(`${entry.name}: use the standard vendor/${name} import path.`);
    }
    projects.push({ Name: entry.name, Directory: directory, Files: [...files, "LICENSE.ctframework"], UsedBundles: usedBundles, Sources: sources, Settings: settings });
  }
  return projects.sort((left, right) => left.Name.localeCompare(right.Name));
};

const RunNpm = (directory, script) => {
  if (!process.env.npm_execpath) throw new Error("Run this workflow through npm run so its npm executable is known.");
  execFileSync(process.execPath, [process.env.npm_execpath, "run", script], { cwd: directory, stdio: "inherit", env: GitEnvironment() });
};

const CheckProject = async (project) => {
  if (project.Settings.scripts?.check) {
    RunNpm(project.Directory, "check");
    return "npm run check passed; browser verification still required";
  }
  if (project.Settings.scripts?.build) RunNpm(project.Directory, "build");
  else if (await GetInfo(path.join(project.Directory, "dist"))) {
    throw new Error("dist exists but no build/check command can refresh it");
  }
  for (const file of project.Sources.filter((file) => /\.(?:js|mjs)$/.test(file))) {
    execFileSync(process.execPath, ["--input-type=module", "--check"], { input: await readFile(file), stdio: ["pipe", "inherit", "inherit"] });
  }
  return project.Settings.scripts?.build
    ? "build and source syntax passed; no project test suite; browser verification required"
    : "source syntax passed; source-only project with no build/test command; browser verification required";
};

export const RequireCommittedInputs = (directory) => {
  const inputs = ["src", "scripts", "package.json", "package-lock.json", "LICENSE"];
  const options = { cwd: directory, encoding: "utf8", env: GitEnvironment() };
  const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=all", "--", ...inputs], options);
  if (dirty.trim()) throw new Error("Framework build inputs contain uncommitted changes. Commit them first, or use npm run sync:projects:preview for an explicitly uncommitted preview.");
  return execFileSync("git", ["rev-parse", "HEAD"], options).trim();
};

export const SynchronizeProjects = async ({ FrameworkDirectory, WorkspaceDirectory, VerifyOnly = false, RunChecks = CheckProject }) => {
  const projects = await FindProjects(WorkspaceDirectory, FrameworkDirectory);
  const artifacts = {};
  for (const name of [...bundleNames, "LICENSE.ctframework"]) {
    artifacts[name] = await readFile(path.join(FrameworkDirectory, name === "LICENSE.ctframework" ? "LICENSE" : `dist/${name}`));
  }
  // Validate every destination before writing any consumer files.
  for (const project of projects) {
    for (const name of project.Files) await RequireSafePath(project.Directory, path.join(project.Directory, "vendor", name));
    await RequireSafePath(project.Directory, path.join(project.Directory, "dist"));
  }
  const results = [];
  for (const project of projects) {
    const result = { Project: project.Name, Status: "Failed", Checks: "Not run", Browser: "Pending", Release: "Not deployed", Files: {} };
    try {
      if (!VerifyOnly) {
        await mkdir(path.join(project.Directory, "vendor"), { recursive: true });
        for (const name of project.Files) await writeFile(path.join(project.Directory, "vendor", name), artifacts[name]);
        result.Checks = await RunChecks(project);
      }
      for (const name of project.Files) {
        const actual = await readFile(path.join(project.Directory, "vendor", name));
        if (!actual.equals(artifacts[name])) throw new Error(`Stale vendor/${name}`);
        result.Files[name] = Hash(actual);
      }
      if (await GetInfo(path.join(project.Directory, "dist"))) {
        for (const name of [...project.UsedBundles, "LICENSE.ctframework"]) {
          const file = path.join(project.Directory, "dist", "vendor", name);
          await RequireSafePath(project.Directory, file);
          if (!(await readFile(file)).equals(artifacts[name])) throw new Error(`Stale dist/vendor/${name}`);
        }
      }
      result.Status = VerifyOnly ? "Files match" : "Updated and checked";
    } catch (error) {
      result.Error = error.message;
    }
    results.push(result);
  }
  return results;
};

const Main = async () => {
  const flags = process.argv.slice(2);
  if (flags.length !== 1 || !["--committed", "--working-tree", "--verify"].includes(flags[0])) {
    throw new Error("Choose --committed, --working-tree, or --verify.");
  }
  const reportPath = path.join(frameworkDirectory, "reports", "ProjectSync.json");
  const report = { Mode: flags[0].slice(2), Commit: null, Started: new Date().toISOString(), Status: "Failed", Projects: [] };
  try {
    if (flags[0] === "--committed") report.Commit = RequireCommittedInputs(frameworkDirectory);
    if (flags[0] !== "--verify") RunNpm(frameworkDirectory, "check");
    if (flags[0] === "--committed" && RequireCommittedInputs(frameworkDirectory) !== report.Commit) {
      throw new Error("Framework HEAD changed while building; rerun synchronization.");
    }
    report.Projects = await SynchronizeProjects({
      FrameworkDirectory: await realpath(frameworkDirectory),
      WorkspaceDirectory: await realpath(path.dirname(frameworkDirectory)),
      VerifyOnly: flags[0] === "--verify"
    });
    for (const project of report.Projects) console.log(`${project.Project}: ${project.Status}. ${project.Error || project.Checks}`);
    if (report.Projects.some((project) => project.Status === "Failed")) throw new Error("One or more consumer projects failed synchronization.");
    if (flags[0] === "--committed" && RequireCommittedInputs(frameworkDirectory) !== report.Commit) {
      throw new Error("Framework HEAD changed during synchronization; rerun it.");
    }
    report.Status = flags[0] === "--verify"
      ? "Files match; project tests not rerun; browser verification and releases pending"
      : "Passed automated checks; browser verification and project releases pending";
    console.log("Consumer files match the framework distribution. No consumer commits, pushes, or deployments were performed.");
  } catch (error) {
    report.Error = error.message;
    throw error;
  } finally {
    await RequireSafePath(frameworkDirectory, reportPath);
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`Project sync report: ${reportPath}`);
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  Main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
