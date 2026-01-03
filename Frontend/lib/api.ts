export type ApiResponse<T> = {
  code: number;
  message: string;
  data?: T;
};

export function apiBase() {
  return process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8080";
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("edumgr_token");
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("edumgr_token", token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("edumgr_token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.get("Content-Type")) headers.set("Content-Type", "application/json");

  const res = await fetch(`${apiBase()}${path}`, { ...init, headers });
  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    json = { code: res.ok ? 0 : res.status, message: "invalid response" };
  }
  if (res.status === 401) clearToken();
  return json;
}

