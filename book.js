// DOM Elements
const pageLeft = document.getElementById('pageLeft');
const pageRight = document.getElementById('pageRight');
const leftPageBody = document.getElementById('leftPageBody');
const rightPageBody = document.getElementById('rightPageBody');
const leftPageNumber = document.getElementById('leftPageNumber');
const rightPageNumber = document.getElementById('rightPageNumber');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentPageSpan = document.getElementById('currentPageSpan');
const totalPagesSpan = document.getElementById('totalPagesSpan');
const chapterList = document.getElementById('chapterList');
const chapterSidebar = document.getElementById('chapterSidebar');
const loadingMessage = document.getElementById('loadingMessage');
const emptyMessage = document.getElementById('emptyMessage');
const bookWrapper = document.getElementById('bookWrapper');

// State
let pages = [];
let currentPageIndex = 0;
let allContent = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadContent();
});

// Load content from localStorage
function loadContent() {
    try {
        // Get pages index from localStorage
        const pagesIndex = JSON.parse(localStorage.getItem('rubipedia_pages_index') || '[]');
        
        if (pagesIndex.length === 0) {
            showEmptyState();
            return;
        }

        // Load all pages from localStorage
        allContent = [];
        pagesIndex.forEach(pageId => {
            const pageData = localStorage.getItem(pageId);
            if (pageData) {
                const page = JSON.parse(pageData);
                allContent.push(page);
            }
        });

        if (allContent.length === 0) {
            showEmptyState();
            return;
        }

        processContent();
        renderChapterList();
        displayPages();
        updateControls();
        hideLoading();
    } catch (error) {
        console.error('Error loading content:', error);
        showEmptyState();
    }
}

// Show empty state
function showEmptyState() {
    loadingMessage.style.display = 'none';
    emptyMessage.style.display = 'block';
    bookWrapper.style.display = 'none';
    chapterSidebar.style.display = 'none';
}

// Hide loading
function hideLoading() {
    loadingMessage.style.display = 'none';
    emptyMessage.style.display = 'none';
    bookWrapper.style.display = 'block';
    chapterSidebar.style.display = 'block';
}

// Process content into pages
function processContent() {
    pages = [];
    
    allContent.forEach((item, index) => {
        const content = parseWikiText(item.content);
        
        // Split long content into multiple pages if needed
        const contentPages = splitContentIntoPages(content, item.title, index);
        pages.push(...contentPages);
    });
}

// Estimate how many "lines" an HTML element occupies on the page
function getElementLineWeight(el) {
    const AVG_CHARS_PER_LINE = 38;
    const tag = el.tagName;
    if (tag === 'H1') return 4;
    if (tag === 'H2') return 3.5;
    if (tag === 'H3') return 3;
    if (tag === 'H4') return 2.5;
    if (tag === 'BLOCKQUOTE') return Math.max(3, el.textContent.length / AVG_CHARS_PER_LINE) + 2;
    if (tag === 'UL' || tag === 'OL') {
        const items = el.querySelectorAll('li').length;
        return items * 1.6 + 1;
    }
    if (tag === 'TABLE') {
        const rows = el.querySelectorAll('tr').length;
        return rows * 2.2 + 2;
    }
    if (tag === 'DIV') {
        const table = el.querySelector('table');
        if (table) {
            const rows = table.querySelectorAll('tr').length;
            return rows * 2.2 + 3;
        }
        return 2;
    }
    if (tag === 'HR') return 2;
    // P and everything else — based on character count
    return Math.max(1, el.textContent.length / AVG_CHARS_PER_LINE) + 0.5;
}

// Split parsed HTML content into book pages based on visual line budget
function splitContentIntoPages(htmlContent, title, chapterIndex) {
    const MAX_LINES = 15; // conservative lines-per-page budget

    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    const elements = Array.from(temp.children);

    if (elements.length === 0) {
        return [{ title, content: htmlContent, chapterIndex, isFirstPage: true }];
    }

    const resultPages = [];
    let batch = [];
    let lineCount = 0;
    let isFirstPage = true;

    const flush = () => {
        resultPages.push({
            title,
            content: batch.map(e => e.outerHTML).join(''),
            chapterIndex,
            isFirstPage
        });
        batch = [];
        lineCount = 0;
        isFirstPage = false;
    };

    for (const el of elements) {
        const weight = getElementLineWeight(el);
        // Force page break before a major heading when the page already has content
        const isMajorHeading = el.tagName === 'H2';
        if (isMajorHeading && batch.length > 0 && lineCount > MAX_LINES * 0.35) {
            flush();
        }
        // Split when budget exceeded
        if (lineCount + weight > MAX_LINES && batch.length > 0) {
            flush();
        }
        batch.push(el);
        lineCount += weight;
    }

    if (batch.length > 0) flush();

    return resultPages;
}

