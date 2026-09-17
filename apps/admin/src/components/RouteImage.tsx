"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { resizeImage } from "@/lib/resize-image";

type Props = {
  routeId: string;
  imageUrl: string | null;
  label: string;
  /** Recibe la ruta actualizada que devuelve el API */
  onChange: (route: { id: string; imageUrl: string | null }) => void;
};

/**
 * Foto de la ruta dentro de su tarjeta: subir, cambiar o quitar.
 * Sin foto propia la web usa la de la buseta, y así se avisa acá.
 */
export default function RouteImage({ routeId, imageUrl, label, onChange }: Props) {
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
    <div style={{ marginBottom: "1rem" }}>
      <div style={frame}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura del panel, no necesita optimización
          <img src={imageUrl} alt={`Foto de la ruta ${label}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={empty}>
            <ImagePlus size={22} />
            <span>Sin foto propia · se usa la foto general</span>
          </div>
        )}
        {busy && (
          <div style={veil}>{busy === "upload" ? "Subiendo..." : "Quitando..."}</div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
        <button type="button" disabled={!!busy} onClick={() => inputRef.current?.click()} style={action}>
          <ImagePlus size={14} /> {imageUrl ? "Cambiar foto" : "Subir foto"}
        </button>
        {imageUrl && (
          <button type="button" disabled={!!busy} onClick={handleRemove} style={{ ...action, color: "#c0392b" }}>
            <Trash2 size={14} /> Quitar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          hidden
        />
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: "0.75rem", marginTop: "0.4rem" }}>{error}</p>}
    </div>
  );
}

const frame: React.CSSProperties = {
  position: "relative", aspectRatio: "16 / 9", borderRadius: "10px",
  overflow: "hidden", background: "var(--border-soft)",
};
const empty: React.CSSProperties = {
  height: "100%", display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: "6px", color: "var(--brand-gray)", fontSize: "0.75rem",
  border: "1px dashed var(--border-strong)", borderRadius: "10px", boxSizing: "border-box",
};
const veil: React.CSSProperties = {
  position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 500,
};
const action: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "5px 10px", borderRadius: "8px", border: "1px solid var(--border-strong)",
  background: "var(--surface)", fontSize: "0.75rem", cursor: "pointer",
};
