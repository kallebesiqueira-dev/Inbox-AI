// Rimuove gli utenti di test (*@test.local) creati dai check e2e, inclusi i
// loro dati collegati (offerte, opportunità, approvazioni, contatori).
// Uso: node scripts/cleanup-test-users.mjs [--apply]
import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });

const apply = process.argv.includes("--apply");
await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;
const users = db.collection("users");
const filtro = { email: /@test\.local$/ };

const trovati = await users.find(filtro).project({ email: 1 }).toArray();
console.log(`Trovati ${trovati.length}:`, trovati.map((u) => u.email).join(", "));

if (apply && trovati.length) {
  const idsStr = trovati.map((u) => u._id.toString());
  // userId è salvato come stringa nei documenti delle risorse
  for (const nome of ["offertas", "opportunitas", "approvaziones"]) {
    const r = await db.collection(nome).deleteMany({ userId: { $in: idsStr } });
    if (r.deletedCount) console.log(`${nome}: eliminati ${r.deletedCount}`);
  }
  // I contatori sono indicizzati per chiave "offerta:<userId>:<anno>"
  const rc = await db
    .collection("contatores")
    .deleteMany({ chiave: { $regex: `^offerta:(${idsStr.join("|")}):` } });
  if (rc.deletedCount) console.log(`contatores: eliminati ${rc.deletedCount}`);
  const r = await users.deleteMany(filtro);
  console.log(`users: eliminati ${r.deletedCount}`);
} else if (!apply) {
  console.log("Dry-run. Rilancia con --apply per eliminare.");
}
await mongoose.disconnect();
