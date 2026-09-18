import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectDirectory = fileURLToPath(new URL("../../", import.meta.url));
const publicGuides = ["Api.md", "Component-Guide.md", "Components.md", "Data-And-Services.md", "Getting-Started.md", "Guide.md", "Html-And-Dom.md", "Styling.md"];
const internalPath = /(?:^|[\/_.-])(?:internal|notes|audits?|reviews?|reports?|handoff|resume)(?:[\/_.-]|$)/i;
const internalText =
  /\bweb-dev\b|tools\/source-style|\b(?:sync:projects|check:workspace|projects:check)\b|sibling (?:project|wiki|application)|^## (?:Local Verification|Still Deferred)|^Status:.*approved|[A-Z]:[\\/]Users[\\/]|\/(?:Users|home)\/[^/\s]+\//im;

const IsPublicDocument = (file) => file === "README.md" || publicGuides.some((name) => file === `docs/${name}`) || /^tests\/browser\/[a-z-]+\/README\.md$/.test(file);

test("only explicitly reviewed public guides enter the package", async () => {
  const manifest = JSON.parse(await readFile(path.join(projectDirectory, "package.json"), "utf8"));
  assert.deepEqual(manifest.files, ["dist", ...publicGuides.map((name) => `docs/${name}`), "LICENSE", "README.md"]);
  assert.equal(manifest.scripts.prepack, "npm run check");

  const files = await readdir(path.join(projectDirectory, "docs"));
  assert.deepEqual(files.sort(), publicGuides.slice().sort(), "Keep working notes outside the public documentation directory.");

  const ignore = await readFile(path.join(projectDirectory, ".gitignore"), "utf8");
  assert.match(ignore, /^\/docs\/\*$/m);
  for (const name of publicGuides) assert.ok(ignore.includes(`!/docs/${name}`));
});

test("publication rules distinguish public guidance from working notes", () => {
  for (const file of ["docs/Runtime-Review.md", "reports/Results.json", "internal/Notes.txt", "notes/Follow-Up.md", "Deployment-Audit.md"]) {
    assert.equal(internalPath.test(file), true, file);
    assert.equal(IsPublicDocument(file), false, file);
  }

  for (const file of ["docs/Api.md", "README.md", "tests/browser/components/README.md"]) assert.equal(IsPublicDocument(file), true, file);
  assert.equal(internalPath.test("tests/node/AuditRegression.test.js"), false);
  assert.equal(internalText.test("## Local Verification On 2000-01-01"), true);
  assert.equal(internalText.test("Run npm run check before contributing."), false);
});

test("tracked documentation excludes internal reports, workstation paths and workspace procedures", async (context) => {
  if (!existsSync(path.join(projectDirectory, ".git"))) {
    context.skip("Source archives have no Git index; the package allowlist is checked separately.");

    return;
  }

  const files = execFileSync("git", ["ls-files", "-z"], { cwd: projectDirectory, encoding: "utf8" }).split("\0").filter(Boolean);
  for (const file of files) {
    const absolute = path.join(projectDirectory, file);
    if (!existsSync(absolute)) continue;

    assert.equal(internalPath.test(file), false, `Internal working material must not be tracked: ${file}`);
    if (!/\.md$/i.test(file)) continue;

    assert.equal(IsPublicDocument(file), true, `Review the intended audience before adding a public document: ${file}`);
    const content = await readFile(absolute, "utf8");
    assert.equal(internalText.test(content), false, `Remove internal workflow or status details from ${file}`);
  }
});
