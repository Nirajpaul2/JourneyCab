import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (!args.length) {
  console.error("Usage: npm run docker -- up -d --build --wait | ps | logs | restart | stop");
  process.exit(1);
}
mkdirSync(new URL("../data/", import.meta.url), { recursive: true, mode: 0o700 });
// Match the existing local database owner instead of changing permissions or
// starting a second empty database. Never pass credentials through arguments.
const result = spawnSync("docker", ["compose", ...args], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    LOCAL_UID: process.env.LOCAL_UID ?? String(process.getuid?.() ?? 1000),
    LOCAL_GID: process.env.LOCAL_GID ?? String(process.getgid?.() ?? 1000),
  },
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
