import { sendError } from '../utils/response.js';

/**
 * Middleware to handle unmatched routes (404 Not Found)
 */
export const notFoundHandler = (req, res, next) => {
  return sendError(
    res,
    'NOT_FOUND',
    `Resource not found: ${req.method} ${req.originalUrl}`,
    404
  );
};

export default notFoundHandler;
