// DOM Elements
const editSection = document.getElementById('editSection');
const displaySection = document.getElementById('displaySection');
const pageTitleInput = document.getElementById('pageTitle');
const pageContentInput = document.getElementById('pageContent');
const pageTagsInput = document.getElementById('pageTags');
const generateBtn = document.getElementById('generateBtn');
const savePageBtn = document.getElementById('savePageBtn');
const clearBtn = document.getElementById('clearBtn');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const newPageBtn = document.getElementById('newPageBtn');
const copyBtn = document.getElementById('copyBtn');
const backToTocBtn = document.getElementById('backToTocBtn');
const displayTitle = document.getElementById('displayTitle');
const displayTags = document.getElementById('displayTags');
const displayContent = document.getElementById('displayContent');
const lastEdited = document.getElementById('lastEdited');
const tableOfContents = document.getElementById('tableOfContents');
const tocBox = document.getElementById('tocBox');
const savedPagesBox = document.getElementById('savedPagesBox');
const savedPagesList = document.getElementById('savedPagesList');
const newPageLink = document.getElementById('newPageLink');
const viewPagesLink = document.getElementById('viewPagesLink');
const exportDataLink = document.getElementById('exportDataLink');
const importDataLink = document.getElementById('importDataLink');
const syncProjectLink = document.getElementById('syncProjectLink');
const importFileInput = document.getElementById('importFileInput');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const homeLink = document.getElementById('homeLink');
const navNewPageBtn = document.getElementById('navNewPageBtn');
const navVoiceNotesBtn = document.getElementById('navVoiceNotesBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const versionHistoryBtn = document.getElementById('versionHistoryBtn');
const versionHistoryPanel = document.getElementById('versionHistoryPanel');

// Current page state
let currentPageId = null;
let isEditingExisting = false;
let searchDebounceTimer = null;

// Home link - show table of contents
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showTableOfContents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Back to TOC button
backToTocBtn.addEventListener('click', () => {
    showTableOfContents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Generate page from input
generateBtn.addEventListener('click', () => {
    const title = pageTitleInput.value.trim();
    const content = pageContentInput.value.trim();

    if (!title) {
        alert('Please enter a page title');
        return;
    }

    if (!content) {
        alert('Please enter some content');
        return;
    }

    // Create new page
    const pageId = generatePageId(title);
    const tags = pageTagsInput ? pageTagsInput.value.trim() : '';
    savePage(pageId, title, content, tags);
    displayPage(pageId);
    updateSavedPagesList();
});

// Save changes to existing page
savePageBtn.addEventListener('click', () => {
    const title = pageTitleInput.value.trim();
    const content = pageContentInput.value.trim();

    if (!title || !content) {
        alert('Please enter both title and content');
        return;
    }

    const tags = pageTagsInput ? pageTagsInput.value.trim() : '';
    savePage(currentPageId, title, content, tags);
    displayPage(currentPageId);
    updateSavedPagesList();
});

// Clear form
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all content?')) {
        pageTitleInput.value = '';
        pageContentInput.value = '';
        currentPageId = null;
        isEditingExisting = false;
        generateBtn.style.display = 'inline-block';
        savePageBtn.style.display = 'none';
        pageTitleInput.focus();
    }
});

// Edit page
editBtn.addEventListener('click', () => {
    isEditingExisting = true;
    generateBtn.style.display = 'none';
    savePageBtn.style.display = 'inline-block';
    editSection.style.display = 'block';
    displaySection.style.display = 'none';
    tocBox.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// New page button
newPageBtn.addEventListener('click', () => {
    createNewPage();
});

newPageLink.addEventListener('click', (e) => {
    e.preventDefault();
    createNewPage();
});

// Navigation new page button
navNewPageBtn.addEventListener('click', (e) => {
    e.preventDefault();
    createNewPage();
});

// Voice Notes button - navigate to voice notes page
navVoiceNotesBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    const voiceNotesId = pagesIndex.find(id => id.toLowerCase().includes('voice_notes'));
    if (voiceNotesId) {
        displayPage(voiceNotesId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        alert('Voice Notes page not found. Create a page titled "Voice Notes" first.');
    }
});

// Delete page
deleteBtn.addEventListener('click', () => {
    if (!currentPageId) return;
    
    if (confirm('Are you sure you want to delete this page?')) {
        deletePage(currentPageId);
        createNewPage();
        updateSavedPagesList();
    }
});

// View all pages
viewPagesLink.addEventListener('click', (e) => {
    e.preventDefault();
    showTableOfContents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Export all data
exportDataLink.addEventListener('click', (e) => {
    e.preventDefault();
    exportAllPages();
});

// Import data
importDataLink.addEventListener('click', (e) => {
    e.preventDefault();
    importFileInput.click();
});

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        importPages(file);
    }
    // Reset input so same file can be imported again
    e.target.value = '';
});

if (syncProjectLink) {
    syncProjectLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await syncEverythingToProjectFiles();
    });
}

// Search functionality with debounce
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    
    if (query.length < 2) {
        return; // Wait for at least 2 characters
    }
    
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => performSearch(query), 300);
});

// Close search results when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Copy content
copyBtn.addEventListener('click', () => {
    const contentText = displayContent.innerText;
    const fullText = `${displayTitle.textContent}\n\n${contentText}`;

    navigator.clipboard.writeText(fullText).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Failed to copy content');
        console.error(err);
    });
});

// Editing Toolbar Functionality — event delegation
const editingToolbar = document.querySelector('.editing-toolbar');
if (editingToolbar) {
    editingToolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('.toolbar-btn');
        if (!btn) return;
        e.preventDefault();
        handleToolbarAction(btn.dataset.action);
    });
}

// Keyboard shortcuts in the textarea
pageContentInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'b':
                e.preventDefault();
                handleToolbarAction('bold');
                break;
            case 'i':
                e.preventDefault();
                handleToolbarAction('italic');
                break;
            case 'k':
                e.preventDefault();
                handleToolbarAction('link');
                break;
        }
    }
});

