# Revisione critica di sicurezza — Inbox AI

> Revisione manuale del codice (il progetto non è ancora un repository Git, quindi non è
> stata usata la review basata sul diff). Ambito: autenticazione, sessioni, CORS cross-site
> Vercel ↔ Render, gestione dei segreti, validazione input, esposizione del sub-processor AI,
> rate limiting e protezione dei dati (GDPR).
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
| 1  | 🔴 Alta      | CORS: wildcard `*.vercel.app` con credenziali | **Da correggere** |
| 2  | 🟠 Media     | Enumerazione account (registrazione/login)    | Da mitigare |
| 3  | 🟠 Media     | Endpoint AI senza schema/limiti di lunghezza  | Da irrobustire |
| 4  | 🟡 Bassa     | Fallback `jwtSecret` a stringa vuota in prod  | Difesa in profondità |
| 5  | 🟡 Bassa     | Logout non revoca il JWT lato server          | Accettabile, da documentare |
| 6  | 🟡 Bassa     | Token CSRF longevo (7g), non legato alla sessione | Accettabile |
| 7  | ⚪ Info      | GDPR / dati a riposo (Gmail + sub-processor AI) | Futuro |
| 8  | ⚪ Info      | Race su unicità email → 500 invece di 409      | Cosmetico |

---

## 1. 🔴 CORS: il wildcard `*.vercel.app` è un'origine attendibile con credenziali

**File:** `server/src/index.ts:30` — `if (consentite.includes(origin) || /\.vercel\.app$/.test(host))`

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
`CLIENT_URL` (lista separata da virgole). **Non** applicata automaticamente perché cambia il
comportamento di produzione: va validata contro lo slug Vercel reale per non rompere le
anteprime legittime.

## 2. 🟠 Enumerazione degli account

**File:** `server/src/controllers/auth.controller.ts:44` e `server/src/services/auth.service.ts:70`

- La registrazione risponde `409 "Email già registrata"`, rivelando se un'email esiste.
- `autentica()` ritorna `null` senza eseguire `bcrypt.compare` quando l'utente non esiste:
  la differenza di tempo di risposta consente l'enumerazione anche sul login.

Il rate limit (20 tentativi / 15 min) attenua l'abuso ma non elimina il canale.

**Raccomandazione:** messaggio di registrazione neutro ("Se l'email è valida riceverai
istruzioni…" nei flussi con email) ed eseguire comunque un `bcrypt.compare` fittizio su un
hash costante quando l'utente non esiste, per uniformare i tempi.

## 3. 🟠 Endpoint AI senza validazione di schema né limiti di lunghezza

**File:** `server/src/controllers/ai.controller.ts:6,23`

`analizzaEmail`/`generaOfferta` controllano solo la **presenza** dei campi; non c'è schema
`zod` né limite di lunghezza (oltre al cap globale di `1mb` su `express.json`). Con il
provider euristico attuale il rischio è basso, ma quando verrà collegato un LLM reale:

- input lunghi → costo/abuso (il `aiLimiter` limita la frequenza, non la dimensione);
- contenuto dell'email → **prompt injection** verso il provider.

**Raccomandazione:** validare con `zod` (come per l'auth) e imporre limiti espliciti, es.
`oggetto ≤ 300`, `corpo ≤ 10.000` caratteri; trattare il testo email come **dato non fidato**
nel prompt del provider (delimitazione/escaping, istruzioni di sistema separate).

## 4. 🟡 Fallback di `jwtSecret` a stringa vuota in produzione

**File:** `server/src/config/env.ts:38` — `env.JWT_SECRET ?? (isProd ? "" : "dev-secret…")`

Oggi il controllo a `env.ts:41` interrompe l'avvio se `JWT_SECRET` manca in produzione,
quindi la stringa vuota non viene mai usata. Resta però un *footgun*: se quel controllo
venisse aggirato (es. `NODE_ENV` mal configurato), si firmerebbero/verificherebbero token con
segreto vuoto. **Raccomandazione:** non prevedere un fallback vuoto — fallire in modo esplicito.

## 5. 🟡 Il logout non invalida il JWT lato server

**File:** `server/src/controllers/auth.controller.ts:100`

Il logout cancella solo i cookie; un JWT eventualmente esfiltrato resta valido fino alla
scadenza (7 giorni). Senza store di sessione non è revocabile. Accettabile per questo ambito,
ma da documentare; se richiesto, introdurre una denylist di token o `tokenVersion` per utente.

## 6. 🟡 Token CSRF longevo, leggibile da JS e non legato alla sessione

**File:** `server/src/utils/token.ts:40` + `server/src/middleware/auth.ts:18`

Double-submit classico: corretto e robusto rispetto a CSRF cross-site (un sito terzo non può
leggere il cookie né impostare l'header `X-CSRF-Token` cross-origin). Note: il token è
leggibile da JS (esposto in caso di XSS) e vive 7 giorni senza legame con la sessione.
Accettabile; in caso di XSS l'intera sessione è comunque compromessa.

## 7. ⚪ GDPR / dati a riposo (Gmail + sub-processor AI)

Allo stato attuale l'app verifica solo l'**ID token** Google e **non memorizza** access/refresh
token Gmail né corpi email (il provider AI è euristico e locale). Il rischio "token Gmail a
riposo" della checklist **non è ancora presente**. Quando si aggiungeranno la lettura Gmail e
un LLM reale:

- cifrare a riposo i refresh token (non basta il default di Atlas) e ridurre gli scope OAuth;
- DPA con il sub-processor AI; informativa privacy e base giuridica per l'analisi delle email;
- minimizzazione/retention dei corpi email; possibilità di cancellazione (diritto all'oblio).

## 8. ⚪ Race condition sull'unicità dell'email

**File:** `server/src/services/auth.service.ts:57,66`

Tra il controllo `trovaPerEmail` e `User.create` due richieste concorrenti possono superare il
check; l'indice `unique` su Mongo previene il duplicato ma l'errore emerge come `500` generico
anziché `409`. Cosmetico: gestire l'errore duplicate-key (codice 11000) e restituire `409`.

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

1. **Prima della produzione:** correggere il CORS (#1).
2. **A breve:** mitigare l'enumerazione (#2) e irrobustire gli endpoint AI (#3) prima di
   collegare un LLM reale.
3. **Quando si abilita Gmail/LLM reale:** affrontare il blocco GDPR (#7).
