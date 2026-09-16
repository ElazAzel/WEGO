import { buildServer } from "./src/server";

// Vercel detects this Fastify app as the Node backend entrypoint.
// The server module skips listen() when VERCEL is present.
const app = buildServer({ demo: false });

export default app;
