const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: async (path, formData, method = 'POST') => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Upload failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    return res.json();
  },
};

export function dashboardPathFor(role) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'instructor') return '/dashboard/provider';
  return '/dashboard';
}

export function assetUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${SERVER_ORIGIN}${url}`;
}

export function googleLoginUrl() {
  return `${BASE_URL}/auth/google`;
}
