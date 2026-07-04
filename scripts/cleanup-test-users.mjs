// Rimuove gli utenti di test (probe_*/verify_* @test.local) creati dai check e2e.
// Uso: node scripts/cleanup-test-users.mjs [--apply]
import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const apply = process.argv.includes("--apply");
await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.collection("users");
const filtro = { email: /^(probe_|verify_)[a-z0-9]+@test\.local$/ };

const trovati = await users.find(filtro).project({ email: 1 }).toArray();
console.log(`Trovati ${trovati.length}:`, trovati.map((u) => u.email).join(", "));
if (apply && trovati.length) {
  const r = await users.deleteMany(filtro);
  console.log(`Eliminati: ${r.deletedCount}`);
} else if (!apply) {
  console.log("Dry-run. Rilancia con --apply per eliminare.");
}
await mongoose.disconnect();
