import http from "node:http";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentTypes = {
  ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2"
};
const IsWithin = (root, file) => {
  const relative = path.relative(root, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

export const CreateTestServer = (directory = projectDirectory) => http.createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end("Method not allowed");
    return;
  }
  try {
    let requestPath = decodeURIComponent(new URL(request.url || "/", "http://127.0.0.1").pathname);
    if (requestPath === "/") requestPath = "/tests/browser/showcase/index.html";
    const segments = requestPath.slice(1).split("/");
    if (requestPath.includes("\\") || requestPath.includes(":") || requestPath.includes("\0") ||
        segments.some((part) => part.startsWith(".")) ||
        !["src", "dist"].includes(segments[0]) && !(segments[0] === "tests" && ["browser", "fixtures"].includes(segments[1]))) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const root = await realpath(directory);
    const allowedRoot = await realpath(path.join(root, ...segments.slice(0, segments[0] === "tests" ? 2 : 1)));
    let file = path.resolve(root, ...segments);
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    file = await realpath(file);
    if (!IsWithin(root, allowedRoot) || !IsWithin(allowedRoot, file) ||
        path.relative(root, file).split(path.sep).some((part) => part.startsWith(".")) ||
        !Object.hasOwn(contentTypes, path.extname(file).toLowerCase())) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(file).toLowerCase()] });
    response.end(request.method === "HEAD" ? undefined : contents);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : 404).end("Not found");
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argument = process.argv.find((value) => value.startsWith("--port="));
  const port = Number(argument?.slice("--port=".length) || process.env.PORT || 4170);
  CreateTestServer().listen(port, "127.0.0.1", () => {
    console.log(`CTFramework showcase: http://127.0.0.1:${port}/tests/browser/showcase/`);
  });
}