// Format guide toggle
document.getElementById('formatHintToggle').addEventListener('click', () => {
    const content = document.getElementById('formatHintContent');
    const isHidden = content.style.display === 'none' || !content.style.display;
    content.style.display = isHidden ? 'grid' : 'none';
});

function handleToolbarAction(action) {
    const textarea = pageContentInput;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    let newText = '';
    let cursorOffset = 0;
    
    switch(action) {
        case 'bold':
            if (selectedText) {
                newText = `'''${selectedText}'''`;
                cursorOffset = newText.length;
            } else {
                newText = `'''bold text'''`;
                cursorOffset = 3;
            }
            break;
            
        case 'italic':
            if (selectedText) {
                newText = `''${selectedText}''`;
                cursorOffset = newText.length;
            } else {
                newText = `''italic text''`;
                cursorOffset = 2;
            }
            break;

        case 'strikethrough':
            if (selectedText) {
                newText = `~~${selectedText}~~`;
                cursorOffset = newText.length;
            } else {
                newText = `~~strikethrough~~`;
                cursorOffset = 2;
            }
            break;

        case 'inlinecode':
            if (selectedText) {
                newText = `\`${selectedText}\``;
                cursorOffset = newText.length;
            } else {
                newText = `\`code\``;
                cursorOffset = 1;
            }
            break;

        case 'heading1':
            if (selectedText) {
                newText = `= ${selectedText} =`;
                cursorOffset = newText.length;
            } else {
                newText = `= Heading 1 =`;
                cursorOffset = 2;
            }
            break;
            
        case 'heading2':
            if (selectedText) {
                newText = `== ${selectedText} ==`;
                cursorOffset = newText.length;
            } else {
                newText = `== Heading 2 ==`;
                cursorOffset = 3;
            }
            break;
            
        case 'heading3':
            if (selectedText) {
                newText = `=== ${selectedText} ===`;
                cursorOffset = newText.length;
            } else {
                newText = `=== Heading 3 ===`;
                cursorOffset = 4;
            }
            break;
            
        case 'bullet':
            const lines = selectedText ? selectedText.split('\n') : ['List item 1', 'List item 2', 'List item 3'];
            newText = lines.map(line => `* ${line.trim()}`).join('\n');
            cursorOffset = newText.length;
            break;

        case 'numbered':
            const nLines = selectedText ? selectedText.split('\n') : ['First item', 'Second item', 'Third item'];
            newText = nLines.map(line => `# ${line.trim()}`).join('\n');
            cursorOffset = newText.length;
            break;

        case 'blockquote':
            const bLines = selectedText ? selectedText.split('\n') : ['Quoted wisdom here'];
            newText = bLines.map(line => `> ${line.trim()}`).join('\n');
            cursorOffset = newText.length;
            break;

        case 'codeblock':
            if (selectedText) {
                newText = `\`\`\`\n${selectedText}\n\`\`\``;
            } else {
                newText = `\`\`\`\ncode here\n\`\`\``;
            }
            cursorOffset = newText.length;
            break;

        case 'hr':
            newText = '\n---\n';
            cursorOffset = newText.length;
            break;
            
        case 'link':
            const url = prompt('Enter URL:', 'https://');
            if (url) {
                const linkText = selectedText || 'link text';
                newText = `[[${url}|${linkText}]]`;
                cursorOffset = newText.length;
            } else {
                return;
            }
            break;
            
        case 'table':
            insertTable();
            return;
    }
    
    // Insert the new text
    textarea.value = beforeText + newText + afterText;
    
    // Set cursor position
    const newCursorPos = start + cursorOffset;
    textarea.focus();
    textarea.setSelectionRange(newCursorPos, newCursorPos);
}

function insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (!rows || !cols || isNaN(rows) || isNaN(cols)) {
        return;
    }
    
    const numRows = parseInt(rows);
    const numCols = parseInt(cols);
    
    if (numRows < 1 || numCols < 1 || numRows > 20 || numCols > 10) {
        alert('Please enter valid numbers (rows: 1-20, columns: 1-10)');
        return;
    }
    
    // Create table markup
    let tableText = '\n\n{| class="wikitable"\n';
    
    // Header row
    tableText += '! Header 1';
    for (let j = 1; j < numCols; j++) {
        tableText += ` !! Header ${j + 1}`;
    }
    tableText += '\n';
    
    // Data rows
    for (let i = 0; i < numRows; i++) {
        tableText += '|-\n';
        tableText += `| Row ${i + 1} Col 1`;
        for (let j = 1; j < numCols; j++) {
            tableText += ` || Row ${i + 1} Col ${j + 1}`;
        }
        tableText += '\n';
    }
    
    tableText += '|}\n\n';
    
    // Insert at cursor position
    const textarea = pageContentInput;
    const start = textarea.selectionStart;
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(start);
    
    textarea.value = beforeText + tableText + afterText;
    textarea.focus();
    textarea.setSelectionRange(start + tableText.length, start + tableText.length);
}

// ===== PAGE MANAGEMENT FUNCTIONS =====

function generatePageId(title) {
    return 'page_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now();
}

function savePage(pageId, title, content, tags) {
    // Input validation
    if (title.length > 200) {
        alert('Title must be 200 characters or less.');
        return;
    }
    if (content.length > 500000) { // ~500KB
        alert('Content is too large. Please keep it under 500KB.');
        return;
    }

    // Save version history before overwriting
    const existing = loadPage(pageId);
    if (existing) {
        saveVersionHistory(pageId, existing);
    }

    const page = {
        id: pageId,
        title: title,
        content: content,
        tags: tags || '',
        lastEdited: new Date().toISOString()
    };
    
    try {
        localStorage.setItem(pageId, JSON.stringify(page));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            alert('Storage is full. Export your data and clear some pages to free space.');
            return;
        }
        throw e;
    }
    
    // Add to pages index
    let pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    if (!pagesIndex.includes(pageId)) {
        pagesIndex.push(pageId);
        localStorage.setItem('rubipedia_pages_index', JSON.stringify(pagesIndex));
    }
}

