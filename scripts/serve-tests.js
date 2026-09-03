import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const wikiDirectory = path.resolve(projectDirectory, "..", "wiki.ct-framework");
const portArgument = process.argv.find((argument) => argument.startsWith("--port="));
const port = Number(portArgument?.substring("--port=".length) || process.env.PORT || 4170);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
    let requestPath = decodeURIComponent(requestUrl.pathname);

    if (requestPath === "/") {
      requestPath = "/tests/browser/showcase/index.html";
    }

    const isWikiRequest = requestPath === "/wiki" || requestPath.startsWith("/wiki/");
    const requestDirectory = isWikiRequest ? wikiDirectory : projectDirectory;
    const relativeRequestPath = isWikiRequest ? requestPath.substring("/wiki".length) || "/" : requestPath;
    let filePath = path.normalize(path.join(requestDirectory, relativeRequestPath));

    if (!filePath.startsWith(requestDirectory)) {
      response.statusCode = 403;
      response.end("Forbidden");
      return;
    }

    const requestedStats = await stat(filePath).catch(() => null);

    if (requestedStats?.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    const fileContents = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();

    response.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    response.end(fileContents);
  } catch {
    response.statusCode = 404;
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`CTFramework browser showcase available at http://localhost:${port}/tests/browser/showcase/`);
  console.log(`CTFramework wiki available at http://localhost:${port}/wiki/`);
});
