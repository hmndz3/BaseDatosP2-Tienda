// -----------------------------------------------------------------
// Cliente HTTP centralizado
// Todas las peticiones incluyen credentials para cookies de sesion
// -----------------------------------------------------------------

const BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${BASE}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Respuesta sin JSON, ignoramos
  }

  if (!response.ok) {
    const error = new Error(data?.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get:    (url)        => request(url),
  post:   (url, body)  => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body)  => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body)  => request(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)        => request(url, { method: 'DELETE' }),
};