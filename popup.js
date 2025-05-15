// Global variables
let wordDatabase = {};
let allWords = [];
let uniqueTags = new Set();

// DOM elements
const searchInput = document.getElementById('search-input');
const classFilter = document.getElementById('class-filter');
const typeFilter = document.getElementById('type-filter');
const tagFilter = document.getElementById('tag-filter');
const wordsTable = document.getElementById('words-table').getElementsByTagName('tbody')[0];
const wordCountSpan = document.getElementById('word-count');

// Initialize the app
async function init() {
  await loadWordDatabase();
  processAllWords();
  populateTagFilter();
  renderWords(allWords);
  setupEventListeners();
}

// Load word database from JSON file
async function loadWordDatabase() {
  try {
    const response = await fetch(chrome.runtime.getURL('data/words-database.json'));
    wordDatabase = await response.json();
  } catch (error) {
    console.error('Error loading word database:', error);
    // Fallback to chrome.storage if available
    const result = await chrome.storage.local.get(['wordDatabase']);
    wordDatabase = result.wordDatabase || {};
  }
}

// Process all words into a single array
function processAllWords() {
  allWords = [];
  uniqueTags.clear();

  Object.keys(wordDatabase).forEach(category => {
    Object.entries(wordDatabase[category]).forEach(([term, data]) => {
      const wordEntry = { term, ...data, category };
      allWords.push(wordEntry);
      
      if (data.tags) {
        data.tags.forEach(function(tag) {
          uniqueTags.add(tag);
        });
      }
    });
  });
}

// Populate tag filter dropdown
function populateTagFilter() {
  tagFilter.innerHTML = '';
  
  const placeholderOption = document.createElement('option');
  placeholderOption.value = 'all';
  placeholderOption.textContent = 'Tags';
  placeholderOption.selected = true;
  placeholderOption.disabled = true;
  tagFilter.appendChild(placeholderOption);
  
  const sortedTags = Array.from(uniqueTags).sort();
  sortedTags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });
}

// Render words to the table
// In popup.js
function renderWords(words) {
  let html = '';
  words.forEach(word => {
    html += `
    <tr>
      <td class="${word.class === 'Big' ? 'big-word' : ''}">${word.term}</td>
      <td>${word.definition}</td>
      <td>${word.class}</td>
      <td class="${word.type.toLowerCase()}">${word.type}</td>
      <td>${word.tags?.map(t => `<span class="tag">${t}</span>`).join('') || ''}</td>
    </tr>`;
  });
  wordsTable.innerHTML = html;
}

// Filter words based on current filters
function filterWords() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedClass = classFilter.value;
  const selectedType = typeFilter.value;
  const selectedTag = tagFilter.value;
  
  const filteredWords = allWords.filter(word => {
    // Search term matching (term or definition)
    const matchesSearch = 
      word.term.toLowerCase().includes(searchTerm) || 
      word.definition.toLowerCase().includes(searchTerm);
    
    // Class filter
    const matchesClass = 
      selectedClass === 'all' || 
      word.class === selectedClass;
    
    // Type filter
    const matchesType = 
      selectedType === 'all' || 
      word.type === selectedType;
    
    // Tag filter
    const matchesTag = 
      selectedTag === 'all' || 
      (word.tags && word.tags.includes(selectedTag));
    
    return matchesSearch && matchesClass && matchesType && matchesTag;
  });
  
  renderWords(filteredWords);
}

// Set up event listeners
function setupEventListeners() {
  searchInput.addEventListener('input', filterWords);
  classFilter.addEventListener('change', filterWords);
  typeFilter.addEventListener('change', filterWords);
  tagFilter.addEventListener('change', filterWords);
  
  // Focus the search input on popup open
  searchInput.focus();
  
  // Improve dropdown UX
  document.querySelectorAll('select').forEach(select => {
    select.addEventListener('focus', () => {
      select.style.backgroundColor = 'rgba(15, 240, 252, 0.1)';
    });
    select.addEventListener('blur', () => {
      select.style.backgroundColor = 'rgba(26, 26, 46, 0.8)';
    });
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);