/**
 * Todas las llamadas del panel pasan por /api/proxy, que corre en el servidor
 * de Next y adjunta el JWT desde la cookie httpOnly. El navegador nunca ve el
 * token, y los paths siguen escribiéndose igual que antes ("/bookings/...").
 */
export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`/api/proxy${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    // Sesión vencida o revocada: volvemos al login
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "API error");
  }

  return res.json();
}
