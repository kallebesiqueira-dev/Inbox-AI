// Smoke test dei controlli di sicurezza (item 2 e 3).
const BASE = "http://localhost:4000/api";

const cookieDe = (res) =>
  (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]);

const run = async () => {
  // 1. Registrazione → ottiene i cookie di sessione + CSRF.
  const reg = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Smoke Test",
      email: `smoke${Date.now()}@inboxai.it`,
      password: "SmokeInbox2026",
    }),
  });
  const cookies = cookieDe(reg);
  const csrf = cookies.find((c) => c.startsWith("ia_csrf="))?.split("=")[1];
  console.log(`register: ${reg.status} (atteso 201), csrf=${csrf ? "ok" : "MANCANTE"}`);

  const headers = {
    "Content-Type": "application/json",
    Cookie: cookies.join("; "),
    "X-CSRF-Token": csrf ?? "",
  };

  // 2. AI con payload INVALIDO (oggetto vuoto) → atteso 400.
  const bad = await fetch(`${BASE}/ai/analizza-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ mittente: "a@b.it", oggetto: "" }),
  });
  console.log(`ai invalido: ${bad.status} (atteso 400)`);

  // 3. AI con corpo troppo lungo (>10k) → atteso 400.
  const tooLong = await fetch(`${BASE}/ai/analizza-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mittente: "a@b.it",
      oggetto: "Test",
      corpo: "x".repeat(10_001),
    }),
  });
  console.log(`ai corpo >10k: ${tooLong.status} (atteso 400)`);

  // 4. AI con payload VALIDO → atteso 200.
  const ok = await fetch(`${BASE}/ai/analizza-email`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mittente: "cliente@azienda.it",
      oggetto: "Richiesta preventivo fornitura",
      corpo: "Buongiorno, vorremmo un preventivo urgente.",
    }),
  });
  const body = await ok.json();
  console.log(`ai valido: ${ok.status} (atteso 200), categoria=${body.categoria}`);

  // 5. Login con email inesistente → atteso 401 (e tempo uniforme via hash fittizio).
  const t0 = Date.now();
  const wrong = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "inesistente@nessuno.it", password: "qualcosa" }),
  });
  console.log(`login inesistente: ${wrong.status} (atteso 401), ~${Date.now() - t0}ms`);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
