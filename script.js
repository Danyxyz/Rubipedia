// DOM Elements
const editSection = document.getElementById('editSection');
const displaySection = document.getElementById('displaySection');
const pageTitleInput = document.getElementById('pageTitle');
const pageContentInput = document.getElementById('pageContent');
const generateBtn = document.getElementById('generateBtn');
const savePageBtn = document.getElementById('savePageBtn');
const clearBtn = document.getElementById('clearBtn');
const editBtn = document.getElementById('editBtn');
const deleteBtn = document.getElementById('deleteBtn');
const newPageBtn = document.getElementById('newPageBtn');
const copyBtn = document.getElementById('copyBtn');
const displayTitle = document.getElementById('displayTitle');
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
const importFileInput = document.getElementById('importFileInput');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Current page state
let currentPageId = null;
let isEditingExisting = false;

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
    savePage(pageId, title, content);
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

    savePage(currentPageId, title, content);
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
    savedPagesBox.style.display = savedPagesBox.style.display === 'none' ? 'block' : 'none';
    if (savedPagesBox.style.display === 'block') {
        updateSavedPagesList();
    }
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

// Search functionality
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length === 0) {
        searchResults.style.display = 'none';
        return;
    }
    
    if (query.length < 2) {
        return; // Wait for at least 2 characters
    }
    
    performSearch(query);
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

// ===== PAGE MANAGEMENT FUNCTIONS =====

function generatePageId(title) {
    return 'page_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now();
}

function savePage(pageId, title, content) {
    const page = {
        id: pageId,
        title: title,
        content: content,
        lastEdited: new Date().toISOString()
    };
    
    localStorage.setItem(pageId, JSON.stringify(page));
    
    // Add to pages index
    let pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    if (!pagesIndex.includes(pageId)) {
        pagesIndex.push(pageId);
        localStorage.setItem('rubipedia_pages_index', JSON.stringify(pagesIndex));
    }
}

