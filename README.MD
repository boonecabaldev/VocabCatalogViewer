# Vocab Master - Chrome Extension

![Extension Icon](icons/icon128.png)

A powerful vocabulary management tool that helps you collect, organize, and use words efficiently.

## Features

- **Word Collection**: Easily save words with their definitions
- **Smart Organization**: 
  - Automatic classification (Normal/Big words)
  - Tagging system for custom categories
- **Quick Copy**:
  - Left-click: Append words in parentheses `(word)`
  - Right-click: Reset to `(normal)`
- **Visual Feedback**: Clear copy confirmation overlay
- **Search & Filter**: Find words by term, definition, class, or tags
- **Neon UI**: Sleek dark theme with neon accents

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to:

`chrome://extensions`

3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder

## Usage

1. Click the extension icon to open Vocab Master
2. **Left-click** any word to copy it in parentheses and append to your current string
3. **Right-click** any word to reset your string to `(normal)`
4. Use the search box and filters to find specific words
5. The current copied string appears briefly above the clicked row

## Keyboard Shortcuts

- `Ctrl+Shift+V` (Windows) or `Cmd+Shift+V` (Mac) - Open extension popup

## Data Structure

Words are stored in `data/words-database.json` with this format:
```json
{
"category": {
 "term": {
   "definition": "...",
   "class": "Normal|Big",
   "type": "Positive|Negative|Neutral|Tone",
   "tags": ["tag1", "tag2"]
 }
}
```

## Customization

Edit these files to customize:
- `popup.css` - Visual styling
- `popup.html` - Interface structure
- `data/words-database.json` - Your vocabulary database

---