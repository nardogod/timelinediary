/**
 * Cliente Neon (PostgreSQL serverless).
 * Use em API routes e Server Components.
 * Nunca use no browser — DATABASE_URL é secreto.
 */
import { neon } from '@neondatabase/serverless';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL não definida. Configure em .env.local (veja .env.local.example). ' +
        'Obtenha em: https://console.neon.tech → seu projeto → Connection string'
    );
  }
  return url;
}

let sqlInstance: ReturnType<typeof neon> | null = null;

/**
 * Cliente SQL Neon (tagged template). Use assim:
 *   const sql = getNeon();
 *   const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
 */
export function getNeon(): ReturnType<typeof neon> {
  if (!sqlInstance) {
    sqlInstance = neon(getDatabaseUrl());
  }
  return sqlInstance;
}
