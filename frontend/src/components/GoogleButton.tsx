import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@/hooks/useAuth";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function GoogleButton() {
  const ref = useRef<HTMLDivElement>(null);
  const google = useGoogleLogin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) =>
          google.mutate(resp.credential, { onSuccess: () => navigate("/app") }),
      });
      if (ref.current) {
        window.google?.accounts.id.renderButton(ref.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          locale: "it",
          width: 320,
        });
      }
    };
    document.body.appendChild(script);
    return () => script.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Configura VITE_GOOGLE_CLIENT_ID per abilitare l'accesso con Google"
        className="flex h-11 w-full items-center justify-center rounded-md border border-border bg-card text-sm font-medium text-muted-foreground"
      >
        Continua con Google
      </button>
    );
  }

  return <div ref={ref} className="flex justify-center" />;
}
