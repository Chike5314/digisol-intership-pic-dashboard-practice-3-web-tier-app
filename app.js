// Retrieve API details from config.js
const API_BASE_URL = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : '';
const API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.API_KEY : '';

const headers = {
  'Content-Type': 'application/json',
  ...(API_KEY && { 'x-api-key': API_KEY })
};

let currentPhotos = [];

document.addEventListener('DOMContentLoaded', fetchPhotos);

// 1. GET: Fetch Photo Records
async function fetchPhotos() {
  const grid = document.getElementById('photo-grid');
  showSkeletonLoader();

  try {
    const response = await fetch(`${API_BASE_URL}/pictures`, {
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

// 2. Render Cards
function renderGrid(photos) {
  const grid = document.getElementById('photo-grid');
  const countBadge = document.getElementById('photo-count');
  grid.innerHTML = '';

  countBadge.textContent = `${photos.length} photos`;

  if (!photos || photos.length === 0) {
    grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">No photo records found in the database.</p>`;
    return;
  }

  photos.forEach(photo => {
    // Dynamically matches 'img_url', 'url', or 'src'
    const imageUrl = photo.img_url || photo.url || photo.src || 'https://via.placeholder.com/300x220?text=No+Image';

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

// 3. DELETE Photo Record
async function deletePhoto(photoId) {
  if (!confirm(`Confirm deletion of photo ID: ${photoId}?`)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/pictures/${photoId}`, {
      method: 'DELETE',
      headers: headers
    });

    if (!response.ok) throw new Error(`Delete failed with status: ${response.status}`);

    showToast('Photo record deleted', 'success');
    fetchPhotos();
  } catch (error) {
    console.error('Delete error:', error);
    showToast(`Error deleting item: ${error.message}`, 'error');
  }
}

// 4. Modal Handling (Add vs Edit)
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

// 5. Submit Handler (POST or PUT)
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-photo-id').value;
  const payload = {
    name: document.getElementById('form-name').value,
    img_url: document.getElementById('form-url').value
  };

  const isEdit = Boolean(id);
  if (isEdit) payload.id = id;

  const endpoint = isEdit ? `${API_BASE_URL}/pictures/${id}` : `${API_BASE_URL}/pictures`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const response = await fetch(endpoint, {
      method: method,
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Save request failed`);

    showToast(isEdit ? 'Photo record updated' : 'Photo record created', 'success');
    closeModal();
    fetchPhotos();
  } catch (err) {
    console.error('Save error:', err);
    showToast(`Error saving record: ${err.message}`, 'error');
  }
}

// Helper Utilities
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