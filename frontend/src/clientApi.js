const ROOT = "/api/v1";
let csrfToken = null;

async function token() {
  if (!csrfToken) {
    const response = await fetch(`${ROOT}/auth/csrf/`, { credentials: "same-origin" });
    csrfToken = (await response.json()).csrfToken;
  }
  return csrfToken;
}

export async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  let body = options.body;
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  if (!new Set(["GET", "HEAD", "OPTIONS"]).has(method)) headers.set("X-CSRFToken", await token());
  const response = await fetch(`${ROOT}${path}`, { ...options, method, headers, body, credentials: "same-origin" });
  if (response.status === 204) return null;
  const data = (response.headers.get("content-type") || "").includes("json") ? await response.json() : {};
  if (!response.ok) {
    const message = data.detail || Object.values(data.errors || {}).flat()[0]?.message || `Request failed (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

export async function refreshCsrfToken() {
  csrfToken = null;
  return token();
}