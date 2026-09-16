import type { IncomingMessage, ServerResponse } from "node:http";
import { buildServer } from "./src/server";

// Vercel expects the default export to be a request handler. Build Fastify
// lazily so the serverless runtime owns initialization and can reuse it across
// warm invocations.
let appPromise: Promise<ReturnType<typeof buildServer>> | null = null;

async function getApp() {
  appPromise ??= Promise.resolve(buildServer({ demo: false }));
  const app = await appPromise;
  await app.ready();
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  const server = app.server as typeof app.server | undefined;
  if (server && typeof server.emit === "function") {
    server.emit("request", req, res);
    return;
  }
  app.routing(req, res);
}
