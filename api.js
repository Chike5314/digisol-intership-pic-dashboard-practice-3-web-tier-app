// api.js - Centralized API Service Module

// Safely pull config values from window or environment
const getBaseUrl = () => typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '';
const getApiKey = () => typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : '';

/**
 * Helper to build standard headers
 */
function getHeaders() {
  const apiKey = getApiKey();
  return {
    'Content-Type': 'application/json',
    ...(apiKey && { 'x-api-key': apiKey })
  };
}

/**
 * Generic request wrapper to handle HTTP errors and response parsing
 */
async function request(endpoint, options = {}) {
  const url = `${getBaseUrl()}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Request failed (${response.status}): ${response.statusText}`);
    }

    // Handle empty responses (like 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
    throw error;
  }
}

/**
 * API Service Object
 */
export const ApiService = {
  // 1. GET /list-digisol-intership
  async listPhotos() {
    return await request('/list-digisol-intership', { method: 'GET' });
  },

  // 2. GET /read-digisol-intership?id=xxx
  async readPhoto(id) {
    return await request(`/read-digisol-intership?id=${encodeURIComponent(id)}`, { method: 'GET' });
  },

  // 3. POST /create-digisol-intership
  async createPhoto(payload) {
    return await request('/create-digisol-intership', {
      method: 'POST',
      body: JSON.stringify(payload) // expects { name, img_url }
    });
  },

  // 4. PUT /UpdateDigisolGroup
  async updatePhoto(payload) {
    return await request('/UpdateDigisolGroup', {
      method: 'PUT',
      body: JSON.stringify(payload) // expects { id, name, img_url }
    });
  },

  // 5. DELETE /delete-digisol-intership
  async deletePhoto(id) {
    return await request('/delete-digisol-intership', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  }
};