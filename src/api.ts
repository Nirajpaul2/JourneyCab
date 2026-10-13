export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const result = await response
    .json()
    .catch(() => ({
      error: "The booking server is unavailable. Please try again.",
    }));
  if (!response.ok)
    throw new Error(result.error ?? "The request could not be completed.");
  return result as T;
}
export function newTrackingToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export const trackingUrl = (reference: string, token: string) =>
  `${window.location.origin}/track#ref=${encodeURIComponent(reference)}&key=${encodeURIComponent(token)}`;