function saveVersionHistory(pageId, page) {
    const historyKey = pageId + '_history';
    let history = [];
    try {
        history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch (e) { history = []; }
    
    history.push({
        title: page.title,
        content: page.content,
        tags: page.tags || '',
        savedAt: page.lastEdited
    });
    
    // Keep only last 10 versions
    if (history.length > 10) history = history.slice(-10);
    
    try {
        localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) { /* silently drop if out of space */ }
}

function loadPage(pageId) {
    const pageData = localStorage.getItem(pageId);
    if (pageData) {
        try {
            return JSON.parse(pageData);
        } catch (e) {
            console.error('Failed to parse page data for', pageId, e);
            return null;
        }
    }
    return null;
}

function deletePage(pageId) {
    localStorage.removeItem(pageId);
    
    // Remove from index
    let pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    pagesIndex = pagesIndex.filter(id => id !== pageId);
    localStorage.setItem('rubipedia_pages_index', JSON.stringify(pagesIndex));
}

function displayPage(pageId) {
    const page = loadPage(pageId);
    if (!page) return;
    
    currentPageId = pageId;
    
    // Parse and format content
    const formattedContent = parseWikiContent(page.content);
    
    // Update display
    displayTitle.textContent = page.title;
    displayContent.innerHTML = formattedContent;
    lastEdited.textContent = new Date(page.lastEdited).toLocaleString();
    
    // Display tags
    if (displayTags) {
        displayTags.innerHTML = '';
        if (page.tags) {
            page.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(tag => {
                const span = document.createElement('span');
                span.className = 'category-tag';
                span.textContent = tag;
                displayTags.appendChild(span);
            });
        }
    }
    
    // Generate table of contents
    generateTableOfContents();
    
    // Update form fields for future editing
    pageTitleInput.value = page.title;
    pageContentInput.value = page.content;
    if (pageTagsInput) pageTagsInput.value = page.tags || '';
    
    // Show sidebar and content wrapper again
    const sidebar = document.querySelector('.sidebar');
    const contentWrapper = document.querySelector('.content-wrapper');
    sidebar.style.display = 'block';
    contentWrapper.style.display = 'grid';
    
    // Hide header and nav when viewing article
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    header.style.display = 'none';
    nav.style.display = 'none';
    
    // Switch views
    tocView.style.display = 'none';
    editSection.style.display = 'none';
    displaySection.style.display = 'block';
    tocBox.style.display = 'block';
    
    // Reset button states
    isEditingExisting = false;
    generateBtn.style.display = 'inline-block';
    savePageBtn.style.display = 'none';
}

function createNewPage() {
    // Clear form
    pageTitleInput.value = '';
    pageContentInput.value = '';
    if (pageTagsInput) pageTagsInput.value = '';
    currentPageId = null;
    isEditingExisting = false;
    generateBtn.style.display = 'inline-block';
    savePageBtn.style.display = 'none';
    
    // Show sidebar and content wrapper again
    const sidebar = document.querySelector('.sidebar');
    const contentWrapper = document.querySelector('.content-wrapper');
    sidebar.style.display = 'block';
    contentWrapper.style.display = 'grid';
    
    // Hide header and nav when creating new page
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    header.style.display = 'none';
    nav.style.display = 'none';
    
    tocView.style.display = 'none';
    editSection.style.display = 'block';
    displaySection.style.display = 'none';
    tocBox.style.display = 'none';
    pageTitleInput.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSavedPagesList() {
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    savedPagesList.innerHTML = '';
    
    if (pagesIndex.length === 0) {
        savedPagesList.innerHTML = `<li style="color: #8a7450; font-size: 0.85em; font-style: italic;">No saved pages</li>`;
        return;
    }
    
    // Load all pages and sort alphabetically by title
    const pages = pagesIndex
        .map(pageId => {
            const page = loadPage(pageId);
            return page ? { id: pageId, title: page.title } : null;
        })
        .filter(page => page !== null)
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    
    // Display sorted pages
    pages.forEach(({ id, title }) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = title;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            displayPage(id);
        });
        li.appendChild(link);
        savedPagesList.appendChild(li);
    });
}

function generateTableOfContents() {
    const headings = displayContent.querySelectorAll('h1, h2, h3');
    tableOfContents.innerHTML = '';
    
    if (headings.length === 0) {
        tocBox.style.display = 'none';
        return;
    }
    
    headings.forEach((heading, index) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        
        const anchorId = 'heading-' + index;
        heading.id = anchorId;
        
        link.href = '#' + anchorId;
        link.textContent = heading.textContent;
        
        if (heading.tagName === 'H2') {
            li.style.marginLeft = '10px';
        } else if (heading.tagName === 'H3') {
            li.style.marginLeft = '20px';
            li.style.fontSize = '0.85em';
        }
        
        li.appendChild(link);
        tableOfContents.appendChild(li);
    });
    
    tocBox.style.display = 'block';
}

