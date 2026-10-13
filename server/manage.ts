import { Store } from "./store";
import { backup } from "node:sqlite";
import { resolve } from "node:path";
process.umask(0o077);
const store = new Store(
  process.env.DATABASE_PATH ?? "./data/journeycab.sqlite",
);
try {
  const [command, arg] = process.argv.slice(2);
  if (command === "admin" && arg) {
    // Read the password from stdin, never a command-line argument or tracked file.
    let password = "";
    for await (const chunk of process.stdin) password += chunk;
    await store.addAdmin(arg, password.replace(/\r?\n$/, ""));
    console.log("Staff account created.");
  } else if (command === "backup" && arg) {
    await backup(store.db, resolve(arg));
    console.log("Database backup completed.");
  } else
    throw new Error(
      "Usage: npm run manage -- admin staff@example.com < password-on-stdin, or npm run manage -- backup /secure/path/backup.sqlite",
    );
} finally {
  store.close();
}
