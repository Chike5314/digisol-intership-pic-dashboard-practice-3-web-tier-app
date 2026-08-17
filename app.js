import { ApiService } from './api.js';

const DEFAULT_PLACEHOLDER = 'https://placehold.co/300x220?text=No+Image';
const ERROR_PLACEHOLDER = 'https://placehold.co/300x220?text=Image+Load+Error';

document.addEventListener('DOMContentLoaded', () => {
  fetchPhotos();
  setupEventListeners();
});

function setupEventListeners() {
  const form = document.getElementById('photo-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

export async function fetchPhotos() {
  const grid = document.getElementById('photo-grid');
  showSkeletonLoader();

  try {
    const data = await ApiService.listPhotos();
    renderGrid(data);
  } catch (error) {
    console.error('Fetch error:', error);
    if (grid) {
      grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">Failed to fetch photos from API Gateway.</p>`;
    }
    showToast('Failed to load photo records', 'error');
  }
}

function renderGrid(data) {
  const grid = document.getElementById('photo-grid');
  const countBadge = document.getElementById('photo-count');
  if (!grid) return;

  grid.innerHTML = '';

  let photos = data;
  if (typeof data === 'string') {
    try { photos = JSON.parse(data); } catch (e) {}
  } else if (data && typeof data === 'object' && !Array.isArray(data)) {
    photos = data.items || data.photos || data.records || (data.body ? JSON.parse(data.body) : []);
  }

  if (!Array.isArray(photos)) {
    console.error('Expected an array but received:', data);
    grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">Invalid data format received from server.</p>`;
    if (countBadge) countBadge.textContent = '0 items';
    return;
  }

  if (countBadge) countBadge.textContent = `${photos.length} items`;

  if (photos.length === 0) {
    grid.innerHTML = `<p class="subtitle" style="grid-column: 1/-1; text-align: center;">No photo records found in the database.</p>`;
    return;
  }

  photos.forEach(photo => {
    const photoId = photo.id || photo.ID || '';
    const photoName = photo.name || photo.title || 'Untitled Picture';
    const imageUrl = photo.img_url || photo.url || DEFAULT_PLACEHOLDER;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-img-wrapper">
        <img 
          src="${imageUrl}" 
          alt="${photoName}" 
          onerror="this.onerror=null; this.src='${ERROR_PLACEHOLDER}';" 
        />
      </div>
      <div class="card-body">
        <h3 class="photo-title">${photoName}</h3>
        <div class="card-actions">
          <button class="btn btn-edit" data-id="${photoId}" data-name="${photoName}" data-url="${imageUrl}">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-delete" data-id="${photoId}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => {
      openModal(photoId, photoName, imageUrl);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      deletePhotoRecord(photoId);
    });

    grid.appendChild(card);
  });
}

export async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-photo-id').value;
  const name = document.getElementById('form-name').value;
  const img_url = document.getElementById('form-url').value;

  const isEdit = Boolean(id);

  try {
    if (isEdit) {
      await ApiService.updatePhoto({ id, name, img_url });
      showToast('Photo record updated', 'success');
    } else {
      await ApiService.createPhoto({ name, img_url });
      showToast('Photo record created', 'success');
    }

    closeModal();
    fetchPhotos();
  } catch (err) {
    console.error('Save error:', err);
    showToast(`Error saving record: ${err.message}`, 'error');
  }
}

export async function deletePhotoRecord(id) {
  if (!confirm('Are you sure you want to delete this photo record?')) return;

  try {
    await ApiService.deletePhoto(id);
    showToast('Photo record deleted', 'success');
    fetchPhotos();
  } catch (err) {
    console.error('Delete error:', err);
    showToast(`Error deleting record: ${err.message}`, 'error');
  }
}

export function openModal(id = '', name = '', url = '') {
  const modal = document.getElementById('photo-modal');
  const title = document.getElementById('modal-title');
  
  document.getElementById('form-photo-id').value = id;
  document.getElementById('form-name').value = name;
  document.getElementById('form-url').value = url;

  if (title) {
    title.textContent = id ? 'Edit Photo Record' : 'Add Photo Record';
  }

  if (modal) modal.classList.add('active');
}

export function closeModal() {
  const modal = document.getElementById('photo-modal');
  const form = document.getElementById('photo-form');
  if (modal) modal.classList.remove('active');
  if (form) form.reset();
}

function showSkeletonLoader() {
  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
    <div class="card skeleton"></div>
  `;
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.style.backgroundColor = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#0f172a';
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

window.fetchPhotos = fetchPhotos;
window.openModal = openModal;
window.closeModal = closeModal;
window.handleFormSubmit = handleFormSubmit;