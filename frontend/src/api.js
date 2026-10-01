const API_ROOT = "/api/v1";
let csrfToken = null;

async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${API_ROOT}/auth/csrf/`, { credentials: "same-origin" });
  const payload = await response.json();
  csrfToken = payload.csrfToken;
  return csrfToken;
}

function errorMessage(payload, status) {
  if (payload?.detail) return payload.detail;
  if (payload?.errors) {
    const first = Object.values(payload.errors).flat()[0];
    if (first?.message) return first.message;
  }
  return `Request failed (${status}).`;
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  let body = options.body;

  if (body !== undefined && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }
  if (method !== "GET" && method !== "HEAD") {
    headers.set("X-CSRFToken", await getCsrfToken());
  }

  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    method,
    headers,
    body,
    credentials: "same-origin",
  });
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  if (!response.ok) throw new Error(errorMessage(payload, response.status));
  return payload;
}let csrfToken = "";

export async function primeCsrf() {
  const response = await fetch("/api/v1/auth/csrf/", { credentials: "include" });
  const payload = await response.json();
  csrfToken = payload.csrfToken;
  return csrfToken;
}

function errorMessage(payload, status) {
  if (payload?.detail) return payload.detail;
  if (payload?.errors) {
    return Object.entries(payload.errors)
      .map(([field, errors]) => `${field}: ${errors.map((error) => error.message).join(" ")}`)
      .join(" ");
  }
  return `Request failed (${status}).`;
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = { Accept: "application/json", ...options.headers };
  let body = options.body;

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!csrfToken) await primeCsrf();
    headers["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(path, {
    ...options,
    method,
    body,
    headers,
    credentials: "include",
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(errorMessage(payload, response.status));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}
