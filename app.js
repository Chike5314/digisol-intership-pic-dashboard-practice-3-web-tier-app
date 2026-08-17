// app.js
import { ApiService } from './api.js';

// Fetch all photos
async function fetchPhotos() {
  try {
    const data = await ApiService.listPhotos();
    renderGrid(data);
  } catch (err) {
    showToast('Failed to load photos', 'error');
  }
}

// Delete a photo
async function deletePhoto(photoId) {
  if (!confirm(`Confirm deletion?`)) return;

  try {
    await ApiService.deletePhoto(photoId);
    showToast('Photo record deleted', 'success');
    fetchPhotos();
  } catch (err) {
    showToast(`Error deleting item: ${err.message}`, 'error');
  }
}

// Save or Update
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('form-photo-id').value;
  const name = document.getElementById('form-name').value;
  const img_url = document.getElementById('form-url').value;

  try {
    if (id) {
      await ApiService.updatePhoto({ id, name, img_url });
      showToast('Photo record updated', 'success');
    } else {
      await ApiService.createPhoto({ name, img_url });
      showToast('Photo record created', 'success');
    }
    closeModal();
    fetchPhotos();
  } catch (err) {
    showToast(`Error saving record: ${err.message}`, 'error');
  }
}