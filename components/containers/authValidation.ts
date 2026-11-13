const MAX_PASSWORD_BYTES = 72;
const utf8Encoder = new TextEncoder();

export type AuthFieldErrorMap<TField extends string> = Partial<Record<TField, string>>;

export function getUtf8ByteLength(value: string): number {
  return utf8Encoder.encode(value).length;
}

export function validateUsername(value: string): string | undefined {
  if (value.trim().length === 0) {
    return 'Introduce tu nombre de usuario.';
  }

  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (value.length === 0) {
    return 'Introduce tu contraseña.';
  }

  if (getUtf8ByteLength(value) > MAX_PASSWORD_BYTES) {
    return `La contraseña no puede superar los ${MAX_PASSWORD_BYTES} bytes.`;
  }

  return undefined;
}

export function validateCourseId(value: string): string | undefined {
  if (value.trim().length === 0) {
    return 'Selecciona un curso del catálogo.';
  }

  return undefined;
}

export function buildValidationSummary(messages: Array<string | undefined>): string {
  const validMessages = messages.filter((message): message is string => Boolean(message));
  if (validMessages.length === 0) {
    return '';
  }

  return validMessages.length === 1
    ? validMessages[0]
    : `Revisa los ${validMessages.length} campos marcados antes de continuar.`;
}

export async function readApiErrorMessage(
  response: Response,
): Promise<{ error?: string; code?: string }> {
  try {
    const data: unknown = await response.json();
    if (typeof data === 'object' && data !== null) {
      const record = data as Record<string, unknown>;
      return {
        error: typeof record.error === 'string' ? record.error : undefined,
        code: typeof record.code === 'string' ? record.code : undefined,
      };
    }
  } catch {
    // Respuesta no JSON del servidor
  }

  return {};
}

