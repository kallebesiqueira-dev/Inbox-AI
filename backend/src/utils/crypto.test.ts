import { test } from "node:test";
import assert from "node:assert/strict";
import { cifra, decifra } from "./crypto.js";

test("cifra/decifra: round-trip corretto", () => {
  const segreto = "refresh-token-di-prova-123";
  const blob = cifra(segreto);
  assert.notEqual(blob, segreto, "il testo cifrato non deve essere in chiaro");
  assert.equal(decifra(blob), segreto, "la decifratura deve restituire l'originale");
});

test("decifra: ritorna null su input non valido", () => {
  assert.equal(decifra("non-un-blob-valido"), null);
});

test("cifra: due cifrature dello stesso testo differiscono (IV casuale)", () => {
  assert.notEqual(cifra("x"), cifra("x"));
});
