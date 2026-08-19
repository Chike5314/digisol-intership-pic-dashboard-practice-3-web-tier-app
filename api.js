// api.js - Centralized API Service Module

// Safely pull config values from window or environment
const getBaseUrl = () => (typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '');
const getApiKey = () => (typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : '');

/**
 * Helper to build standard API Gateway headers
 */
function getHeaders() {
  const apiKey = getApiKey();
  return {
    'Content-Type': 'application/json',
    ...(apiKey && { 'x-api-key': apiKey })
  };
}

/**
 * Generic request wrapper to handle API Gateway calls
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
      throw new Error(
        `API Request failed (${response.status}): ${response.statusText}`
      );
    }

    const text = await response.text();

    if (!text) {
      return {};
    }

    let data = JSON.parse(text);

    // Handle Lambda/API Gateway proxy double JSON parsing
    if (
      data &&
      typeof data === 'object' &&
      data.body &&
      typeof data.body === 'string'
    ) {
      try {
        data = JSON.parse(data.body);
      } catch (e) {
        // body wasn't stringified JSON, leave as-is
      }
    }

    return data;
  } catch (error) {
    console.error(
      `[API Error] ${options.method || 'GET'} ${endpoint}:`,
      error
    );
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
    return await request(`/read-digisol-intership?id=${encodeURIComponent(id)}`, {
      method: 'GET'
    });
  },

  // 3. POST /create-digisol-intership
  async createPhoto(payload) {
    const normalizedPayload = {
      ...payload,
      img_url: payload.img_url || payload.url || '',
      id: payload.id || crypto.randomUUID()
    };

    return await request('/create-digisol-intership', {
      method: 'POST',
      body: JSON.stringify(normalizedPayload)
    });
  },

  // 4. PUT /UpdateDigisolGroup
  async updatePhoto(payload) {
    const normalizedPayload = {
      ...payload,
      img_url: payload.img_url || payload.url || ''
    };

    return await request('/UpdateDigisolGroup', {
      method: 'PUT',
      body: JSON.stringify(normalizedPayload)
    });
  },

  // 5. DELETE /delete-digisol-intership
  async deletePhoto(id) {
    return await request('/delete-digisol-intership', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },

  // 6. POST /get-upload-url (Fetch Pre-signed URL from API Gateway)
  async getUploadUrl(fileName, fileType) {
    return await request('/get-upload-url', {
      method: 'POST',
      body: JSON.stringify({
        fileName: fileName || 'upload.jpg',
        fileType: fileType || 'image/jpeg'
      })
    });
  },

  // 7. DIRECT S3 UPLOAD (Uploads raw binary file directly to S3)
  async uploadFileToS3(uploadUrl, file) {
    const fileType = file.type || 'image/jpeg';

    // MUST use raw fetch() without API Gateway headers (like x-api-key)
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': fileType // MUST match what was signed in Lambda
      },
      body: file // Send raw File/Blob object directly
    });

    if (!response.ok) {
      throw new Error(`S3 Direct Upload failed with status ${response.status}`);
    }

    return true;
  }
};