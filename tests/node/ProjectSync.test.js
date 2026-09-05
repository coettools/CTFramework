import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { FindProjects, RequireCommittedInputs, SynchronizeProjects } from "../../scripts/SyncProjects.js";

const Write = async (root, file, text) => {
  const target = path.join(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, text);
};
const Fixture = async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ctframework-sync-"));
  context.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("ctframework-sync-"));
    await rm(root, { recursive: true, force: true });
  });
  const framework = path.join(root, "CTFramework");
  await Write(framework, "dist/ctframework.bundle.js", "debug with embedded CSS");
  await Write(framework, "dist/ctframework.bundle.min.js", "minified with embedded CSS");
  await Write(framework, "LICENSE", "license notice");
  return { Root: root, Framework: framework };
};
const Consumer = async (root, name) => {
  const directory = path.join(root, name);
  await Write(directory, "src/Main.js", 'import CT from "../vendor/ctframework.bundle.min.js";');
  await Write(directory, "vendor/ctframework.bundle.min.js", "old bundle");
  return directory;
};
const Options = (fixture, extra = {}) => ({ FrameworkDirectory: fixture.Framework, WorkspaceDirectory: fixture.Root, RunChecks: async () => "fixture checks passed", ...extra });

test("discovers current and future sibling consumers without a hard-coded wiki path", async (context) => {
  const fixture = await Fixture(context);
  await Consumer(fixture.Root, "wiki.ct-framework");
  await Consumer(fixture.Root, "future-project");
  await Write(fixture.Root, "assets/logo.txt", "not a consumer");
  assert.deepEqual((await FindProjects(fixture.Root, fixture.Framework)).map((project) => project.Name), ["future-project", "wiki.ct-framework"]);
});

test("copies supported variants and license, then verifies rebuilt deployment files", async (context) => {
  const fixture = await Fixture(context);
  const consumer = await Consumer(fixture.Root, "site");
  await Write(consumer, "vendor/ctframework.bundle.js", "old debug");
  const results = await SynchronizeProjects(Options(fixture, { RunChecks: async () => {
    for (const name of ["ctframework.bundle.min.js", "LICENSE.ctframework"]) {
      await Write(consumer, `dist/vendor/${name}`, await readFile(path.join(consumer, "vendor", name)));
    }
    return "fixture rebuilt";
  } }));
  assert.equal(results[0].Status, "Updated and checked");
  assert.equal(results[0].Browser, "Pending");
  assert.equal(results[0].Release, "Not deployed");
  assert.equal(await readFile(path.join(consumer, "vendor/ctframework.bundle.js"), "utf8"), "debug with embedded CSS");
  assert.equal(await readFile(path.join(consumer, "vendor/LICENSE.ctframework"), "utf8"), "license notice");
  assert.equal(Object.keys(results[0].Files).length, 3);
});

test("verify reports stale vendor files without changing them", async (context) => {
  const fixture = await Fixture(context);
  const consumer = await Consumer(fixture.Root, "site");
  const results = await SynchronizeProjects(Options(fixture, { VerifyOnly: true, RunChecks: () => assert.fail("verification must not run project scripts") }));
  assert.equal(results[0].Status, "Failed");
  assert.match(results[0].Error, /Stale vendor/);
  assert.equal(await readFile(path.join(consumer, "vendor/ctframework.bundle.min.js"), "utf8"), "old bundle");
});

test("a stale deployment or failed project check is not reported as synchronized", async (context) => {
  const fixture = await Fixture(context);
  const consumer = await Consumer(fixture.Root, "first");
  await Write(consumer, "dist/vendor/ctframework.bundle.min.js", "stale release");
  await Consumer(fixture.Root, "second");
  const results = await SynchronizeProjects(Options(fixture));
  assert.equal(results[0].Status, "Failed");
  assert.match(results[0].Error, /Stale dist/);
  assert.equal(results[1].Status, "Updated and checked");
  const failed = await SynchronizeProjects(Options(fixture, { RunChecks: async () => { throw new Error("project tests failed"); } }));
  assert.ok(failed.every((result) => result.Status === "Failed" && result.Error === "project tests failed"));
});

