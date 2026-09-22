/**
 * SmartSense IoT Backend - Standardized API Response Utilities
 * Ensures consistent response envelopes across all endpoints.
 */

/**
 * Send a standardized success response.
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} [statusCode=200]
 * @param {object} [extra={}]
 */
export const sendSuccess = (res, data, statusCode = 200, extra = {}) => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...extra,
  });
};

/**
 * Send a standardized error response.
 * @param {import('express').Response} res
 * @param {string} code - Machine-readable error code (e.g. BAD_REQUEST, NOT_FOUND)
 * @param {string} message - Human-readable message
 * @param {number} [statusCode=500]
 * @param {any} [details=null] - Optional validation or error details
 */
export const sendError = (res, code, message, statusCode = 500, details = null) => {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== null && details !== undefined) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};