function loadPage(pageId) {
    const pageData = localStorage.getItem(pageId);
    if (pageData) {
        return JSON.parse(pageData);
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
    
    // Generate table of contents
    generateTableOfContents();
    
    // Update form fields for future editing
    pageTitleInput.value = page.title;
    pageContentInput.value = page.content;
    
    // Switch views
    editSection.style.display = 'none';
    displaySection.style.display = 'block';
    tocBox.style.display = 'block';
    
    // Reset button states
    isEditingExisting = false;
    generateBtn.style.display = 'inline-block';
    savePageBtn.style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createNewPage() {
    // Clear form
    pageTitleInput.value = '';
    pageContentInput.value = '';
    currentPageId = null;
    isEditingExisting = false;
    generateBtn.style.display = 'inline-block';
    savePageBtn.style.display = 'none';
    
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
    
    pagesIndex.slice().reverse().forEach(pageId => {
        const page = loadPage(pageId);
        if (page) {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.textContent = page.title;
            link.addEventListener('click', (e) => {
                e.preventDefault();
                displayPage(pageId);
            });
            li.appendChild(link);
            savedPagesList.appendChild(li);
        }
    });
}

function generateTableOfContents() {
    const headings = displayContent.querySelectorAll('h2, h3');
    tableOfContents.innerHTML = '';
    
    if (headings.length === 0) {
        tocBox.style.display = 'none';
        return;
    }
    
    headings.forEach((heading, index) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        
        // Add ID to heading for anchor linking
        const anchorId = 'heading-' + index;
        heading.id = anchorId;
        
        link.href = '#' + anchorId;
        link.textContent = heading.textContent;
        
        // Indent h3 tags
        if (heading.tagName === 'H3') {
            li.style.marginLeft = '15px';
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

function importPages(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
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
                savePage(newId, page.title, page.content);
                importedCount++;
            });
            
            updateSavedPagesList();
            alert(`Successfully imported ${importedCount} page(s)!`);
            
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

// Parse wiki-style content
function parseWikiContent(text) {
    let html = '';
    const lines = text.split('\n');
    let inList = false;

    for (let line of lines) {
        line = line.trim();

        // Skip empty lines
        if (line === '') {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            html += '<br>';
            continue;
        }

        // Heading level 2 (==)
        if (line.startsWith('== ') && line.endsWith(' ==')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            const heading = line.slice(3, -3);
            html += `<h2>${escapeHtml(heading)}</h2>`;
            continue;
        }

        // Heading level 3 (===)
        if (line.startsWith('=== ') && line.endsWith(' ===')) {
            if (inList) {
                html += '</ul>';
                inList = false;
            }
            const heading = line.slice(4, -4);
            html += `<h3>${escapeHtml(heading)}</h3>`;
            continue;
        }

        // List items
        if (line.startsWith('* ')) {
            if (!inList) {
                html += '<ul>';
                inList = true;
            }
            const item = line.slice(2);
            html += `<li>${formatInlineText(item)}</li>`;
            continue;
        }

        // Regular paragraph
        if (inList) {
            html += '</ul>';
            inList = false;
        }
        html += `<p>${formatInlineText(line)}</p>`;
    }

    // Close any open list
    if (inList) {
        html += '</ul>';
    }

    return html;
}

// Format inline text (bold, italic, links)
function formatInlineText(text) {
    // Bold ('''text''')
    text = text.replace(/'''([^']+)'''/g, '<strong>$1</strong>');
    
    // Italic (''text'')
    text = text.replace(/''([^']+)''/g, '<em>$1</em>');
    
    // Links: [[URL|Text]] or [[URL]]
    text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="$1" target="_blank">$2</a>');
    text = text.replace(/\[\[([^\]]+)\]\]/g, '<a href="$1" target="_blank">$1</a>');
    
    // Simple URLs
    text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Hashtags
    text = text.replace(/#(\w+)/g, '<a href="https://twitter.com/hashtag/$1" target="_blank">#$1</a>');
    
    // @mentions
    text = text.replace(/@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank">@$1</a>');

    return escapeHtml(text)
        .replace(/&lt;strong&gt;/g, '<strong>')
        .replace(/&lt;\/strong&gt;/g, '</strong>')
        .replace(/&lt;em&gt;/g, '<em>')
        .replace(/&lt;\/em&gt;/g, '</em>')
        .replace(/&lt;a href="([^"]+)" target="_blank"&gt;/g, '<a href="$1" target="_blank">')
        .replace(/&lt;\/a&gt;/g, '</a>');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Load on page start
window.addEventListener('DOMContentLoaded', () => {
    updateSavedPagesList();
    
    // Try to load data.json from server (for online hosting)
    loadDataFromServer();
    
    // Load the most recent page if exists
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    if (pagesIndex.length > 0) {
        const lastPageId = pagesIndex[pagesIndex.length - 1];
        displayPage(lastPageId);
        savedPagesBox.style.display = 'block';
    }
});

// Load data from server's data.json file (for online hosting)
function loadDataFromServer() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('No data.json found');
            return response.json();
        })
        .then(data => {
            if (data.pages && data.pages.length > 0) {
                // Only load if local storage is empty or user wants to sync
                const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
                
                if (pagesIndex.length === 0) {
                    // Auto-load if no local data
                    loadServerData(data);
                }
            }
        })
        .catch(error => {
            // Silently fail - data.json is optional
            console.log('No server data.json file found (this is normal for local use)');
        });
}

function loadServerData(data) {
    data.pages.forEach(page => {
        const pageId = generatePageId(page.title);
        savePage(pageId, page.title, page.content);
    });
    updateSavedPagesList();
    
    // Load first page
    const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
    if (pagesIndex.length > 0) {
        displayPage(pagesIndex[0]);
        savedPagesBox.style.display = 'block';
    }
}
