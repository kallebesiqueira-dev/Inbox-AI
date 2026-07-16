# Architettura e diagrammi UML — Inbox AI

Documentazione tecnica dell'architettura di Inbox AI: componenti, dominio,
flussi principali e ciclo di vita delle entità. I diagrammi sono in formato
[Mermaid](https://mermaid.js.org/) e vengono renderizzati direttamente da GitHub.

## Indice

- [Diagramma dei componenti e del deploy](#diagramma-dei-componenti-e-del-deploy)
- [Diagramma delle classi — dominio backend](#diagramma-delle-classi--dominio-backend)
- [Diagramma ER — persistenza](#diagramma-er--persistenza)
- [Sequenza — automazione AI (email → offerta)](#sequenza--automazione-ai-email--offerta)
- [Sequenza — autenticazione e sessione](#sequenza--autenticazione-e-sessione)
- [Diagrammi di stato — cicli di vita](#diagrammi-di-stato--cicli-di-vita)

---

## Diagramma dei componenti e del deploy

Vista d'insieme: frontend statico su Vercel, API su Render, MongoDB Atlas e
servizi esterni. Il provider AI è **isolato dietro un layer di astrazione** e
non è mai esposto al client.

```mermaid
flowchart LR
    subgraph Browser["Browser dell'utente"]
        SPA["React SPA<br/>React Router · TanStack Query · Tailwind"]
    end

    subgraph Vercel["Vercel"]
        CDN["Hosting statico + CDN<br/>SPA fallback, cache immutable"]
    end

    subgraph Render["Render"]
        API["API Express (Node.js)<br/>Helmet · CORS allowlist · rate limit"]
        MW["Middleware<br/>requireAuth (JWT) · CSRF · error handler"]
        AI["Layer AI<br/>AIProvider"]
        API --> MW
        API --> AI
    end

    subgraph Atlas["MongoDB Atlas"]
        DB[("users · offertas · opportunitas<br/>approvaziones · contatores · revokedtokens")]
    end

    GROQ["Provider LLM<br/>(configurabile, mai esposto)"]
    GMAIL["Gmail API<br/>OAuth2 · lettura + invio"]
    SMTP["SMTP<br/>email reset password"]
    GSI["Google Identity<br/>accesso con Google"]
    STRIPE["Stripe Checkout<br/>abbonamenti (demo senza chiavi)"]

    SPA -- "HTTPS /api<br/>cookie HttpOnly + X-CSRF-Token" --> API
    CDN --> SPA
    SPA -.-> GSI
    MW --> DB
    AI -- "fallback euristico<br/>su errore" --> AI
    AI --> GROQ
    API --> GMAIL
    API --> SMTP
    API --> STRIPE

    subgraph CI["GitHub Actions"]
        PIPE["build + lint + test<br/>→ deploy hook Render"]
    end
    PIPE -.->|"push su main"| Render
    PIPE -.->|"auto deploy"| Vercel
```

---

## Diagramma delle classi — dominio backend

Il cuore del backend: un **CRUD generico multi-tenant** (ogni risorsa è
filtrata per `userId`, con cestino/soft-delete) riusato da tre risorse, e il
**contratto `AIProvider`** con due implementazioni intercambiabili.

```mermaid
classDiagram
    direction TB

    class Crud~TDTO_TInput~ {
        <<interface>>
        +elenca(userId, opzioni) TDTO[]
        +conta(userId, filtro) number
        +crea(userId, input) TDTO
        +aggiorna(userId, id, patch) TDTO
        +elimina(userId, id) boolean
        +elencaCestino(userId) TDTO[]
        +ripristina(userId, id) TDTO
        +eliminaDefinitivo(userId, id) boolean
    }
    note for Crud "Multi-tenant: ogni operazione filtra per userId. elimina() è un soft-delete (deletedAt)."

    class OffertaDTO {
        +id: string
        +numero: string
        +cliente: string
        +importo: number
        +stato: Stato
        +data: string
        +corpo: string
        +voci: VoceOfferta[]
    }
    class OpportunitaDTO {
        +id: string
        +cliente: string
        +valore: number
        +fase: FaseCrm
        +avatar?: string
        +data: string
    }
    class ApprovazioneDTO {
        +id: string
        +tipo: TipoApprovazione
        +oggetto: string
        +fase: FaseApprovazione
        +richiedente: string
        +data: string
    }

    Crud~TDTO_TInput~ <.. OffertaDTO : offerteCrud
    Crud~TDTO_TInput~ <.. OpportunitaDTO : opportunitaCrud
    Crud~TDTO_TInput~ <.. ApprovazioneDTO : approvazioneCrud

    class AIProvider {
        <<interface>>
        +nome: string
        +analizzaEmail(email) RisultatoAnalisi
        +generaOfferta(dati) OffertaGenerata
        +chat(messaggi, segnale) AsyncIterable~string~
    }
    class GroqProvider {
        -apiKey: string
        -model: string
        +analizzaEmail(email) RisultatoAnalisi
        +generaOfferta(dati) OffertaGenerata
        +chat(messaggi, segnale) AsyncIterable~string~
    }
    class DefaultProvider {
        +analizzaEmail(email) RisultatoAnalisi
        +generaOfferta(dati) OffertaGenerata
        +chat(messaggi, segnale) AsyncIterable~string~
    }

    AIProvider <|.. GroqProvider : LLM reale (JSON mode, zod)
    AIProvider <|.. DefaultProvider : euristica locale
    GroqProvider --> DefaultProvider : fallback su errore

    class RisultatoAnalisi {
        +categoria: CategoriaEmail
        +priorita: Alta|Media|Bassa
        +riassunto: string
        +azioniSuggerite: string[]
    }
    class OffertaGenerata {
        +titolo: string
        +corpo: string
        +voci: VoceOfferta[]
    }
    AIProvider ..> RisultatoAnalisi
    AIProvider ..> OffertaGenerata
```

---

## Diagramma ER — persistenza

Collezioni MongoDB e relazioni logiche. L'isolamento multi-tenant passa dal
campo `userId` presente su ogni risorsa; gli indici composti coprono le query
calde (`userId + deletedAt + createdAt`).

```mermaid
erDiagram
    USER ||--o{ OFFERTA : "possiede"
    USER ||--o{ OPPORTUNITA : "possiede"
    USER ||--o{ APPROVAZIONE : "possiede"
    USER ||--o{ CONTATORE : "numerazione per anno"
    OFFERTA ||--o| APPROVAZIONE : "genera all'invio"

    USER {
        ObjectId _id PK
        string email UK
        string nome
        string passwordHash "opzionale (account Google)"
        string googleId "opzionale"
        string avatar "data URL"
        mixed impostazioni
        string gmailToken "refresh token cifrato AES-256-GCM"
        string gmailEmail
        string resetTokenHash "sparse index"
        date resetTokenExp
        date passwordCambiataAl "invalida sessioni precedenti"
    }
    OFFERTA {
        ObjectId _id PK
        string userId FK
        string numero "progressivo utente-anno"
        string cliente
        number importo
        string stato "Bozza|In revisione|Approvata|Inviata"
        date data
        string corpo "documento generato dall'AI"
        array voci
        date deletedAt "cestino (soft delete)"
    }
    OPPORTUNITA {
        ObjectId _id PK
        string userId FK
        string cliente
        number valore
        string fase "Nuovo|In Analisi|Offerta Inviata|Negoziazione|Chiuso"
        string avatar "foto cliente"
        date deletedAt "cestino (soft delete)"
    }
    APPROVAZIONE {
        ObjectId _id PK
        string userId FK
        string tipo
        string oggetto
        string fase "Bozza|Revisione|Approvazione|Esecuzione"
        string richiedente
        date deletedAt "cestino (soft delete)"
    }
    CONTATORE {
        ObjectId _id PK
        string chiave UK "offerta:userId:anno"
        number valore "incremento atomico"
    }
    REVOKED_TOKEN {
        ObjectId _id PK
        string jti UK
        date scadenza "indice TTL (auto-purge)"
    }
```

---

## Sequenza — automazione AI (email → offerta)

Il flusso di valore centrale del prodotto: dall'email reale (Gmail) alla
classificazione, alla generazione dell'offerta, fino alla persistenza con
numero progressivo e approvazione automatica.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utente
    participant SPA as React SPA
    participant API as API Express
    participant AI as AIProvider
    participant LLM as Provider LLM
    participant DB as MongoDB

    U->>SPA: apre un'email nell'Inbox
    SPA->>API: GET /inbox (auth, rate limit)
    API->>DB: refresh token Gmail (cifrato)
    API-->>SPA: email reali (classificate, cache per messaggio)

    U->>SPA: "Analizza con AI"
    SPA->>API: POST /ai/analizza-email (auth + CSRF + rate limit)
    API->>AI: analizzaEmail(mittente, oggetto, corpo)
    AI->>LLM: completions (JSON mode, testo untrusted delimitato)
    alt risposta valida (zod)
        LLM-->>AI: categoria · priorità · riassunto · azioni
    else errore / timeout / quota
        AI->>AI: fallback euristico locale
    end
    AI-->>SPA: RisultatoAnalisi

    U->>SPA: "Genera offerta con AI"
    SPA->>API: POST /ai/genera-offerta
    API->>AI: generaOfferta(cliente, richiesta)
    AI-->>SPA: titolo · corpo · voci (anteprima)

    U->>SPA: "Crea offerta"
    SPA->>API: POST /offerte
    API->>DB: $inc contatore utente-anno (atomico)
    API->>DB: salva offerta (numero es. 2026-007)
    API->>DB: crea approvazione "Invio offerta"
    API-->>SPA: offerta persistita
    SPA-->>U: toast + elenco aggiornato
```

---

## Sequenza — autenticazione e sessione

Sessione con cookie firmato `HttpOnly` + protezione CSRF double-submit
(il token viaggia nel corpo della risposta perché frontend e backend stanno
su domini diversi). Al logout il token è revocato lato server tramite `jti`.

```mermaid
sequenceDiagram
    autonumber
    actor U as Utente
    participant SPA as React SPA
    participant API as API Express
    participant DB as MongoDB

    U->>SPA: email + password (o Google)
    SPA->>API: POST /auth/login (rate limit)
    API->>DB: verifica credenziali (bcrypt, tempo costante)
    API-->>SPA: Set-Cookie sessione (JWT con jti, HttpOnly, Secure)<br/>+ csrfToken nel corpo
    SPA->>SPA: conserva csrfToken in memoria

    loop richieste che modificano lo stato
        SPA->>API: POST/PATCH/DELETE + header X-CSRF-Token
        API->>API: requireAuth: verifica JWT (HS256),<br/>jti non revocato, iat ≥ ultimo cambio password
        API-->>SPA: risposta
    end

    U->>SPA: Esci
    SPA->>API: POST /auth/logout
    API->>DB: revoca jti (cache O(1) + collezione TTL)
    API-->>SPA: cookie cancellato (204)
```

---

## Diagrammi di stato — cicli di vita

### Offerta

```mermaid
stateDiagram-v2
    [*] --> Bozza : creazione (manuale o AI)
    Bozza --> InRevisione : invio in revisione
    InRevisione --> Approvata : approvazione
    Approvata --> Inviata : invio al cliente
    Inviata --> [*]
    note right of Bozza : numero progressivo per utente/anno
```

### Opportunità (pipeline CRM)

```mermaid
stateDiagram-v2
    [*] --> Nuovo
    Nuovo --> InAnalisi : qualificazione
    InAnalisi --> OffertaInviata : proposta al cliente
    OffertaInviata --> Negoziazione : trattativa
    Negoziazione --> Chiuso : esito
    Chiuso --> [*]
```

### Approvazione (controllo umano)

```mermaid
stateDiagram-v2
    [*] --> Bozza
    Bozza --> Revisione
    Revisione --> Approvazione
    Approvazione --> Esecuzione
    Esecuzione --> [*]
    note right of Revisione : i passaggi critici richiedono conferma umana
```

### Elementi eliminati (cestino)

```mermaid
stateDiagram-v2
    [*] --> Attivo
    Attivo --> NelCestino : elimina (soft delete)
    NelCestino --> Attivo : ripristina
    NelCestino --> [*] : elimina definitivamente
```
