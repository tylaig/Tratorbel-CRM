import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import './env'; // Importar o módulo de ambiente
import { DATABASE_URL } from './env';

neonConfig.webSocketConstructor = ws;

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('Conectando ao banco de dados:', DATABASE_URL);
export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle(pool, { schema });