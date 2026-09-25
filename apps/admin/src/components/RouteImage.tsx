"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { resizeImage } from "@/lib/resize-image";
import s from "./routes/routes.module.css";

type Props = {
  routeId: string;
  imageUrl: string | null;
  label: string;
  /** Recibe la ruta actualizada que devuelve el API */
  onChange: (route: { id: string; imageUrl: string | null }) => void;
  /** Lo que va arriba de la foto, como el estado de la ruta */
  children?: React.ReactNode;
};

/**
 * Foto de la ruta como cabecera de su tarjeta: subir, cambiar o quitar.
 * Sin foto propia la web usa la foto general, y así se avisa acá.
 */
export default function RouteImage({ routeId, imageUrl, label, onChange, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Se limpia para poder volver a elegir el mismo archivo después de un error
    e.target.value = "";
    if (!file) return;

    setBusy("upload");
    setError("");
    try {
      const image = await resizeImage(file);
      const body = new FormData();
      body.append("image", image, "route.jpg");
      onChange(await apiFetch(`/routes/${routeId}/image`, { method: "POST", body }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    if (!confirm("¿Quitar la foto? La ruta volverá a mostrar la foto general.")) return;
    setBusy("remove");
    setError("");
    try {
      onChange(await apiFetch(`/routes/${routeId}/image`, { method: "DELETE" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo quitar la foto");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className={s.photoFrame}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura del panel, no necesita optimización
          <img src={imageUrl} alt={`Foto de la ruta ${label}`} />
        ) : (
          <div className={s.photoEmpty}>
            <ImagePlus size={22} />
            <strong>Sin foto propia</strong>
            <span>La web usa la foto general</span>
          </div>
        )}

        <div className={s.photoTop}>{children}</div>

        <div className={s.photoActions}>
          {imageUrl && (
            <button
              type="button"
              disabled={!!busy}
              onClick={handleRemove}
              className={s.photoBtn}
              aria-label={`Quitar la foto de ${label}`}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            type="button"
            disabled={!!busy}
            onClick={() => inputRef.current?.click()}
            className={s.photoBtn}
          >
            <ImagePlus size={13} /> {imageUrl ? "Cambiar foto" : "Subir foto"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            hidden
          />
        </div>

        {busy && (
          <div className={s.photoVeil}>{busy === "upload" ? "Subiendo..." : "Quitando..."}</div>
        )}
      </div>
      {error && <p className={s.photoError}>{error}</p>}
    </>
  );
}
