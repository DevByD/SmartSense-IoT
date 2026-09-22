/**
 * SmartSense IoT Mobile - Centralized HTTP API Client
 * Provides robust GET, PATCH, and POST methods with error classification,
 * request timeouts, network failure detection, and automatic envelope unwrapping.
 */

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config/api.config.js';

export class ApiError extends Error {
  constructor(message, code = 'API_ERROR', status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Execute an HTTP request against the SmartSense REST API.
 * @param {string} endpoint - Relative path (e.g. '/sensors/latest/smartsense-pi-01')
 * @param {object} [options={}] - Standard fetch options
 * @returns {Promise<any>}
 */
export async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const baseUrl = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
    ? process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/+$/, '')
    : API_BASE_URL);
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  // Timeout control via AbortController
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller ? controller.signal : undefined,
    });
  } catch (netErr) {
    if (netErr.name === 'AbortError') {
      throw new ApiError(
        'Request to SmartSense API timed out. Please verify connectivity.',
        'TIMEOUT_ERROR',
        408
      );
    }
    // Network failure (offline, DNS, connection refused)
    throw new ApiError(
      'Unable to connect to SmartSense API.',
      'NETWORK_ERROR',
      0,
      netErr.message
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Parse response
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new ApiError(
        'Received invalid JSON response from SmartSense API.',
        'INVALID_JSON',
        response.status
      );
    }
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(
        text || `HTTP error ${response.status}`,
        'HTTP_ERROR',
        response.status
      );
    }
    return text;
  }

  // Check backend envelope: { success: false, error: { code, message } }
  if (!response.ok || (data && data.success === false)) {
    const errorObj = data?.error || {};
    const message = errorObj.message || `Request failed with status ${response.status}`;
    const code = errorObj.code || `HTTP_${response.status}`;
    throw new ApiError(message, code, response.status, errorObj.details || null);
  }

  // Return unpacked data payload if present
  return data?.data !== undefined ? data.data : data;
}

/**
 * Perform a GET request.
 * @param {string} endpoint 
 * @param {object} [params={}] 
 * @param {object} [options={}] 
 */
export async function get(endpoint, params = {}, options = {}) {
  let query = '';
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const qStr = searchParams.toString();
    if (qStr) {
      query = (endpoint.includes('?') ? '&' : '?') + qStr;
    }
  }

  return request(`${endpoint}${query}`, {
    method: 'GET',
    ...options,
  });
}

/**
 * Perform a PATCH request.
 * @param {string} endpoint 
 * @param {any} body 
 * @param {object} [options={}] 
 */
export async function patch(endpoint, body, options = {}) {
  return request(endpoint, {
    method: 'PATCH',
    body,
    ...options,
  });
}

/**
 * Perform a POST request.
 * @param {string} endpoint 
 * @param {any} body 
 * @param {object} [options={}] 
 */
export async function post(endpoint, body, options = {}) {
  return request(endpoint, {
    method: 'POST',
    body,
    ...options,
  });
}

export default {
  request,
  get,
  patch,
  post,
};
