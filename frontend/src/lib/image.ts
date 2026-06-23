/**
 * Ridimensiona un'immagine a un quadrato di `size` px (ritaglio centrale) e
 * restituisce un data URL JPEG compatto, adatto a essere salvato come avatar.
 */
export function ridimensionaImmagine(
  file: File,
  size = 160,
  qualita = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      return reject(new Error("Il file non è un'immagine."));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lettura del file fallita."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Immagine non valida."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas non disponibile."));
        // Ritaglio centrale quadrato.
        const lato = Math.min(img.width, img.height);
        const sx = (img.width - lato) / 2;
        const sy = (img.height - lato) / 2;
        ctx.drawImage(img, sx, sy, lato, lato, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", qualita));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
