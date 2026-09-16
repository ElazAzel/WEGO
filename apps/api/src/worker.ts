/**
 * Background entrypoint. The queue provider is loaded only in a configured
 * deployment so local preview stays dependency-light. Production fails loudly
 * when the pg-boss package or database is missing.
 */
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required for the worker");
const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;
const pgBossModule = await dynamicImport("pg-boss").catch(() => { throw new Error("pg-boss is required to run the WEGO worker"); });
const boss = new pgBossModule.default({ connectionString: databaseUrl, retryLimit: 5, retryDelay: 30, retryBackoff: true, expireInHours: 24 });
await boss.start();
await boss.createQueue("wego.external-sync", { retryLimit: 5, retryDelay: 30, retryBackoff: true });
await boss.work("wego.external-sync", async (job: any) => {
  // Provider adapters are deliberately idempotent: a job may be delivered again after a timeout.
  console.log(JSON.stringify({ type: "external-sync", jobId: job.id, provider: job.data?.provider ?? "unknown" }));
});
console.log("WEGO worker is ready");
export {};
