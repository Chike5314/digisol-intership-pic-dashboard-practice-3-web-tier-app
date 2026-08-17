// Retrieve configuration parameters from config.js
const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '';
const API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : '';

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'x-api-key': API_KEY })
};

let currentPhotos = [];

document.addEventListener('DOMContentLoaded', fetchPhotos);

// 1. LIST ALL ITEMS (GET /list-digisol-intership)
async function fetchPhotos() {
  const grid = document.getElementById('photo-grid');
  showSkeletonLoader();

  try {
    const response = await fetch(`${API_BASE_URL}/list-digisol-intership`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    currentPhotos = await response.json();
    renderGrid(currentPhotos);
    showToast('Gallery synchronized', 'success');
  } catch (error) {
    console.error('Fetch error:', error);
    grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">Failed to fetch photos from API Gateway.</p>`;
    showToast('Failed to load photos', 'error');
  }
}

// 2. RENDER CARDS IN GRID
function renderGrid(data) {
  const grid = document.getElementById('photo-grid');
  const countBadge = document.getElementById('photo-count');
  grid.innerHTML = '';

  // 1. Extract array if wrapped in an object or stringified body
  let photos = data;

  if (typeof data === 'string') {
    try { photos = JSON.parse(data); } catch (e) {}
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    // If Lambda returns { items: [...] }, { body: [...] }, or { photos: [...] }
    photos = data.items || data.photos || data.records || (data.body ? JSON.parse(data.body) : []);
  }

  // 2. Fallback check if it's still not an array
  if (!Array.isArray(photos)) {
    console.error('Expected an array but received:', data);
    grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">Invalid data format received from server.</p>`;
    countBadge.textContent = `0 items`;
    return;
  }

  countBadge.textContent = `${photos.length} items`;

  if (photos.length === 0) {
    grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">No photo records found in the database.</p>`;
    return;
  }

  // 3. Safe to iterate now
  photos.forEach(photo => {
    const imageUrl = photo.img_url || photo.url || 'https://via.placeholder.com/300x220?text=No+Image';

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img src="${imageUrl}" alt="${photo.name}" onerror="this.src='https://via.placeholder.com/300x220?text=Image+Load+Error'" />
      </div>
      <div class="card-body">
        <h3 class="photo-title">${photo.name || 'Untitled Picture'}</h3>
        <div class="card-actions">
          <button class="btn btn-edit" onclick="openModal('${photo.id}')">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-delete" onclick="deletePhoto('${photo.id}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 3. DELETE ITEM (DELETE /delete-digisol-intership)
async function deletePhoto(photoId) {
  if (!confirm(`Confirm deletion of photo ID: ${photoId}?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/delete-digisol-intership`, {
      method: 'DELETE',
      headers: headers,
      body: JSON.stringify({ id: photoId })
    });

    if (!response.ok) throw new Error(`Delete failed with status: ${response.status}`);

    showToast('Photo record deleted', 'success');
    fetchPhotos();
  } catch (error) {
    console.error('Delete error:', error);
    showToast(`Error deleting item: ${error.message}`, 'error');
  }
}

// 4. MODAL STATE HANDLING
function openModal(photoId = null) {
  const modal = document.getElementById('photo-modal');
  const title = document.getElementById('modal-title');
  const idInput = document.getElementById('form-photo-id');
  const nameInput = document.getElementById('form-name');
  const urlInput = document.getElementById('form-url');

  if (photoId) {
    const photo = currentPhotos.find(p => p.id === photoId);
    title.textContent = 'Edit Photo Record';
    idInput.value = photo.id;
    nameInput.value = photo.name || '';
    urlInput.value = photo.img_url || photo.url || '';
  } else {
    title.textContent = 'Add New Photo';
    idInput.value = '';
    document.getElementById('photo-form').reset();
  }

  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('photo-modal').classList.remove('active');
}

// 5. SUBMIT HANDLER (POST /create-digisol-intership vs PATCH /UpdateDigisolGroup)
// Function in app.js updated to use PUT
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-photo-id').value;
  const name = document.getElementById('form-name').value;
  const img_url = document.getElementById('form-url').value;

  const isEdit = Boolean(id);

  const endpoint = isEdit
    ? `${API_BASE_URL}/UpdateDigisolGroup`
    : `${API_BASE_URL}/create-digisol-intership`;

  // Updated method from PATCH to PUT
  const method = isEdit ? 'PUT' : 'POST';

  const payload = isEdit
    ? { id, name, img_url }
    : { name, img_url };

  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Save request failed with status ${response.status}`);

    showToast(isEdit ? 'Photo record updated' : 'Photo record created', 'success');
    closeModal();
    fetchPhotos();
  } catch (err) {
    console.error('Save error:', err);
    showToast(`Error saving record: ${err.message}`, 'error');
  }
}

// UI Utilities
function showToast(message, status) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.background = status === 'error' ? '#ef4444' : '#0f172a';
  setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

function showSkeletonLoader() {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = `
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
  `;
}