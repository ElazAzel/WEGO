/** Integration surface shared by the API and independently registered modules. */
export interface Change {
  cursor: string;
  spaceId: string;
  type: string;
  entityId: string;
  revision: number;
}

export interface Transaction {
  get<T>(collection: string, id: string): Promise<T | null>;
  put<T>(collection: string, id: string, value: T): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  list<T>(collection: string): Promise<T[]>;
  append(spaceId: string, type: string, entityId: string, revision: number): Promise<void>;
}

export interface Store {
  transaction<T>(userId: string, work: (tx: Transaction) => Promise<T>): Promise<T>;
  changes(spaceId: string, cursor: string, userId: string): Promise<{ changes: Change[]; cursor: string }>;
  ready(): Promise<void>;
  close(): Promise<void>;
}