function performSearch(query) {
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    const results = [];
    
    pagesIndex.forEach(pageId => {
        const page = loadPage(pageId);
        if (!page) return;
        
        const titleMatch = page.title.toLowerCase().includes(query);
        const contentMatch = page.content.toLowerCase().includes(query);
        
        if (titleMatch || contentMatch) {
            // Extract excerpt around the match
            let excerpt = '';
            if (contentMatch) {
                const index = page.content.toLowerCase().indexOf(query);
                const start = Math.max(0, index - 50);
                const end = Math.min(page.content.length, index + query.length + 50);
                excerpt = (start > 0 ? '...' : '') + 
                         page.content.substring(start, end) + 
                         (end < page.content.length ? '...' : '');
                
                // Highlight the match
                const regex = new RegExp(`(${query})`, 'gi');
                excerpt = escapeHtml(excerpt).replace(regex, '<strong>$1</strong>');
            } else {
                // Just show first 100 chars if only title matched
                excerpt = page.content.substring(0, 100) + '...';
                excerpt = escapeHtml(excerpt);
            }
            
            results.push({
                id: pageId,
                title: page.title,
                excerpt: excerpt
            });
        }
    });
    
    displaySearchResults(results, query);
}

function displaySearchResults(results, query) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
        searchResults.innerHTML = `<div class="search-no-results">No wisdom found for "${escapeHtml(query)}"</div>`;
        searchResults.style.display = 'block';
        return;
    }
    
    // Sort results alphabetically by title
    results.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));
    
    results.forEach(result => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `
            <div class="search-result-title">${escapeHtml(result.title)}</div>
            <div class="search-result-excerpt">${result.excerpt}</div>
        `;
        div.addEventListener('click', () => {
            displayPage(result.id);
            searchResults.style.display = 'none';
            searchInput.value = '';
        });
        searchResults.appendChild(div);
    });
    
    searchResults.style.display = 'block';
}

function exportAllPages() {
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    
    if (pagesIndex.length === 0) {
        alert('No pages to export. Create some pages first!');
        return;
    }
    
    const allPages = [];
    pagesIndex.forEach(pageId => {
        const page = loadPage(pageId);
        if (page) {
            allPages.push(page);
        }
    });
    
    const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        pages: allPages
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rubipedia_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`Exported ${allPages.length} page(s) successfully!`);
}

const MEDIA_DB_NAME = 'RubipediaMedia';
const MEDIA_DB_VERSION = 1;
const MEDIA_STORE_NAME = 'images';

function openMediaDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(MEDIA_DB_NAME, MEDIA_DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(MEDIA_STORE_NAME)) {
                const store = db.createObjectStore(MEDIA_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('name', 'name', { unique: false });
                store.createIndex('date', 'date', { unique: false });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllMediaFromIndexedDB() {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openMediaDB();
            const tx = db.transaction(MEDIA_STORE_NAME, 'readonly');
            const store = tx.objectStore(MEDIA_STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        } catch (err) {
            resolve([]);
        }
    });
}

function upsertMediaRecords(records) {
    return new Promise(async (resolve, reject) => {
        if (!Array.isArray(records) || records.length === 0) {
            resolve(0);
            return;
        }

        try {
            const db = await openMediaDB();
            const tx = db.transaction(MEDIA_STORE_NAME, 'readwrite');
            const store = tx.objectStore(MEDIA_STORE_NAME);
            let completed = 0;

            records.forEach((record) => {
                const clean = {
                    name: record.name || 'image',
                    type: record.type || 'image/png',
                    size: record.size || 0,
                    data: record.data || '',
                    date: record.date || new Date().toISOString()
                };
                const req = store.add(clean);
                req.onsuccess = () => {
                    completed++;
                    if (completed === records.length) resolve(completed);
                };
                req.onerror = () => {
                    const putReq = store.put({ ...clean, id: record.id });
                    putReq.onsuccess = () => {
                        completed++;
                        if (completed === records.length) resolve(completed);
                    };
                    putReq.onerror = () => reject(putReq.error);
                };
            });
        } catch (err) {
            reject(err);
        }
    });
}

function getAllPagesForExport() {
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    const allPages = [];

    pagesIndex.forEach(pageId => {
        const page = loadPage(pageId);
        if (page) allPages.push(page);
    });

    return allPages;
}