// Apply inline Markdown/Wiki formatting to a text string
function inlineFormat(text) {
    // Bold-italic
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    // Bold
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic (single asterisk, not at start of line which would be a list)
    text = text.replace(/(?<![*])\*(?!\*)(.+?)(?<![*])\*(?!\*)/g, '<em>$1</em>');
    // Wiki bold
    text = text.replace(/'''(.+?)'''/g, '<strong>$1</strong>');
    // Wiki italic
    text = text.replace(/''(.+?)''/g, '<em>$1</em>');
    // Wiki links [[Target|Display]] and [[Target]]
    text = text.replace(/\[\[(.+?)\|(.+?)\]\]/g, '<a href="#">$2</a>');
    text = text.replace(/\[\[(.+?)\]\]/g, '<a href="#">$1</a>');
    // External links [url text]
    text = text.replace(/\[([^\s\]]+)\s+([^\]]+)\]/g, '<a href="$1" target="_blank" rel="noopener">$2</a>');
    return text;
}

// Parse a set of Markdown table lines into an HTML table element
function parseMarkdownTable(lines) {
    // Remove separator rows like |---|---|
    const dataLines = lines.filter(l => !/^\|[\s\-|:]+\|?\s*$/.test(l.trim()));
    if (dataLines.length === 0) return '';

    const parseRow = (line) => {
        return line.split('|')
            .slice(1, -1)  // remove leading/trailing empty strings from | delimiters
            .map(cell => cell.trim());
    };

    const [headerLine, ...bodyLines] = dataLines;
    const headerCells = parseRow(headerLine);
    const thead = `<thead><tr>${headerCells.map(c => `<th>${inlineFormat(c)}</th>`).join('')}</tr></thead>`;
    const tbody = bodyLines.map(line => {
        const cells = parseRow(line);
        return `<tr>${cells.map(c => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`;
    }).join('');

    return `<div class="table-container"><table class="wisdom-table">${thead}<tbody>${tbody}</tbody></table></div>`;
}

// Parse MediaWiki-style table  {| ... |} into HTML
function parseWikiTable(text) {
    const lines = text.split('\n');
    const rows = [];
    let currentRow = [];
    let isHeader = false;

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('{|') || line.startsWith('|}') || line === '') return;
        if (line.startsWith('|+') || line.startsWith('|-')) {
            if (currentRow.length > 0) {
                rows.push({ cells: currentRow, isHeader });
                currentRow = [];
            }
            isHeader = false;
            return;
        }
        if (line.startsWith('!')) {
            isHeader = true;
            const cells = line.substring(1).split('!!').map(c => c.trim());
            cells.forEach(c => currentRow.push(c));
            return;
        }
        if (line.startsWith('|')) {
            const cells = line.substring(1).split('||').map(c => c.trim());
            cells.forEach(c => currentRow.push(c));
        }
    });
    if (currentRow.length > 0) rows.push({ cells: currentRow, isHeader });

    if (rows.length === 0) return '';

    const thead = rows.filter(r => r.isHeader).map(r =>
        `<tr>${r.cells.map(c => `<th>${inlineFormat(c)}</th>`).join('')}</tr>`
    ).join('');
    const tbody = rows.filter(r => !r.isHeader).map(r =>
        `<tr>${r.cells.map(c => `<td>${inlineFormat(c)}</td>`).join('')}</tr>`
    ).join('');

    return `<div class="table-container"><table class="wisdom-table">${thead ? `<thead>${thead}</thead>` : ''}<tbody>${tbody}</tbody></table></div>`;
}

