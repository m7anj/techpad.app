// API configuration - reads from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// Remove trailing slash if present
const baseUrl = API_BASE_URL.replace(/\/$/, '');

// HTTP API base
export const apiUrl = (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

// WebSocket base (converts http(s) to ws(s))
export const wsUrl = (path: string) => {
  const wsBase = baseUrl.replace(/^http/, 'ws');
  return `${wsBase}${path.startsWith('/') ? path : `/${path}`}`;
};