function createTimestampForFileName() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}`;
}

function sanitizeFileName(name) {
    return (name || 'media')
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase() || 'media';
}

function extensionFromMime(mimeType) {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg';
    if (mimeType === 'image/gif') return '.gif';
    if (mimeType === 'image/webp') return '.webp';
    return '.bin';
}

function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const meta = parts[0] || '';
    const base64 = parts[1] || '';
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
}

async function writeTextFile(directoryHandle, fileName, content) {
    const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
}

async function writeMediaFiles(imagesDirHandle, mediaRecords) {
    const uploadedDir = await imagesDirHandle.getDirectoryHandle('Uploaded', { create: true });
    const mediaFileIndex = [];

    for (const media of mediaRecords) {
        if (!media.data || !media.type || !media.type.startsWith('image/')) continue;
        const safeBase = sanitizeFileName(media.name || 'image');
        const ext = extensionFromMime(media.type);
        const fileName = `${safeBase}_${media.id || Date.now()}${ext}`;
        const blob = dataUrlToBlob(media.data);

        const fileHandle = await uploadedDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        mediaFileIndex.push({
            id: media.id,
            name: media.name,
            type: media.type,
            size: media.size,
            date: media.date,
            file: `Images/Uploaded/${fileName}`
        });
    }

    return mediaFileIndex;
}

function downloadFullBackup(payload, fileName) {
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function syncEverythingToProjectFiles() {
    const pages = getAllPagesForExport();
    const media = await getAllMediaFromIndexedDB();
    const timestamp = createTimestampForFileName();

    const fullBackup = {
        exportDate: new Date().toISOString(),
        version: '2.0',
        source: 'rubipedia_sync',
        pages,
        media
    };

    // Fallback path: if file system API is unavailable, at least export one full backup file.
    if (!window.showDirectoryPicker) {
        downloadFullBackup(fullBackup, `rubipedia_full_backup_${timestamp}.json`);
        alert('Direct project write is not supported in this browser context. Downloaded a full backup JSON instead.');
        return;
    }

    try {
        const rootDir = await window.showDirectoryPicker({ mode: 'readwrite' });
        const backupDir = await rootDir.getDirectoryHandle('Backup', { create: true });
        const imagesDir = await rootDir.getDirectoryHandle('Images', { create: true });

        const mediaFileIndex = await writeMediaFiles(imagesDir, media);

        const pagesOnly = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            pages
        };

        const mediaOnly = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            media,
            files: mediaFileIndex
        };

        await writeTextFile(rootDir, 'data.json', JSON.stringify(pagesOnly, null, 2));
        await writeTextFile(backupDir, `rubipedia_full_backup_${timestamp}.json`, JSON.stringify(fullBackup, null, 2));
        await writeTextFile(backupDir, `rubipedia_media_backup_${timestamp}.json`, JSON.stringify(mediaOnly, null, 2));

        alert(`Sync complete. Saved ${pages.length} page(s) and ${media.length} media item(s) to project files.`);
    } catch (err) {
        console.error(err);
        alert('Sync cancelled or failed. No project files were changed.');
    }
}

function importPages(file) {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            
            if (!importData.pages || !Array.isArray(importData.pages)) {
                alert('Invalid backup file format.');
                return;
            }
            
            const confirmMsg = `This will import ${importData.pages.length} page(s).\n\nExisting pages with the same titles will be kept (no overwrite).\n\nContinue?`;
            
            if (!confirm(confirmMsg)) {
                return;
            }
            
            let importedCount = 0;
            importData.pages.forEach(page => {
                // Generate new ID for imported pages to avoid conflicts
                const newId = generatePageId(page.title);
                savePage(newId, page.title, page.content, page.tags || '');
                importedCount++;
            });

            let importedMedia = 0;
            if (Array.isArray(importData.media) && importData.media.length > 0) {
                importedMedia = await upsertMediaRecords(importData.media);
            }
            
            updateSavedPagesList();
            alert(`Successfully imported ${importedCount} page(s) and ${importedMedia} media item(s)!`);
            
            // Load the first imported page
            if (importedCount > 0) {
                const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
                displayPage(pagesIndex[pagesIndex.length - 1]);
                savedPagesBox.style.display = 'block';
            }
            
        } catch (error) {
            alert('Error reading backup file. Make sure it\'s a valid Rubipedia backup.');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
}

// ===== END PAGE MANAGEMENT =====

// Parse wiki-style table
function parseTable(tableContent) {
    const lines = tableContent.split('\n').map(l => l.trim()).filter(l => l);
    let html = '<table class="wiki-table">';
    let inHeader = false;
    
    for (let line of lines) {
        if (line.startsWith('!')) {
            // Header row
            if (!inHeader) {
                html += '<thead><tr>';
                inHeader = true;
            }
            const headers = line.substring(1).split('!!').map(h => h.trim());
            headers.forEach(header => {
                html += `<th>${formatInlineText(header)}</th>`;
            });
        } else if (line === '|-') {
            // Row separator
            if (inHeader) {
                html += '</tr></thead><tbody>';
                inHeader = false;
            } else {
                html += '</tr><tr>';
            }
        } else if (line.startsWith('|') && !line.startsWith('|}')) {
            // Data cell
            if (inHeader) {
                html += '</tr></thead><tbody><tr>';
                inHeader = false;
            }
            const cells = line.substring(1).split('||').map(c => c.trim());
            cells.forEach(cell => {
                html += `<td>${formatInlineText(cell)}</td>`;
            });
        }
    }
    
    html += '</tr></tbody></table>';
    return html;
}

// Parse wiki-style content
function parseWikiContent(text) {
    // Extract and process tables
    const tablePlaceholders = [];
    let tableCounter = 0;
    text = text.replace(/\{\|.*?\n([\s\S]*?)\n\|\}/g, (match, tableContent) => {
        const tableHtml = parseTable(tableContent);
        const placeholder = `__TABLE_${tableCounter}__`;
        tablePlaceholders[tableCounter] = tableHtml;
        tableCounter++;
        return placeholder;
    });

    // Extract code blocks (``` ... ```)
    const codePlaceholders = [];
    let codeCounter = 0;
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => {
        const codeHtml = `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
        const placeholder = `__CODE_${codeCounter}__`;
        codePlaceholders[codeCounter] = codeHtml;
        codeCounter++;
        return placeholder;
    });

    let html = '';
    const lines = text.split('\n');
    let inList = false;
    let inOrderedList = false;
    let inBlockquote = false;

    for (let line of lines) {
        line = line.trim();

        // Code block placeholder
        if (line.startsWith('__CODE_') && line.endsWith('__')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            const codeIndex = parseInt(line.match(/__CODE_(\d+)__/)[1]);
            html += codePlaceholders[codeIndex];
            continue;
        }

        // Table placeholder
        if (line.startsWith('__TABLE_') && line.endsWith('__')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            const tableIndex = parseInt(line.match(/__TABLE_(\d+)__/)[1]);
            html += tablePlaceholders[tableIndex];
            continue;
        }

        // Empty lines
        if (line === '') {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            html += '<br>';
            continue;
        }

        // Horizontal rule (---)
        if (line === '---') {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            html += '<hr class="content-hr">';
            continue;
        }

        // Heading level 3 (===) — check BEFORE h2 and h1
        if (line.startsWith('=== ') && line.endsWith(' ===')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            const heading = line.slice(4, -4);
            html += `<h3>${escapeHtml(heading)}</h3>`;
            continue;
        }

        // Heading level 2 (==) — check BEFORE h1
        if (line.startsWith('== ') && line.endsWith(' ==')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            const heading = line.slice(3, -3);
            html += `<h2>${escapeHtml(heading)}</h2>`;
            continue;
        }

        // Heading level 1 (= heading =)
        if (line.startsWith('= ') && line.endsWith(' =') && !line.startsWith('==')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (inBlockquote) { html += '</blockquote>'; inBlockquote = false; }
            const heading = line.slice(2, -2).trim();
            html += `<h1>${escapeHtml(heading)}</h1>`;
            continue;
        }

        // Blockquote (> text)
        if (line.startsWith('> ')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (!inBlockquote) { html += '<blockquote class="wiki-blockquote">'; inBlockquote = true; }
            html += `<p>${formatInlineText(line.slice(2))}</p>`;
            continue;
        } else if (inBlockquote) {
            html += '</blockquote>';
            inBlockquote = false;
        }

        // Bullet list items (* item)
        if (line.startsWith('* ')) {
            if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
            if (!inList) { html += '<ul>'; inList = true; }
            const item = line.slice(2);
            html += `<li>${formatInlineText(item)}</li>`;
            continue;
        }

        // Numbered list items (# item)
        if (line.startsWith('# ')) {
            if (inList) { html += '</ul>'; inList = false; }
            if (!inOrderedList) { html += '<ol>'; inOrderedList = true; }
            const item = line.slice(2);
            html += `<li>${formatInlineText(item)}</li>`;
            continue;
        }

        // Regular paragraph
        if (inList) { html += '</ul>'; inList = false; }
        if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
        html += `<p>${formatInlineText(line)}</p>`;
    }

    // Close any open blocks
    if (inList) html += '</ul>';
    if (inOrderedList) html += '</ol>';
    if (inBlockquote) html += '</blockquote>';

    return html;
}

