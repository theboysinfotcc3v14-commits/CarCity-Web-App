import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'mysql://carcity_user:carcity_password@127.0.0.1:3306/carcity_db',
  },
  verbose: true,
  strict: true,
});
