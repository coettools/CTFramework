import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { HttpClient, GetFormValues, Guid } from "../../src/Index.js";
import { CreateTestServer } from "../../scripts/ServeTests.js";
import { build as Build } from "esbuild";

test("HTTP headers are case insensitive and explicit JSON headers still serialize objects", async (context) => {
  const requests = [];
  context.mock.method(globalThis, "fetch", async (url, options) => {
    const request = new Request(new URL(url, "https://example.test"), options);
    requests.push(request);
    return new Response();
  });
  const client = new HttpClient({ headers: new Headers({ Authorization: "old", "Content-Type": "application/json" }) });
  await client.Post("/test", { Ready: true }, { headers: [["authorization", "new"]] });
  assert.equal(requests[0].headers.get("Authorization"), "new");
  assert.equal(await requests[0].text(), '{"Ready":true}');
  const bytes = new Uint8Array([1, 2, 3]);
  for (const body of [bytes, new DataView(bytes.buffer), bytes.buffer, new Blob([bytes])]) {
    await new HttpClient().Post("/test", body);
    assert.deepEqual(new Uint8Array(await requests.at(-1).arrayBuffer()), bytes);
  }
  const stream = new ReadableStream({ start: (controller) => { controller.enqueue(bytes); controller.close(); } });
  await new HttpClient().Post("/test", stream, { duplex: "half" });
  assert.deepEqual(new Uint8Array(await requests.at(-1).arrayBuffer()), bytes);
  await new HttpClient().Post("/test", new URLSearchParams({ Name: "Test" }));
  assert.equal(await requests.at(-1).text(), "Name=Test");
});

test("form field names cannot collide with the result prototype", (context) => {
  const original = globalThis.FormData;
  const data = new original();
  for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
    data.append(name, "first");
    data.append(name, "second");
  }
  context.mock.method(globalThis, "FormData", function () { return data; });
  const values = GetFormValues(null);
  assert.equal(Object.getPrototypeOf(values), Object.prototype);
  for (const name of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
    assert.deepEqual(values[name], ["first", "second"]);
    assert.deepEqual(JSON.parse(JSON.stringify(values))[name], ["first", "second"]);
  }
});

test("Guid uses cryptographic randomness, including without randomUUID", (context) => {
  context.mock.method(Math, "random", () => { throw new Error("Insecure random source"); });
  const expression = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  assert.match(Guid(), expression);
  const original = globalThis.crypto.randomUUID;
  globalThis.crypto.randomUUID = undefined;
  context.after(() => { globalThis.crypto.randomUUID = original; });
  assert.match(Guid(), expression);
  assert.equal(new Set(Array.from({ length: 100 }, () => Guid())).size, 100);
});

test("large incomplete highlighting inputs finish within a bounded subprocess", () => {
  const moduleUrl = new URL("../../src/utils/CodeHighlight.js", import.meta.url).href;
  const code = `import { HighlightCode } from ${JSON.stringify(moduleUrl)};
    for (const language of ["css", "html", "javascript", "json", "csharp"]) {
      for (const source of ["a".repeat(100000), "9".repeat(99999) + "x", " ".repeat(100000), "$".repeat(100000)]) {
        if (HighlightCode(source, language).map(token => token.Text).join("") !== source) throw new Error(language);
      }
    }`;
  execFileSync(process.execPath, ["--input-type=module", "-e", code], { timeout: 4000 });
});

test("the bundler preserves code-like string literals and live ESM bindings", async () => {
  const source = 'export const Example = "export const Token = 1;"; export let Count = 0; export const Increase = () => Count++;';
  const result = await Build({ stdin: { contents: source }, bundle: true, format: "esm", write: false });
  const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
  assert.equal(module.Example, "export const Token = 1;");
  module.Increase();
  assert.equal(module.Count, 1);
});

test("the preview server exposes only local browser assets, not metadata or siblings", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "ct-server-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  for (const folder of ["src", "tests/browser", "tests/fixtures", ".git", "scripts"]) await mkdir(path.join(root, folder), { recursive: true });
  await writeFile(path.join(root, "src/Index.js"), "export const Safe = true;");
  await writeFile(path.join(root, "tests/fixtures/Sample.js"), "export const Sample = true;");
  await writeFile(path.join(root, ".git/HEAD"), "private");
  await writeFile(path.join(root, "scripts/Private.js"), "private");
  await symlink(path.join(root, "scripts"), path.join(root, "src/linked"), "junction");
  const server = CreateTestServer(root);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); }));
  assert.equal(server.address().address, "127.0.0.1");
  const origin = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${origin}/src/Index.js`)).status, 200);
  assert.equal((await fetch(`${origin}/tests/fixtures/Sample.js`)).status, 200);
  for (const route of ["/.git/HEAD", "/wiki/.git/HEAD", "/scripts/Private.js", "/tests/node/Private.js", "/src/linked/Private.js", "/..%5cCTFramework-private%5cnote.txt", "/src/%2e%2e%5c.git%5cHEAD"]) {
    assert.equal((await fetch(origin + route)).status, 403, route);
  }
  assert.equal((await fetch(`${origin}/src/%ZZ`)).status, 400);
  assert.equal((await fetch(`${origin}/src/Index.js`, { method: "POST" })).status, 405);
  assert.equal(await (await fetch(`${origin}/src/Index.js`, { method: "HEAD" })).text(), "");
});