// Parse Markdown + Wiki-style text to HTML
function parseWikiText(text) {
    if (!text) return '';

    const lines = text.split('\n');
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines (used as block separators)
        if (trimmed === '') { i++; continue; }

        // MediaWiki table {| ... |}
        if (trimmed.startsWith('{|')) {
            const tableLines = [];
            while (i < lines.length && !lines[i].trim().startsWith('|}')) {
                tableLines.push(lines[i]);
                i++;
            }
            if (i < lines.length) { tableLines.push(lines[i]); i++; }
            blocks.push(parseWikiTable(tableLines.join('\n')));
            continue;
        }

        // Markdown table (line starts with |)
        if (trimmed.startsWith('|')) {
            const tableLines = [];
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                tableLines.push(lines[i]);
                i++;
            }
            blocks.push(parseMarkdownTable(tableLines));
            continue;
        }

        // Horizontal rule --- or *** or ===
        if (/^[-*=]{3,}$/.test(trimmed)) {
            blocks.push('<div class="page-divider">✦ ⋆ ☆ ⋆ ✦</div>');
            i++;
            continue;
        }

        // ATX headings (Markdown-style)
        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = Math.min(headingMatch[1].length + 1, 4); // # → h2, ## → h2, ### → h3, #### → h4
            const tag = level <= 2 ? 'h2' : level === 3 ? 'h3' : 'h4';
            blocks.push(`<${tag}>${inlineFormat(headingMatch[2].trim())}</${tag}>`);
            i++;
            continue;
        }

        // Wiki-style headings === and ==
        const wikiH3 = trimmed.match(/^===\s*(.+?)\s*===$/);
        if (wikiH3) { blocks.push(`<h3>${inlineFormat(wikiH3[1])}</h3>`); i++; continue; }
        const wikiH2 = trimmed.match(/^==\s*(.+?)\s*==$/);
        if (wikiH2) { blocks.push(`<h2>${inlineFormat(wikiH2[1])}</h2>`); i++; continue; }

        // Blockquote > ...
        if (trimmed.startsWith('> ')) {
            const quoteLines = [];
            while (i < lines.length && lines[i].trim().startsWith('> ')) {
                quoteLines.push(lines[i].trim().substring(2));
                i++;
            }
            blocks.push(`<blockquote><p>${inlineFormat(quoteLines.join(' '))}</p></blockquote>`);
            continue;
        }

        // Unordered list * item
        if (/^\*\s/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^\*\s/.test(lines[i].trim())) {
                items.push(`<li>${inlineFormat(lines[i].trim().substring(2))}</li>`);
                i++;
            }
            blocks.push(`<ul>${items.join('')}</ul>`);
            continue;
        }

        // Numbered list 1. item
        if (/^\d+\.\s/.test(trimmed)) {
            const items = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                items.push(`<li>${inlineFormat(lines[i].trim().replace(/^\d+\.\s/, ''))}</li>`);
                i++;
            }
            blocks.push(`<ol>${items.join('')}</ol>`);
            continue;
        }

        // Paragraph — accumulate consecutive non-special lines
        const paraLines = [];
        while (i < lines.length) {
            const t = lines[i].trim();
            if (t === '') break;
            if (t.startsWith('#') || t.startsWith('|') || t.startsWith('{|') ||
                t.startsWith('> ') || /^\*\s/.test(t) || /^\d+\.\s/.test(t) ||
                /^[-*=]{3,}$/.test(t) || /^={2,}/.test(t)) break;
            paraLines.push(t);
            i++;
        }
        if (paraLines.length > 0) {
            blocks.push(`<p>${inlineFormat(paraLines.join(' '))}</p>`);
        } else {
            // Safety: if nothing was consumed, advance past the unrecognised line
            i++;
        }
    }

    return blocks.join('\n');
}

// Render chapter list in sidebar
function renderChapterList() {
    chapterList.innerHTML = '';
    
    allContent.forEach((item, index) => {
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item';
        if (index === 0) chapterItem.classList.add('active');
        
        chapterItem.innerHTML = `
            <span class="chapter-number">${romanNumeral(index + 1)}.</span>
            <span class="chapter-title">${truncateText(item.title, 40)}</span>
        `;
        
        chapterItem.addEventListener('click', () => {
            goToChapter(index);
        });
        
        chapterList.appendChild(chapterItem);
    });
}

