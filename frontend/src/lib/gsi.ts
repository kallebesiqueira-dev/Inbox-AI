// Carica lo script di Google Identity Services una sola volta (per il flusso
// "code" usato dal collegamento Gmail). Risolve quando l'API è disponibile.
let promessa: Promise<void> | null = null;

export function caricaGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (promessa) return promessa;

  promessa = new Promise((resolve, reject) => {
    let s = document.getElementById("gsi-client") as HTMLScriptElement | null;
    if (s && window.google?.accounts?.oauth2) return resolve();
    if (!s) {
      s = document.createElement("script");
      s.id = "gsi-client";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      document.body.appendChild(s);
    }
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => {
      // Un fallimento (rete) non deve avvelenare la cache per sempre:
      // al prossimo tentativo si ricarica lo script.
      promessa = null;
      s?.remove();
      reject(new Error("Caricamento GSI fallito."));
    });
  });
  return promessa;
}
