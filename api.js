// api.js - Centralized API Service Module

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
    if (!text) return {};

    let data = JSON.parse(text);

    // Handle Lambda/API Gateway proxy double JSON stringification
    if (
      data &&
      typeof data === 'object' &&
      data.body &&
      typeof data.body === 'string'
    ) {
      try {
        data = JSON.parse(data.body);
      } catch (e) {
        // body wasn't stringified JSON, keep as object
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
 * Utility to generate unique ID with fallback
 */
function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
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
      id: payload.id || generateUniqueId()
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
    if (!fileName) {
      throw new Error('fileName is required for generating an upload URL.');
    }

    const payload = {
      fileName,
      fileType: fileType || 'image/jpeg'
    };

    console.log('[Upload Debug] Requesting presigned URL with payload:', payload);

    return await request('/get-upload-url', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // 7. DIRECT S3 UPLOAD (Uploads raw binary file directly to S3 bucket)
  async uploadFileToS3(uploadUrl, file) {
    const urlObj = new URL(uploadUrl);
    const signedContentType = urlObj.searchParams.get('content-type');
    const finalContentType = signedContentType || file.type || 'image/jpeg';

    // Directly execute raw fetch without passing API Gateway custom headers (e.g., x-api-key)
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': finalContentType
      },
      body: file
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[S3 Upload Error Response]:', errorText);
      throw new Error(`S3 Direct Upload failed with status ${response.status}`);
    }

    return true;
  }
};