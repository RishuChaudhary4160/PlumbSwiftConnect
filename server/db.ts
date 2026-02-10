import "dotenv/config";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// This is required for @neondatabase/serverless to work in Node.js environments
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("CRITICAL: DATABASE_URL is not set!");
} else {
    console.log("DATABASE_URL is detected. Attempting to connect...");
}

// Optimized configuration for both local IP-bypass and Netlify cloud
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        // This allows the connection even if we are using the direct IP address locally
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Test connection and log errors early
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
