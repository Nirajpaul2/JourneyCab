export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const unavailable = "The booking server is unavailable. Please try again.";
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(unavailable);
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    // A static host can return HTML with HTTP 200 for an unknown /api route.
    // Never treat that as a successful booking response.
    throw new Error(unavailable);
  }
  if (!result || typeof result !== "object") throw new Error(unavailable);
  if (!response.ok) {
    const error = (result as { error?: unknown }).error;
    throw new Error(typeof error === "string" ? error : "The request could not be completed.");
  }
  return result as T;
}
export function newTrackingToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}
export const trackingUrl = (reference: string, token: string) =>
  `${window.location.origin}/track#ref=${encodeURIComponent(reference)}&key=${encodeURIComponent(token)}`;
