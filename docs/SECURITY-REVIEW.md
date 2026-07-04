# Revisione critica di sicurezza — Inbox AI

> Revisione manuale del codice (repo pubblico su GitHub con CI: build, lint e test a ogni
> push; deploy backend via hook solo a CI verde). Ambito: autenticazione, sessioni, CORS
> cross-site Vercel ↔ Render, gestione dei segreti, validazione input, esposizione del
> sub-processor AI, rate limiting e protezione dei dati (GDPR).
>
> Legenda severità: 🔴 Alta · 🟠 Media · 🟡 Bassa · ⚪ Informativa.

---

## Sintesi

L'impostazione di base è **solida**: password con `bcrypt` (cost 12), sessioni con cookie
`HttpOnly` firmato (JWT), protezione CSRF double-submit, `helmet`, rate limiting su auth e
AI, validazione `zod` sull'autenticazione, segreti obbligatori in produzione e provider AI
confinato lato server. I punti sotto sono miglioramenti, non difetti bloccanti — tranne il
**🔴 CORS** che va corretto prima di esporre il servizio in produzione.

| #  | Severità | Tema | Stato |
|----|----------|------|-------|
| 1  | 🔴 Alta      | CORS: wildcard `*.vercel.app` con credenziali | ✅ **Risolto** (2026-06-21) |
| 2  | 🟠 Media     | Enumerazione account (registrazione/login)    | ✅ Mitigato (login) |
| 3  | 🟠 Media     | Endpoint AI senza schema/limiti di lunghezza  | ✅ Risolto |
| 4  | 🟡 Bassa     | Fallback `jwtSecret` a stringa vuota in prod  | ✅ **Risolto** (2026-06-22) |
| 5  | 🟡 Bassa     | Logout non revoca il JWT lato server          | ✅ **Risolto** (2026-06-22) |
| 6  | 🟡 Bassa     | Token CSRF longevo (7g), non legato alla sessione | Accettabile |
| 7  | 🟠 Media     | GDPR / dati a riposo (Gmail + sub-processor AI) | **Aperto** (attivo dal collegamento Gmail/LLM reale) |
| 8  | ⚪ Info      | Race su unicità email → 500 invece di 409      | ✅ Risolto (E11000 → 409) |
| 9  | 🟡 Bassa     | Sessioni valide dopo cambio/reset password     | ✅ Risolto (`passwordCambiataAl` + verifica `iat`) |

---

## 1. 🔴 CORS: il wildcard `*.vercel.app` è un'origine attendibile con credenziali

**File:** `backend/src/index.ts:30` — `if (consentite.includes(origin) || /\.vercel\.app$/.test(host))`

La regex `/\.vercel\.app$/` accetta **qualunque** sottodominio di `vercel.app`, non solo le
anteprime di questo progetto. Combinata con `credentials: true` e i cookie di sessione
`SameSite=None` in produzione, un attaccante che pubblica `sito-malevolo.vercel.app` ottiene
un'origine *attendibile* da cui effettuare richieste autenticate cross-site verso l'API,
indebolendo di fatto la protezione CORS/CSRF.

**Raccomandazione:** restringere alle anteprime del solo progetto, idealmente da configurazione.

```ts
// Esempio: allowlist esplicita + prefisso del progetto per le anteprime Vercel
const PREVIEW = /^inbox-ai[a-z0-9-]*\.vercel\.app$/; // adattare allo slug reale del progetto
if (consentite.includes(origin) || PREVIEW.test(host)) {
  return cb(null, true);
}
```

In alternativa, eliminare del tutto il wildcard e gestire ogni dominio di anteprima tramite
`CLIENT_URL` (lista separata da virgole).

> ✅ **Risolto (2026-06-21):** il wildcard generico è stato rimosso. Le anteprime Vercel sono
> ora abilitate **solo** se la variabile `VERCEL_PROJECT` è configurata, e limitate ai
> sottodomini del progetto (`^<slug>[a-z0-9-]*\.vercel\.app$`, slug con escape regex). Senza
> quella variabile nessun wildcard è consentito (sicuro di default). Vedi `backend/src/index.ts`,
> `.env.example`, `render.yaml`. **Azione richiesta al deploy:** impostare `VERCEL_PROJECT` con
> lo slug reale del progetto Vercel.

## 2. 🟠 Enumerazione degli account

**File:** `backend/src/controllers/auth.controller.ts:44` e `backend/src/services/auth.service.ts:70`

