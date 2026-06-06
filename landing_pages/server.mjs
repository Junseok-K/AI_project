import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number.parseInt(process.env.PORT || "3002", 10);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

const resolveRequestPath = (urlPath) => {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const requestedPath = join(root, normalizedPath);

  if (!requestedPath.startsWith(root)) {
    return null;
  }

  if (!existsSync(requestedPath)) {
    return null;
  }

  const stats = statSync(requestedPath);
  if (stats.isDirectory()) {
    const indexPath = join(requestedPath, "index.html");
    return existsSync(indexPath) ? indexPath : null;
  }

  return stats.isFile() ? requestedPath : null;
};

const server = createServer((request, response) => {
  const filePath = resolveRequestPath(request.url || "/");

  if (!filePath) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": mimeTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Landing pages server running at http://localhost:${port}`);
  console.log(`Template: http://localhost:${port}/toss-inspired-finance/`);
});
