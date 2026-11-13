import 'server-only';

export type ServerErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNIQUE_CONSTRAINT'
  | 'NOT_FOUND'
  | 'FOREIGN_KEY_CONSTRAINT'
  | 'DATABASE_ERROR'
  | 'UNAUTHORIZED';

/** Error base de la capa de servidor para ser capturado desde Server Actions. */
export class ServerError extends Error {
  readonly code: ServerErrorCode;
  readonly statusCode: number;

  constructor(
    message: string,
    code: ServerErrorCode,
    statusCode: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends ServerError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'VALIDATION_ERROR', 400, options);
  }
}

export class UniqueConstraintError extends ServerError {
  readonly target?: string[];

  constructor(message: string, target?: string[], options?: ErrorOptions) {
    super(message, 'UNIQUE_CONSTRAINT', 409, options);
    this.target = target;
  }
}

export class NotFoundError extends ServerError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'NOT_FOUND', 404, options);
  }
}

export class ForeignKeyConstraintError extends ServerError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, 'FOREIGN_KEY_CONSTRAINT', 409, options);
  }
}

export class UnauthorizedError extends ServerError {
  constructor(message = 'No autorizado.', options?: ErrorOptions) {
    super(message, 'UNAUTHORIZED', 401, options);
  }
}

