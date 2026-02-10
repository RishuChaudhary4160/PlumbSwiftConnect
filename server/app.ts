import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { log } from "./utils";
import "dotenv/config";

if (process.env.DATABASE_URL?.includes("52.220.170.93")) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const app = express();

declare module 'http' {
    interface IncomingMessage {
        rawBody: unknown
    }
}

app.use(express.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));

app.use(express.urlencoded({ extended: false }));

// Logger middleware
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }

            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }

            log(logLine);
        }
    });

    next();
});

// We wrap the route registration in a function so we can wait for it if needed
export async function createApp() {
    // Health check endpoint
    app.get("/api/health-check", async (_req, res) => {
        try {
            const result = await db.execute(sql`SELECT 1`);
            res.json({ status: "ok", message: "Database connected", result });
        } catch (err) {
            res.status(500).json({ status: "error", message: "Database connection failed", error: err instanceof Error ? err.message : String(err) });
        }
    });

    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        // Don't throw the error in production/serverless as it might crash the function
        if (process.env.NODE_ENV !== "production") {
            throw err;
        }
    });

    return app;
}

export { app };
