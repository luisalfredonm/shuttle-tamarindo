import { Transform } from 'class-transformer';

/** kebab-case en minúsculas: lo único que la web sabe buscar en la URL */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Convierte lo que se escriba en el panel a un slug válido.
 *
 * "Liberia Airport - Tamarindo " → "liberia-airport-tamarindo". Sin esto, un
 * slug con espacios o mayúsculas se guarda tal cual y la web no lo encuentra
 * al pedir /routes/:slug (el espacio final se pierde en la URL).
 */
export function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes: "San José" → "San Jose"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Aplica toSlug al campo antes de validarlo */
export const NormalizeSlug = () =>
  Transform(({ value }) => (typeof value === 'string' ? toSlug(value) : value));

/** Recorta espacios sobrantes (origen y destino se muestran tal cual en la web) */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
