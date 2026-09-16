import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "./src/server";

// Vercel expects the default export to be a request handler. Fastify itself is
// an object, so bridge each invocation to its underlying Node HTTP server.
const app = buildServer({ demo: false });
const ready = app.ready();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ready;
  app.server.emit("request", req, res);
}
