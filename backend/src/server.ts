import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./shared/utils/logger.js";

// Start HTTP server
const server = app.listen(env.PORT, () => {
  logger.info(`⚡ Dhaka Tesla Pool API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
