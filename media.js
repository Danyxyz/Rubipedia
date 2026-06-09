// IndexedDB for storing images
const DB_NAME = 'RubipediaMedia';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('date', 'date', { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function addImage(db, imageData) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.add(imageData);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllImages(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function deleteImage(db, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const galleryGrid = document.getElementById('galleryGrid');
const galleryEmpty = document.getElementById('galleryEmpty');
const imageCount = document.getElementById('imageCount');
const lightbox = document.getElementById('lightbox');
const lightboxOverlay = document.getElementById('lightboxOverlay');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxName = document.getElementById('lightboxName');
const lightboxDelete = document.getElementById('lightboxDelete');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let images = [];
let currentLightboxIndex = -1;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

// Upload area click
uploadArea.addEventListener('click', () => fileInput.click());

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

// Handle file uploads
async function handleFiles(files) {
    const db = await openDB();

    for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert(`"${file.name}" is not a supported image format.`);
            continue;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert(`"${file.name}" exceeds the 20MB size limit.`);
            continue;
        }

        const dataUrl = await readFileAsDataURL(file);
        const imageData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: dataUrl,
            date: new Date().toISOString()
        };

        await addImage(db, imageData);
    }

    await loadGallery();
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

// Load and render gallery
async function loadGallery() {
    const db = await openDB();
    images = await getAllImages(db);

    // Sort newest first
    images.sort((a, b) => new Date(b.date) - new Date(a.date));

    galleryGrid.innerHTML = '';

    if (images.length === 0) {
        galleryEmpty.style.display = 'block';
        galleryGrid.style.display = 'none';
    } else {
        galleryEmpty.style.display = 'none';
        galleryGrid.style.display = 'grid';

        images.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';
            item.innerHTML = `
                <img src="${img.data}" alt="${escapeHtml(img.name)}" loading="lazy">
                <div class="item-overlay">
                    <div class="item-name">${escapeHtml(img.name)}</div>
                </div>
            `;
            item.addEventListener('click', () => openLightbox(index));
            galleryGrid.appendChild(item);
        });
    }

    imageCount.textContent = `${images.length} image${images.length !== 1 ? 's' : ''}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Lightbox
function openLightbox(index) {
    if (index < 0 || index >= images.length) return;
    currentLightboxIndex = index;
    const img = images[index];

    lightboxImage.src = img.data;
    lightboxImage.alt = img.name;
    lightboxName.textContent = img.name;
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    updateNavButtons();
}

function closeLightbox() {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    currentLightboxIndex = -1;
}

function updateNavButtons() {
    lightboxPrev.style.display = currentLightboxIndex > 0 ? 'flex' : 'none';
    lightboxNext.style.display = currentLightboxIndex < images.length - 1 ? 'flex' : 'none';
}

lightboxOverlay.addEventListener('click', closeLightbox);
lightboxClose.addEventListener('click', closeLightbox);

lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxIndex > 0) openLightbox(currentLightboxIndex - 1);
});

lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentLightboxIndex < images.length - 1) openLightbox(currentLightboxIndex + 1);
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (lightbox.style.display !== 'flex') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && currentLightboxIndex > 0) openLightbox(currentLightboxIndex - 1);
    if (e.key === 'ArrowRight' && currentLightboxIndex < images.length - 1) openLightbox(currentLightboxIndex + 1);
});

// Delete from lightbox
lightboxDelete.addEventListener('click', async (e) => {
    e.stopPropagation();
    const img = images[currentLightboxIndex];
    if (!confirm(`Delete "${img.name}"?`)) return;

    const db = await openDB();
    await deleteImage(db, img.id);
    closeLightbox();
    await loadGallery();
});

// Initial load
loadGallery();
