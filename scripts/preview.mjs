import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

if (!existsSync("dist/index.html")) {
  console.error("Build the frontend first: npm run build");
  process.exit(1);
}

// The built frontend and booking API must share one origin.
// Isolate preview data from the development/production database.
const port = process.env.PREVIEW_PORT ?? "4173";
const child = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    HOST: "127.0.0.1",
    PORT: port,
    APP_ORIGIN: `http://127.0.0.1:${port}`,
    DATABASE_PATH: process.env.PREVIEW_DATABASE_PATH ?? "./data/preview.sqlite",
  },
});
console.log(`Starting JourneyCab frontend and API at http://127.0.0.1:${port}`);
child.on("error", (error) => {
  console.error("Could not start preview:", error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => { process.exitCode = code ?? 0; });
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