// Go to specific chapter
function goToChapter(chapterIndex) {
    // Find the first page of this chapter
    const pageIndex = pages.findIndex(p => p.chapterIndex === chapterIndex);
    if (pageIndex !== -1) {
        currentPageIndex = Math.floor(pageIndex / 2) * 2; // Ensure even page index for double-page view
        displayPages();
        updateControls();
        updateActiveChapter();
    }
}

// Update active chapter in sidebar
function updateActiveChapter() {
    const currentChapter = pages[currentPageIndex]?.chapterIndex;
    const chapterItems = document.querySelectorAll('.chapter-item');
    
    chapterItems.forEach((item, index) => {
        if (index === currentChapter) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Display current pages
function displayPages() {
    function renderPage(bodyEl, numberEl, page, pageNum) {
        const titleHtml = page.isFirstPage
            ? `<h1 class="chapter-title">${page.title}</h1>`
            : `<div class="chapter-continuation">— ${page.title}, cont. —</div>`;
        bodyEl.innerHTML = titleHtml + page.content;
        bodyEl.classList.toggle('first-chapter-page', !!page.isFirstPage);
        numberEl.textContent = pageNum;
    }

    // Left page
    if (currentPageIndex < pages.length) {
        renderPage(leftPageBody, leftPageNumber, pages[currentPageIndex], currentPageIndex + 1);
        pageLeft.style.display = 'block';
    } else {
        pageLeft.style.display = 'none';
    }

    // Right page
    if (currentPageIndex + 1 < pages.length) {
        renderPage(rightPageBody, rightPageNumber, pages[currentPageIndex + 1], currentPageIndex + 2);
        pageRight.style.display = 'block';
    } else {
        rightPageBody.innerHTML = '<p class="end-of-book">~ Finis ~</p>';
        rightPageBody.classList.remove('first-chapter-page');
        rightPageNumber.textContent = '';
        pageRight.style.display = 'block';
    }

    // Update page indicator
    const displayStart = currentPageIndex + 1;
    const displayEnd = Math.min(currentPageIndex + 2, pages.length);
    currentPageSpan.textContent = pages.length > 1 ? `${displayStart}-${displayEnd}` : displayStart;
}

// Update control buttons
function updateControls() {
    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex >= pages.length - 1;
    totalPagesSpan.textContent = pages.length;
    updateActiveChapter();
}

// Previous page
prevBtn.addEventListener('click', () => {
    if (currentPageIndex > 0) {
        currentPageIndex = Math.max(0, currentPageIndex - 2);
        displayPages();
        updateControls();
    }
});

// Next page
nextBtn.addEventListener('click', () => {
    if (currentPageIndex < pages.length - 1) {
        currentPageIndex = Math.min(pages.length - 1, currentPageIndex + 2);
        displayPages();
        updateControls();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevBtn.click();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextBtn.click();
    }
});

// Helper: Convert to Roman numerals
function romanNumeral(num) {
    const romanNumerals = [
        { value: 1000, numeral: 'M' },
        { value: 900, numeral: 'CM' },
        { value: 500, numeral: 'D' },
        { value: 400, numeral: 'CD' },
        { value: 100, numeral: 'C' },
        { value: 90, numeral: 'XC' },
        { value: 50, numeral: 'L' },
        { value: 40, numeral: 'XL' },
        { value: 10, numeral: 'X' },
        { value: 9, numeral: 'IX' },
        { value: 5, numeral: 'V' },
        { value: 4, numeral: 'IV' },
        { value: 1, numeral: 'I' }
    ];
    
    let result = '';
    for (let i = 0; i < romanNumerals.length; i++) {
        while (num >= romanNumerals[i].value) {
            result += romanNumerals[i].numeral;
            num -= romanNumerals[i].value;
        }
    }
    return result;
}

// Helper: Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Add page turn animation effect
function animatePageTurn(direction) {
    const book = document.getElementById('book');
    book.style.transform = direction === 'next' ? 'rotateY(-5deg)' : 'rotateY(5deg)';
    
    setTimeout(() => {
        book.style.transform = 'rotateY(0deg)';
    }, 300);
}

// Enhance navigation with animation
const originalNextClick = nextBtn.onclick;
nextBtn.addEventListener('click', () => {
    animatePageTurn('next');
});

const originalPrevClick = prevBtn.onclick;
prevBtn.addEventListener('click', () => {
    animatePageTurn('prev');
});
