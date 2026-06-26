import { createServer } from "http";
import { logger } from "./logger.js";

export function startHealthServer() {
  const port = parseInt(process.env["PORT"] ?? "3000", 10);

  const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    logger.info({ port }, "Health check server listening");
  });
}
