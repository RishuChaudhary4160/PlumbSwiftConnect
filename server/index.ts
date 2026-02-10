import "dotenv/config";
import { createApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";
import { createServer } from "http";

(async () => {
  const app = await createApp();
  const server = createServer(app);

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5050', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    console.log(`Server instance started on port ${port}, connected to PostgreSQL.`);
  });
})();
