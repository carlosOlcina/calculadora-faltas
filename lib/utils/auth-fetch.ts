let inflightRefresh: Promise<boolean> | null = null;

/**
 * Intenta renovar la cookie `access_token` a partir del `refresh_token`.
 * Deduplica llamadas simultáneas compartiendo la promesa en curso.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (inflightRefresh) {
    return inflightRefresh;
  }

  inflightRefresh = (async () => {
    try {
      const response = await fetch('/api/users/refresh', {
        method: 'POST',
        credentials: 'same-origin',
      });

      return response.ok;
    } catch {
      return false;
    } finally {
      inflightRefresh = null;
    }
  })();

  return inflightRefresh;
}

export interface AuthFetchResult {
  response: Response;
  unauthorized: boolean;
}

/**
 * Ejecuta una petición protegida contra la API y, ante un `401`, intenta
 * refrescar el `access_token` una vez antes de marcar la sesión como no autorizada.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<AuthFetchResult> {
  const requestInit: RequestInit = {
    credentials: 'same-origin',
    ...init,
  };

  const response = await fetch(input, requestInit);
  if (response.status !== 401) {
    return { response, unauthorized: false };
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return { response, unauthorized: true };
  }

  const retryResponse = await fetch(input, requestInit);
  return {
    response: retryResponse,
    unauthorized: retryResponse.status === 401,
  };
}