test("package-managed dependencies require an explicit update rather than a silent skip", async (context) => {
  const fixture = await Fixture(context);
  await Write(fixture.Root, "package-site/package.json", JSON.stringify({ dependencies: { "@coettools/ctframework": "0.1.0" } }));
  await assert.rejects(FindProjects(fixture.Root, fixture.Framework), /explicit dependency update/);
});

test("documentation strings and comments are not framework imports", async (context) => {
  const fixture = await Fixture(context);
  const consumer = await Consumer(fixture.Root, "guide");
  await Write(consumer, "src/Guide.js", [
    'export const Code = \'import CT from "@coettools/ctframework";\';',
    'export const Debug = `import CT from "../vendor/ctframework.bundle.js";`;',
    'export const Legacy = \'import CT from "../../CTFramework/src/Index.js";\';',
    '// import CT from "@coettools/ctframework/bundle";',
    '/* export { CT } from "../../CTFramework/src/Index.js"; */'
  ].join("\n"));
  const [project] = await FindProjects(fixture.Root, fixture.Framework);
  assert.equal(project.Name, "guide");
  assert.deepEqual(project.UsedBundles, ["ctframework.bundle.min.js"]);
  assert.equal((await SynchronizeProjects(Options(fixture)))[0].Status, "Updated and checked");
});

test("real static, dynamic, and re-export package imports still require an update", async (context) => {
  const fixture = await Fixture(context);
  const consumer = await Consumer(fixture.Root, "site");
  for (const source of [
    'import CT from "@coettools/ctframework";',
    'export { default as CT } from "@coettools/ctframework/bundle";',
    'export const Load = () => import("@coettools/ctframework/bundle/debug");',
    'import "@coettools/ctframework";'
  ]) {
    await Write(consumer, "src/Main.js", source);
    await assert.rejects(FindProjects(fixture.Root, fixture.Framework), /explicit dependency update/);
  }
});

test("real source imports and nonstandard vendor paths are not accepted as documentation", async (context) => {
  const fixture = await Fixture(context);
  const consumer = await Consumer(fixture.Root, "site");
  await Write(consumer, "src/Main.js", 'import CT from "../../CTFramework/src/Index.js";');
  await assert.rejects(FindProjects(fixture.Root, fixture.Framework), /replace framework source imports/);
  await Write(consumer, "src/Main.js", 'import CT from "../lib/ctframework.bundle.min.js";');
  await assert.rejects(FindProjects(fixture.Root, fixture.Framework), /standard vendor/);
});

test("linked vendor destinations are refused before other consumers are changed", async (context) => {
  const fixture = await Fixture(context);
  const first = await Consumer(fixture.Root, "first");
  await Write(fixture.Root, "linked/src/Main.js", 'import CT from "../vendor/ctframework.bundle.min.js";');
  const external = path.join(fixture.Root, "external-assets");
  await mkdir(external);
  await symlink(external, path.join(fixture.Root, "linked/vendor"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(SynchronizeProjects(Options(fixture)), /linked path/);
  assert.equal(await readFile(path.join(first, "vendor/ctframework.bundle.min.js"), "utf8"), "old bundle");
});

test("committed synchronization refuses staged, unstaged, and untracked build inputs", async (context) => {
  const fixture = await Fixture(context);
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith("GIT_")));
  const Git = (...args) => execFileSync("git", args, { cwd: fixture.Framework, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env });
  Git("init");
  Git("add", "LICENSE");
  Git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "-m", "Fixture");
  assert.equal(RequireCommittedInputs(fixture.Framework), Git("rev-parse", "HEAD").trim());
  await Write(fixture.Framework, "src/New.js", "export const New = 1;");
  assert.throws(() => RequireCommittedInputs(fixture.Framework), /uncommitted/);
  Git("add", "src/New.js");
  assert.throws(() => RequireCommittedInputs(fixture.Framework), /uncommitted/);
  await Write(fixture.Framework, "LICENSE", "changed notice");
  assert.throws(() => RequireCommittedInputs(fixture.Framework), /uncommitted/);
});