// Format inline text (bold, italic, links) — safe approach: escape FIRST, then apply formatting
function formatInlineText(text) {
    // Escape all HTML first to prevent XSS
    text = escapeHtml(text);

    // Bold ('''text''')
    text = text.replace(/&#x27;&#x27;&#x27;([^&]+?)&#x27;&#x27;&#x27;/g, '<strong>$1</strong>');
    // Also handle already-escaped single quotes: '''text'''
    text = text.replace(/'''([^']+?)'''/g, '<strong>$1</strong>');
    
    // Italic (''text'')
    text = text.replace(/&#x27;&#x27;([^&]+?)&#x27;&#x27;/g, '<em>$1</em>');
    text = text.replace(/''([^']+?)''/g, '<em>$1</em>');

    // Strikethrough (~~text~~)
    text = text.replace(/~~([^~]+?)~~/g, '<del>$1</del>');

    // Inline code (`text`)
    text = text.replace(/`([^`]+?)`/g, '<code class="inline-code">$1</code>');
    
    // Links: [[URL|Text]] or [[URL]]
    text = text.replace(/\[\[([^\]|]+?)\|([^\]]+?)\]\]/g, (m, url, label) => {
        const safeUrl = sanitizeUrl(url);
        return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener">${label}</a>` : label;
    });
    text = text.replace(/\[\[([^\]]+?)\]\]/g, (m, url) => {
        const safeUrl = sanitizeUrl(url);
        return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener">${url}</a>` : url;
    });

    // Legacy link format [URL text]
    text = text.replace(/\[([^\s\]]+?)\s([^\]]+?)\]/g, (m, url, label) => {
        const safeUrl = sanitizeUrl(url);
        return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener">${label}</a>` : label;
    });
    
    // Plain URLs (already escaped, so &amp; may appear — match carefully)
    text = text.replace(/(https?:\/\/[^\s<"]+)/g, (m, url) => {
        const safeUrl = sanitizeUrl(url);
        return safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener">${url}</a>` : url;
    });
    
    // Hashtags
    text = text.replace(/#(\w+)/g, '<a href="https://twitter.com/hashtag/$1" target="_blank" rel="noopener">#$1</a>');
    
    // @mentions
    text = text.replace(/@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank" rel="noopener">@$1</a>');

    return text;
}

// Sanitize URL to prevent javascript: and data: protocol attacks
function sanitizeUrl(url) {
    try {
        // Decode HTML entities that escapeHtml may have introduced
        const decoded = url.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
        const parsed = new URL(decoded, window.location.origin);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
            return escapeHtml(decoded);
        }
        return null;
    } catch (e) {
        // Relative URLs are fine
        if (url.startsWith('/') || url.startsWith('#') || url.startsWith('./')) {
            return escapeHtml(url);
        }
        return null;
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== TABLE OF CONTENTS FUNCTIONS =====
const tocView = document.getElementById('tocView');
const tocGrid = document.getElementById('tocGrid');
const tocEmpty = document.getElementById('tocEmpty');

function showTableOfContents() {
    // Hide other sections
    editSection.style.display = 'none';
    displaySection.style.display = 'none';
    tocView.style.display = 'block';
    tocBox.style.display = 'none';
    
    // Hide sidebar when showing TOC for full width experience
    const sidebar = document.querySelector('.sidebar');
    const contentWrapper = document.querySelector('.content-wrapper');
    sidebar.style.display = 'none';
    contentWrapper.style.display = 'none';
    
    // Show header and nav in TOC view
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    header.style.display = 'block';
    nav.style.display = 'block';
    
    // Render the TOC grid
    renderTableOfContents();
}

function renderTableOfContents() {
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    tocGrid.innerHTML = '';
    
    if (pagesIndex.length === 0) {
        tocEmpty.style.display = 'block';
        tocGrid.style.display = 'none';
        return;
    }
    
    tocEmpty.style.display = 'none';
    tocGrid.style.display = 'grid';
    
    // Load all pages and sort alphabetically by title
    const pages = pagesIndex
        .map(pageId => {
            const page = loadPage(pageId);
            return page ? { id: pageId, page: page } : null;
        })
        .filter(item => item !== null)
        .sort((a, b) => a.page.title.localeCompare(b.page.title, undefined, { sensitivity: 'base' }));
    
    // Create cards
    pages.forEach(({ id, page }) => {
        const card = document.createElement('div');
        card.className = 'toc-card';
        
        // Create excerpt from content (first 150 chars, plain text)
        let excerpt = page.content
            .replace(/[#*`_~\[\]{}|]/g, '') // Remove markdown chars
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim()
            .substring(0, 150);
        
        if (page.content.length > 150) {
            excerpt += '...';
        }
        
        // Format last edited date
        const lastEdited = new Date(page.lastEdited).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });

        // Build tags HTML
        let tagsHtml = '';
        if (page.tags) {
            const tagList = page.tags.split(',').map(t => t.trim()).filter(Boolean);
            if (tagList.length > 0) {
                tagsHtml = `<div class="toc-card-tags">${tagList.map(t => `<span class="category-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
            }
        }
        
        card.innerHTML = `
            <div class="toc-card-title">${escapeHtml(page.title)}</div>
            ${tagsHtml}
            <div class="toc-card-meta">
                <span class="toc-card-date">${lastEdited}</span>
                <span class="toc-card-icon">→</span>
            </div>
        `;
        
        card.addEventListener('click', () => {
            displayPage(id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        
        tocGrid.appendChild(card);
    });
}

// Load on page start
window.addEventListener('DOMContentLoaded', () => {
    // Check if we need to load from data.json
    const dataLoaded = localStorage.getItem('rubipedia_data_loaded');
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    
    if (!dataLoaded || pagesIndex.length === 0) {
        // First time or no data - load from data.json
        loadDataFromServer(() => {
            updateSavedPagesList();
            // Show TOC view after loading
            showTableOfContents();
        });
    } else {
        // Already have data, show TOC
        updateSavedPagesList();
        showTableOfContents();
    }
});

// Load data from server's data.json file (for online hosting)
function loadDataFromServer(callback) {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('No data.json found');
            return response.json();
        })
        .then(data => {
            if (data.pages && data.pages.length > 0) {
                console.log(`Loading ${data.pages.length} pages from data.json...`);
                loadServerData(data);
                localStorage.setItem('rubipedia_data_loaded', 'true');
                if (callback) callback();
            }
        })
        .catch(error => {
            // Silently fail - data.json is optional
            console.log('No server data.json file found (this is normal for local use)');
            if (callback) callback();
        });
}

function loadServerData(data) {
    data.pages.forEach(page => {
        // Use the existing page ID from the backup to maintain consistency
        const pageId = page.id || generatePageId(page.title);
        
        // Save page to localStorage
        localStorage.setItem(pageId, JSON.stringify({
            id: pageId,
            title: page.title,
            content: page.content,
            tags: page.tags || '',
            lastEdited: page.lastEdited
        }));
        
        // Add to pages index if not already there
        let pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
        if (!pagesIndex.includes(pageId)) {
            pagesIndex.push(pageId);
            localStorage.setItem('rubipedia_pages_index', JSON.stringify(pagesIndex));
        }
    });
    
    console.log(`Successfully loaded ${data.pages.length} pages!`);
}

// ===== MUSIC PLAYER CONTROLS =====
const musicPlayer = document.getElementById('musicPlayer');
const playerToggle = document.getElementById('playerToggle');
const playerClose = document.getElementById('playerClose');
const playerContent = document.getElementById('playerContent');
const backgroundAudio = document.getElementById('backgroundAudio');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = playPauseBtn.querySelector('.play-icon');
const pauseIcon = playPauseBtn.querySelector('.pause-icon');
const progressBar = document.getElementById('progressBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const volumeSlider = document.getElementById('volumeSlider');

// Toggle player collapse
playerToggle.addEventListener('click', () => {
    playerContent.classList.toggle('collapsed');
    playerToggle.textContent = playerContent.classList.contains('collapsed') ? '+' : '_';
});

// Close player completely
playerClose.addEventListener('click', () => {
    backgroundAudio.pause();
    musicPlayer.style.display = 'none';
});

// Play/Pause functionality
playPauseBtn.addEventListener('click', () => {
    if (backgroundAudio.paused) {
        backgroundAudio.play().then(() => {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'inline';
        }).catch(err => {
            console.log('Autoplay blocked or audio file not found:', err);
            alert('Please add your audio file to the "music" folder as "background.mp3"');
        });
    } else {
        backgroundAudio.pause();
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
    }
});

// Update progress bar and time
backgroundAudio.addEventListener('timeupdate', () => {
    if (backgroundAudio.duration) {
        const progress = (backgroundAudio.currentTime / backgroundAudio.duration) * 100;
        progressBar.value = progress;
        
        currentTimeSpan.textContent = formatTime(backgroundAudio.currentTime);
        durationSpan.textContent = formatTime(backgroundAudio.duration);
    }
});

// Seek functionality
progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * backgroundAudio.duration;
    backgroundAudio.currentTime = seekTime;
});

// Volume control
volumeSlider.addEventListener('input', () => {
    backgroundAudio.volume = volumeSlider.value / 100;
});

// Set initial volume
backgroundAudio.volume = 0.5;

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Make player draggable (optional enhancement)
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;

const playerHeader = musicPlayer.querySelector('.player-header');

playerHeader.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    if (e.target === playerToggle) return;
    
    initialX = e.clientX - musicPlayer.offsetLeft;
    initialY = e.clientY - musicPlayer.offsetTop;
    isDragging = true;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        // Keep within viewport
        const maxX = window.innerWidth - musicPlayer.offsetWidth;
        const maxY = window.innerHeight - musicPlayer.offsetHeight;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        
        musicPlayer.style.left = currentX + 'px';
        musicPlayer.style.top = currentY + 'px';
        musicPlayer.style.bottom = 'auto';
        musicPlayer.style.right = 'auto';
    }
}

function dragEnd() {
    isDragging = false;
}

// ============================================
// MOON PHASE ANIMATION
// ============================================

const animatedMoon = document.getElementById('animatedMoon');
const moonPhase = animatedMoon ? animatedMoon.querySelector('.moon-phase') : null;

if (animatedMoon && moonPhase) {
    // Phase definitions with clip-path for each moon phase
    // The .moon-phase element is the DARK overlay, so clip-path controls the shadow
    const moonPhases = [
        {
            name: 'New Moon',
            clipPath: 'circle(50%)', // Completely dark
        },
        {
            name: 'Waxing Crescent',
            clipPath: 'ellipse(40% 50% at 20% 50%)', // Dark covers left ~80%, thin crescent visible on right
        },
        {
            name: 'First Quarter',
            clipPath: 'ellipse(50% 50% at 25% 50%)', // Dark covers left half, right half bright
        },
        {
            name: 'Waxing Gibbous',
            clipPath: 'ellipse(15% 50% at 7.5% 50%)', // Small dark shadow on left, mostly bright
        },
        {
            name: 'Full Moon',
            clipPath: 'circle(0%)', // No shadow, completely bright
        },
        {
            name: 'Waning Gibbous',
            clipPath: 'ellipse(15% 50% at 92.5% 50%)', // Small dark shadow on right, mostly bright
        },
        {
            name: 'Third Quarter',
            clipPath: 'ellipse(50% 50% at 75% 50%)', // Dark covers right half, left half bright
        },
        {
            name: 'Waning Crescent',
            clipPath: 'ellipse(40% 50% at 80% 50%)', // Dark covers right ~80%, thin crescent visible on left
        }
    ];

    let currentPhaseIndex = 0;
    let currentCycle = 0; // 0 = normal, 1 = orange super moon, 2 = pink super moon
    let phaseTimeout = null;

    function setMoonPhase(phaseIndex) {
        const phase = moonPhases[phaseIndex];
        moonPhase.style.clipPath = phase.clipPath;
        
        // Determine if this is a full moon and which type
        if (phaseIndex === 4) { // Full Moon
            if (currentCycle === 0) {
                // Normal white full moon
                animatedMoon.classList.remove('super-moon', 'pink-moon');
                animatedMoon.classList.add('normal');
            } else if (currentCycle === 1) {
                // Orange super full moon
                animatedMoon.classList.remove('normal', 'pink-moon');
                animatedMoon.classList.add('super-moon');
            } else if (currentCycle === 2) {
                // Pink super full moon
                animatedMoon.classList.remove('normal', 'super-moon');
                animatedMoon.classList.add('pink-moon');
            }
        } else {
            // For all other phases, always use normal white color
            animatedMoon.classList.remove('super-moon', 'pink-moon');
            animatedMoon.classList.add('normal');
        }
    }

    function advancePhase() {
        // Set current phase
        setMoonPhase(currentPhaseIndex);
        
        // Determine duration for this phase
        let duration = 3000; // 3 seconds default
        
        // Full moon in cycle 2 or 3 lasts 10 seconds
        if (currentPhaseIndex === 4 && (currentCycle === 1 || currentCycle === 2)) {
            duration = 10000; // 10 seconds
        }
        
        // Schedule next phase
        phaseTimeout = setTimeout(() => {
            currentPhaseIndex++;
            
            // Check if we completed all 8 phases
            if (currentPhaseIndex >= moonPhases.length) {
                currentPhaseIndex = 0; // Reset to New Moon
                currentCycle++; // Move to next cycle
                
                // Reset cycle after completing all 3 cycles
                if (currentCycle > 2) {
                    currentCycle = 0;
                }
            }
            
            advancePhase();
        }, duration);
    }

    // Initialize moon animation
    animatedMoon.classList.add('normal');
    advancePhase();
    
    // Optional: Click handler for moon to skip to next phase
    animatedMoon.addEventListener('click', () => {
        if (phaseTimeout) {
            clearTimeout(phaseTimeout);
        }
        currentPhaseIndex++;
        if (currentPhaseIndex >= moonPhases.length) {
            currentPhaseIndex = 0;
            currentCycle++;
            if (currentCycle > 2) {
                currentCycle = 0;
            }
        }
        advancePhase();
    });
}

// ============================================
// THEME TOGGLE (Light/Dark)
// ============================================
if (themeToggleBtn) {
    // Restore saved theme
    const savedTheme = localStorage.getItem('rubipedia_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '☽';
    }

    themeToggleBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('rubipedia_theme', 'dark');
            themeToggleBtn.textContent = '☀';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('rubipedia_theme', 'light');
            themeToggleBtn.textContent = '☽';
        }
    });
}

