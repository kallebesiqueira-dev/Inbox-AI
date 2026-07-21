import type { Request, Response } from "express";
import { z } from "zod";
import { env } from "../config/env.js";

/**
 * Checkout dell'abbonamento tramite Stripe Checkout (pagina ospitata).
 *
 * Piano unico (€7/mese) con 14 giorni di prova gratuita. Senza chiavi Stripe
 * configurate risponde `{ demo: true }`: la landing mostra il prezzo ma non
 * avvia pagamenti. Quando `STRIPE_SECRET_KEY` e `STRIPE_PRICE_ID` sono
 * impostati, crea una sessione reale e restituisce l'URL a cui reindirizzare.
 * Nessuna dipendenza: si usa l'API REST di Stripe (form-encoded) via fetch.
 */

const schema = z.object({ piano: z.literal("unico") });

/** Prima origine di CLIENT_URL (può essere una lista separata da virgole). */
function origineFrontend(): string {
  return env.CLIENT_URL.split(",")[0].trim().replace(/\/$/, "");
}

export async function checkout(req: Request, res: Response) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ messaggio: "Piano non valido." });
  }
  const price = env.STRIPE_PRICE_ID;

  // Modalità demo: chiavi non configurate → nessun pagamento reale.
  if (!env.STRIPE_SECRET_KEY || !price) {
    return res.json({ demo: true });
  }

  const base = origineFrontend();
  const corpo = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    // 14 giorni di prova gratuita gestiti da Stripe: l'addebito parte solo
    // alla fine del periodo di prova.
    "subscription_data[trial_period_days]": "14",
    success_url: `${base}/login?abbonamento=attivo`,
    cancel_url: `${base}/#prezzi`,
  });

  const risposta = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: corpo.toString(),
    signal: AbortSignal.timeout(15_000),
  });

  const dati = (await risposta.json()) as { url?: string; error?: { message?: string } };
  if (!risposta.ok || !dati.url) {
    console.error("[Billing] creazione sessione fallita:", dati.error?.message);
    return res
      .status(502)
      .json({ messaggio: "Impossibile avviare il pagamento. Riprova più tardi." });
  }
  res.json({ url: dati.url });
}
