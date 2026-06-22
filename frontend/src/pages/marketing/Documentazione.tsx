import { useParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  documentazione,
  categorieDoc,
  trovaArticolo,
} from "@/lib/docs";

export function Documentazione() {
  const { slug } = useParams();
  const articolo = trovaArticolo(slug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Indice */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documentazione
          </p>
          <nav className="mt-3 space-y-5">
            {categorieDoc.map((categoria) => (
              <div key={categoria}>
                <p className="px-2 text-xs font-medium text-foreground/60">
                  {categoria}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {documentazione
                    .filter((d) => d.categoria === categoria)
                    .map((d) => (
                      <li key={d.slug}>
                        <Link
                          to={`/documentazione/${d.slug}`}
                          className={cn(
                            "block rounded-md px-2 py-1.5 text-sm transition-colors",
                            d.slug === articolo.slug
                              ? "bg-primary/10 font-medium text-primary"
                              : "text-muted-foreground hover:bg-surface hover:text-foreground"
                          )}
                        >
                          {d.titolo}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Articolo */}
        <article className="min-w-0 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-secondary">
            {articolo.categoria}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {articolo.titolo}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            {articolo.descrizione}
          </p>

          <div className="mt-8 space-y-8">
            {articolo.sezioni.map((sez, i) => (
              <section key={i}>
                {sez.titolo && (
                  <h2 className="mb-3 text-xl font-semibold tracking-tight">
                    {sez.titolo}
                  </h2>
                )}
                {sez.paragrafi?.map((p, j) => (
                  <p key={j} className="mb-3 leading-relaxed text-foreground/90">
                    {p}
                  </p>
                ))}
                {sez.passi && (
                  <ol className="space-y-3">
                    {sez.passi.map((passo, j) => (
                      <li key={j} className="flex gap-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {j + 1}
                        </span>
                        <span className="pt-0.5 leading-relaxed text-foreground/90">
                          {passo}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