- La registrazione risponde `409 "Email già registrata"`, rivelando se un'email esiste.
- `autentica()` ritorna `null` senza eseguire `bcrypt.compare` quando l'utente non esiste:
  la differenza di tempo di risposta consente l'enumerazione anche sul login.

Il rate limit (20 tentativi / 15 min) attenua l'abuso ma non elimina il canale.

**Raccomandazione:** messaggio di registrazione neutro ("Se l'email è valida riceverai
istruzioni…" nei flussi con email) ed eseguire comunque un `bcrypt.compare` fittizio su un
hash costante quando l'utente non esiste, per uniformare i tempi.

> ✅ **Mitigato (2026-06-21):** `autentica()` ora esegue un `bcrypt.compare` contro un hash
> costante (`HASH_FITTIZIO`) quando l'utente non esiste, uniformando i tempi di risposta del
> login (~stesso costo del confronto reale). Verificato: login con email inesistente ~465ms.
> *Residuo:* la registrazione continua a restituire `409` (scelta UX consapevole, sotto rate
> limit); valutare un messaggio neutro se l'enumerazione in registrazione diventa una priorità.

## 3. 🟠 Endpoint AI senza validazione di schema né limiti di lunghezza

**File:** `backend/src/controllers/ai.controller.ts:6,23`

`analizzaEmail`/`generaOfferta` controllano solo la **presenza** dei campi; non c'è schema
`zod` né limite di lunghezza (oltre al cap globale di `1mb` su `express.json`). Con il
provider euristico attuale il rischio è basso, ma quando verrà collegato un LLM reale:

- input lunghi → costo/abuso (il `aiLimiter` limita la frequenza, non la dimensione);
- contenuto dell'email → **prompt injection** verso il provider.

**Raccomandazione:** validare con `zod` (come per l'auth) e imporre limiti espliciti, es.
`oggetto ≤ 300`, `corpo ≤ 10.000` caratteri; trattare il testo email come **dato non fidato**
nel prompt del provider (delimitazione/escaping, istruzioni di sistema separate).

> ✅ **Risolto (2026-06-21):** entrambi gli endpoint usano ora schemi `zod` con limiti di
> lunghezza (`mittente ≤ 320`, `oggetto ≤ 300`, `corpo ≤ 10.000`, `cliente ≤ 200`,
> `richiesta ≤ 10.000`) e restituiscono `400` con dettaglio errori. Verificato: payload non
> valido e `corpo` >10k → `400`; payload valido → `200`.
>
> ✅ **Aggiornamento (2026-06-22):** integrato un LLM reale (`GroqProvider`). Il testo non
> fidato è ora **delimitato** (`<email>`/`<richiesta>`) e il *system prompt* istruisce
> esplicitamente a non eseguire istruzioni contenute nel contenuto. L'output del modello è
> validato con `zod` prima di lasciare il layer AI; in caso di errore si ricade sull'euristica.

## 4. 🟡 Fallback di `jwtSecret` a stringa vuota in produzione

**File:** `backend/src/config/env.ts:38` — `env.JWT_SECRET ?? (isProd ? "" : "dev-secret…")`

Oggi il controllo a `env.ts:41` interrompe l'avvio se `JWT_SECRET` manca in produzione,
quindi la stringa vuota non viene mai usata. Resta però un *footgun*: se quel controllo
venisse aggirato (es. `NODE_ENV` mal configurato), si firmerebbero/verificherebbero token con
segreto vuoto. **Raccomandazione:** non prevedere un fallback vuoto — fallire in modo esplicito.

> ✅ **Risolto (2026-06-22):** rimosso il fallback a stringa vuota. Il fallback in sviluppo è
> ora un segreto locale non vuoto; in produzione `JWT_SECRET` resta obbligatorio (arresto se
> mancante) e deve essere lungo **≥ 32 caratteri** (arresto altrimenti). Per costruzione non è
> più possibile firmare/verificare token con segreto vuoto. File: `backend/src/config/env.ts`.

## 5. 🟡 Il logout non invalida il JWT lato server

**File:** `backend/src/controllers/auth.controller.ts:100`

Il logout cancella solo i cookie; un JWT eventualmente esfiltrato resta valido fino alla
scadenza (7 giorni). Senza store di sessione non è revocabile. Accettabile per questo ambito,
ma da documentare; se richiesto, introdurre una denylist di token o `tokenVersion` per utente.

> ✅ **Risolto (2026-06-22):** introdotta una **denylist per `jti`**. Ogni token di sessione
> porta ora un `jti` univoco (`utils/token.ts`). Al logout il `jti` viene revocato fino alla
> scadenza naturale (`services/revocation.service.ts`): un token esfiltrato non è più valido
> dopo il logout. La revoca vive in una **cache in memoria** (controllo O(1) in `requireAuth`,
> nessun round-trip al DB nel percorso caldo) ed è **persistita** nella collezione
> `RevokedToken` con **indice TTL** (auto-pulizia + ricarica all'avvio: sopravvive a
> riavvii/deploy). In modalità demo (senza Mongo) funziona solo in memoria.
> **Nota di esercizio:** la cache è per-istanza; con più istanze servirebbe uno store condiviso
> (es. Redis). Su Render free (istanza singola) è corretto. Verificato via smoke test:
> `login → /me 200 → logout 204 → /me con token revocato → 401`.

## 6. 🟡 Token CSRF longevo, leggibile da JS e non legato alla sessione

**File:** `backend/src/utils/token.ts:40` + `backend/src/middleware/auth.ts:18`

Double-submit classico: corretto e robusto rispetto a CSRF cross-site (un sito terzo non può
leggere il cookie né impostare l'header `X-CSRF-Token` cross-origin). Note: il token è
leggibile da JS (esposto in caso di XSS) e vive 7 giorni senza legame con la sessione.
Accettabile; in caso di XSS l'intera sessione è comunque compromessa.

## 7. 🟠 GDPR / dati a riposo (Gmail + sub-processor AI) — APERTO

**Stato attuale (aggiornato):** la lettura Gmail reale e l'LLM reale (Groq) **sono attivi**.
L'app memorizza il refresh token Gmail e invia oggetto/corpo delle email al sub-processor AI
per la classificazione.

Mitigazioni già in atto:
- refresh token Gmail **cifrato a riposo** con AES-256-GCM (`utils/crypto.ts`);
- scope OAuth minimi (`gmail.readonly` + `gmail.send`);
- i corpi email **non vengono persistiti** (transitano solo per la classificazione, con
  cache in memoria limitata);
- output dell'LLM validato con zod; testo non fidato delimitato nel prompt.

Ancora da fare per la piena conformità:
- cancellazione account self-service con erasure completo (diritto all'oblio);
- informativa privacy con base giuridica e menzione del sub-processor AI (DPA);
- policy di retention documentata.

## 8. ⚪ Race condition sull'unicità dell'email — ✅ RISOLTO

Tra il controllo `trovaPerEmail` e `User.create` due richieste concorrenti potevano superare
il check. Ora l'errore duplicate-key (11000) viene intercettato e mappato su `409`
(`auth.service.ts`). Inoltre gli errori async dei controller passano tutti dall'errorHandler
tramite un wrapper (`utils/asyncHandler.ts`): nessun crash di processo su rejection.

## 9. 🟡 Sessioni valide dopo cambio/reset password — ✅ RISOLTO

I JWT emessi prima di un cambio/reset password ora vengono rifiutati: `User.passwordCambiataAl`
viene confrontato con l'`iat` del token in `requireAuth` (cache in memoria con TTL 60s, un
lookup per utente al minuto). Un reset password invalida quindi tutte le sessioni precedenti —
esattamente lo scenario "password compromessa".

---

## Aspetti positivi confermati

- Password con `bcrypt` cost 12; hash mai esposti dai DTO pubblici.
- Cookie di sessione `HttpOnly`, `Secure` in produzione, `SameSite=None` per il cross-site.
- CSRF double-submit sui metodi mutanti; sessione richiesta su tutte le risorse.
- `helmet`, `express.json` con cap a `1mb`, `trust proxy` dietro Render.
- Rate limiting dedicato su auth (anti brute-force) e AI (anti abuso/costo).
- Validazione `zod` sui payload di autenticazione.
- Segreti obbligatori in produzione (`MONGODB_URI`, `JWT_SECRET`) con arresto in mancanza.
- **Provider AI e relative chiavi confinati lato server**: il frontend non conosce mai
  provider, modello o brand.
- Verifica del token Google lato server con `google-auth-library`.
- `.env` correttamente in `.gitignore`.

## Priorità d'intervento

1. ~~**Prima della produzione:** correggere il CORS (#1).~~ ✅
2. ~~**A breve:** mitigare l'enumerazione (#2) e irrobustire gli endpoint AI (#3).~~ ✅
3. **Aperto:** blocco GDPR (#7) — cancellazione account, privacy policy, DPA. Gmail e LLM
   reali sono attivi, quindi è l'unico punto sostanziale rimasto.
