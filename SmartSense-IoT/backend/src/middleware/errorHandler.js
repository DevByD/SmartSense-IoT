import { sendError } from '../utils/response.js';

/**
 * Custom application error class for structured HTTP errors
 */
export class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isPublic = true;
  }
}

/**
 * Centralized Express error-handling middleware.
 * Formats errors uniformly and prevents internal stack trace leaks.
 */
export const errorHandler = (err, req, res, next) => {
  // Log request error for development debugging (without secrets)
  console.error(`[API ERROR] ${req.method} ${req.originalUrl} - ${err.name || 'Error'}: ${err.message}`);

  // If already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError instances
  if (err instanceof AppError || err.isPublic) {
    return sendError(
      res,
      err.code || 'BAD_REQUEST',
      err.message,
      err.statusCode || 400,
      err.details || null
    );
  }

  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(
      res,
      'INVALID_JSON',
      'Malformed JSON payload in request body',
      400
    );
  }

  // Handle Firebase connection or permission errors gracefully
  if (err.code && typeof err.code === 'string' && (err.code.startsWith('app/') || err.code.startsWith('database/'))) {
    return sendError(
      res,
      'DATABASE_ERROR',
      'Unable to communicate with cloud database. Please check configuration.',
      503
    );
  }

  // Default internal server error (hide internal details in production)
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode >= 500 ? 'An unexpected internal error occurred' : err.message;
  const code = err.code || (statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR');

  return sendError(res, code, message, statusCode);
};

export default errorHandler;
