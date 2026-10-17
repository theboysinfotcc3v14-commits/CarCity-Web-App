import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.ts';

// Singleton connection pool instance
let poolInstance: mysql.Pool | null = null;

export function getDatabasePool(): mysql.Pool {
  if (!poolInstance) {
    const databaseUrl =
      process.env.DATABASE_URL ||
      'mysql://carcity_user:carcity_password@127.0.0.1:3306/carcity_db';

    // Connection configuration conforming to MariaDB 10.11+ / InnoDB / utf8mb4
    const isProduction = process.env.NODE_ENV === 'production';
    const requireSsl = process.env.DATABASE_SSL === 'true' || isProduction;

    poolInstance = mysql.createPool({
      uri: databaseUrl,
      waitForConnections: true,
      connectionLimit: 10, // Singleton pool between 5 and 10 connections
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      charset: 'utf8mb4',
      ssl: requireSsl
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    });
  }

  return poolInstance;
}

// Initialized Drizzle ORM client with full relational schema
export const pool = getDatabasePool();
export const db = drizzle(pool, { schema, mode: 'default' });

export * from './schema.ts';
