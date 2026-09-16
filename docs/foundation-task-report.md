# Task 1 foundation report

Implementation in progress. Ownership: API except modules/life, canonical DB migrations, this report. No dependency installation, commits, or subagents.

## Controller integration contract (chosen before implementation)

`apps/api/src/persistence/repository.ts` exports `Store` and `Transaction`.

- `Store.transaction<T>(userId: string, work: (tx: Transaction) => Promise<T>): Promise<T>`.
- Transaction: async `get<T>(collection,id): Promise<T|null>`, `put<T>(collection,id,value): Promise<void>`, `delete(collection,id): Promise<void>`, `list<T>(collection): Promise<T[]>`.
- `Transaction.append(spaceId,type,entityId,revision): Promise<void>` writes metadata only in the same transaction.
- `Store.changes(spaceId: string, cursor: string, userId: string): Promise<{changes: {cursor:string,spaceId:string,type:string,entityId:string,revision:number}[], cursor:string}>`. Cursors are decimal strings, safe beyond JS integer range. Catchup is paginated (500 rows); pass returned cursor until empty.
- `buildServer({ registerModules(app, {store, userId(request), requireSpace(tx,spaceId,userId)}) })`. Both authorization helpers return promises. `requireSpace` returns the existing Space shape. `registerModules` may be async.
- Controller collections such as `life:<spaceId>` are space-scoped and membership checked; arbitrary collection names must never be accepted from client input. Command receipts can use `receipts:<spaceId>` and commit atomically with business records and append.
- SSE uses durable journal catchup; consumers refetch on metadata events.

## Evidence

- `pnpm -r test`: 5 workspace packages, 139 tests passed.
- `pnpm -r typecheck`: db, domain, UI, API and web passed.
- API production bundle: `apps/api/dist/server.js` and `apps/api/dist/worker.js`.
- Web production bundle: Vite 8 completed after transforming 2,458 modules.
- PGlite integration covers transaction rollback, foreign keys, RLS membership isolation, forged scope labels and readiness.

The adapter intentionally keeps `pg` external so the local test environment can use PGlite without pretending it is the production connection pool. Production startup fails closed until `pg` and `DATABASE_URL` are provisioned.
