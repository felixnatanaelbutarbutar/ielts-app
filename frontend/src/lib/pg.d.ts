declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
  }

  export class Pool {
    constructor(config: PoolConfig);
    connect(): Promise<PoolClient>;
    query(query: string, params?: unknown[]): Promise<PoolQueryResult>; 
    end(): Promise<void>;
  }

  export class PoolClient {
    release(): void;
    query(query: string, params?: unknown[]): Promise<PoolQueryResult>;
  }

  export interface PoolQueryResult {
    rows: Record<string, unknown>[];  
  }
}