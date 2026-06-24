import { test } from "node:test";
import assert from "node:assert/strict";
import { DefaultProvider } from "./DefaultProvider.js";

const ai = new DefaultProvider();

test("analizzaEmail: classifica una richiesta di preventivo come Commerciale", async () => {
  const r = await ai.analizzaEmail({
    mittente: "ufficio@acme.it",
    oggetto: "Richiesta preventivo per fornitura",
    corpo: "Vorremmo un preventivo.",
  });
  assert.equal(r.categoria, "Commerciale");
  assert.ok(["Alta", "Media", "Bassa"].includes(r.priorita));
  assert.ok(r.azioniSuggerite.length > 0);
});

test("analizzaEmail: classifica un problema come Supporto con priorità Alta", async () => {
  const r = await ai.analizzaEmail({
    mittente: "cliente@x.it",
    oggetto: "Problema di accesso",
    corpo: "Errore di assistenza urgente.",
  });
  assert.equal(r.categoria, "Supporto");
  assert.equal(r.priorita, "Alta");
});

test("generaOfferta: ritorna titolo, corpo e voci con importi", async () => {
  const o = await ai.generaOfferta({ cliente: "ACME", richiesta: "fornitura" });
  assert.match(o.titolo, /ACME/);
  assert.ok(o.corpo.length > 0);
  assert.ok(o.voci.length > 0);
  assert.ok(o.voci.every((v) => typeof v.importo === "number"));
});

test("chat: produce testo in streaming", async () => {
  let testo = "";
  for await (const chunk of ai.chat([{ ruolo: "utente", contenuto: "ciao" }])) {
    testo += chunk;
  }
  assert.ok(testo.length > 0);
});
