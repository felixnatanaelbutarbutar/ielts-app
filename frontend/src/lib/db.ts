import { Pool, PoolConfig } from "pg";

const config = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
} as unknown as PoolConfig; // bypass tipe tapi tetap aman runtime

const pool = new Pool(config);

export default pool;