// ============================================
// VERSION HISTORY
// ============================================
if (versionHistoryBtn) {
    versionHistoryBtn.addEventListener('click', () => {
        if (!currentPageId) return;
        const panel = versionHistoryPanel;
        if (panel.style.display === 'block') {
            panel.style.display = 'none';
            return;
        }
        const historyKey = currentPageId + '_history';
        let history = [];
        try {
            history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        } catch (e) { history = []; }

        panel.innerHTML = '';
        if (history.length === 0) {
            panel.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No previous versions.</p>';
        } else {
            history.slice().reverse().forEach((ver, idx) => {
                const div = document.createElement('div');
                div.className = 'version-item';
                const date = new Date(ver.savedAt).toLocaleString();
                div.innerHTML = `
                    <span class="version-date">${escapeHtml(date)}</span>
                    <button class="version-restore" data-idx="${history.length - 1 - idx}">Restore</button>
                `;
                panel.appendChild(div);
            });
            panel.addEventListener('click', (e) => {
                const btn = e.target.closest('.version-restore');
                if (!btn) return;
                const idx = parseInt(btn.dataset.idx);
                const ver = history[idx];
                if (ver && confirm('Restore this version? Current content will be saved as a new version.')) {
                    savePage(currentPageId, ver.title, ver.content, ver.tags || '');
                    displayPage(currentPageId);
                    panel.style.display = 'none';
                }
            });
        }
        panel.style.display = 'block';
    });
}
