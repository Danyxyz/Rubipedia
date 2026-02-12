# DejaRu Archives - Escape The Matrix

A dark, terminal-style archive for collecting and organizing tweets and insights from @DejaRu22. Matrix-inspired design with cyberpunk aesthetics for truth seekers and those ready to unplug.

## Features

- **Matrix Terminal Theme** - Dark cyberpunk interface with glitch effects
- **Wiki-style Formatting** - Automatic table of contents
- **Multi-page Archives** - Create unlimited decoded transmission logs
- **Export/Import** - Backup and restore all your data
- **Auto-linking** - @mentions, #hashtags, and URLs automatically become links
- **Terminal Aesthetic** - Green-on-black Matrix-inspired design

## How to Use Locally

1. Open `index.html` in your web browser
2. Create archive entries using terminal formatting:
   - `== SECTION_NAME ==` for main headings
   - `=== SUBSECTION ===` for subheadings
   - `* Item` for bullet points
   - `'''bold text'''` for emphasized truth drops
   - `''italic text''` for subtle insights
3. Click "[ TRANSMIT ]" to archive the entry
4. Click "[ NEW ]" to create another entry

## How to Put Online

### Option 1: Export & Manually Update (Simple)

1. Create all your archive entries locally
2. Click "▸ Export.json" in the sidebar
3. Save the JSON file
4. Upload `index.html`, `styles.css`, `script.js` to your web host
5. Rename your exported JSON file to `data.json`
6. Upload `data.json` to the same folder
7. Your archives will automatically load when visitors access the site

### Option 2: Use a Free Hosting Service

**GitHub Pages (Recommended):**
1. Create a GitHub account
2. Create a new repository called "dejaru-archives" or "rubipedia"
3. Upload all files: `index.html`, `styles.css`, `script.js`, `data.json`
4. Go to Settings > Pages
5. Enable GitHub Pages from the main branch
6. Your archives will be live at: `https://yourusername.github.io/dejaru-archives`

**Other free options:**
- Netlify (drag & drop your files)
- Vercel (connect to GitHub)
- Cloudflare Pages

### Updating Your Online Archives

1. Create/edit entries locally
2. Export all archives to JSON
3. Replace `data.json` on your server with the new export
4. Visitors will see the updated decoded transmissions

## File Structure

```
Rubipedia/
├── index.html      # Main terminal interface
├── styles.css      # Matrix theme styling
├── script.js       # All archive functionality
├── data.json       # (Optional) Pre-loaded archives for online hosting
└── README.md       # This file
```

## Storage

- **Local use**: Data archived in browser's localStorage
- **Online use**: Data loaded from `data.json` file
- Export your archives regularly to preserve the truth!

## Terminal Formatting Examples

```
== TRANSMISSION_OVERVIEW ==
@DejaRu22 dropping truth bombs about #RedPill and #EscapeTheMatrix

Key revelations:
* First major truth drop from the thread
* Second awakening message
* '''Critical insight''' that changes everything

=== DEEP_ANALYSIS ===
Further decoding of the hidden messages and patterns.

Follow the source: https://twitter.com/DejaRu22
```

## Theme Features

- **Glitch Effects** on title
- **Scanline Animations** for terminal authenticity
- **Matrix Green** color scheme (#00ff41)
- **Monospace Fonts** for hacker aesthetic
- **Terminal Borders** and cyberpunk styling
- **Hover Effects** with neon glow
- **Dark Background** with subtle grid pattern

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (best experience)
- Firefox
- Safari
- Opera

## Purpose

Archive and decode transmissions from @DejaRu22 - A terminal for truth seekers ready to escape the matrix.

⚡ STAY AWAKE | QUESTION EVERYTHING | DECODE THE TRUTH ⚡

## License

Truth is free for all who seek it.
