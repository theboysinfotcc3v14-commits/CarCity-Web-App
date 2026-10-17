import { getDatabasePool } from './index.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration runner for MariaDB 10.11+
 * Reads versioned SQL migration files and executes them using the singleton connection pool.
 */
export async function runMigrations() {
  console.log('--- Iniciando Migrações MariaDB / Drizzle ORM (CarCity Web) ---');
  const pool = getDatabasePool();

  try {
    const migrationFile = path.resolve(__dirname, 'migrations', '0000_initial_schema.sql');
    if (!fs.existsSync(migrationFile)) {
      throw new Error(`Arquivo de migração não encontrado: ${migrationFile}`);
    }

    const sqlContent = fs.readFileSync(migrationFile, 'utf-8');

    // Split statements safely
    const statements = sqlContent
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const connection = await pool.getConnection();

    try {
      console.log(`Executando ${statements.length} instruções DDL no MariaDB...`);

      for (const statement of statements) {
        await connection.query(statement);
      }

      console.log('✓ Migrações aplicadas com sucesso no MariaDB (InnoDB, utf8mb4)!');
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Erro durante a execução das migrações:', error.message);
    throw error;
  }
}

// Allow execution via CLI directly: tsx src/db/migrate.ts
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
