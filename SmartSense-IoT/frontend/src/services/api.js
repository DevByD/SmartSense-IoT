/**
 * SmartSense IoT Centralized HTTP API Client
 * Provides robust GET, PATCH, and POST methods with standardized error handling,
 * network failure detection, and automatic response envelope unwrapping.
 */

import { API_BASE_URL } from '../config/api.config.js';

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
 * Perform an HTTP request to the SmartSense backend API.
 * @param {string} endpoint - Relative path (e.g. '/sensors/latest')
 * @param {object} [options={}] - Fetch options
 * @returns {Promise<any>}
 */
export async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    // Network failure (e.g. backend server offline, DNS, CORS blocking)
    throw new ApiError(
      'Unable to connect to SmartSense API.',
      'NETWORK_ERROR',
      0,
      netErr.message
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseErr) {
      throw new ApiError(
        'Received invalid response format from API.',
        'INVALID_JSON',
        response.status
      );
    }
  } else {
    // Non-JSON response
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

  if (!response.ok || (data && data.success === false)) {
    const errorObj = data?.error || {};
    const message = errorObj.message || `Request failed with status ${response.status}`;
    const code = errorObj.code || `HTTP_${response.status}`;
    throw new ApiError(message, code, response.status, errorObj.details || null);
  }

  // SmartSense backend returns `{ success: true, data: ... }`
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
