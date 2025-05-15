// Load word database
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
  }
}

// Process all words into a single array
// In your processAllWords function:
function processAllWords() {
  allWords = [];
  uniqueTags.clear(); // Reset the Set

  Object.keys(wordDatabase).forEach(category => {
    const categoryWords = wordDatabase[category];
    
    Object.keys(categoryWords).forEach(term => {
      const wordData = categoryWords[term];
      const wordEntry = { term, ...wordData, category };
      allWords.push(wordEntry);
      
      // Safe tag processing
      if (wordData.tags && Array.isArray(wordData.tags)) {
        wordData.tags.forEach(function(tag) {
          uniqueTags.add(tag);
        });
      }
    });
  });

  wordCountSpan.textContent = allWords.length;
}

// Modify the populateTagFilter function:
function populateTagFilter() {
  const tagFilter = document.getElementById('tag-filter');
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

// Add these variables at the top with the other declarations
let currentString = '(normal)';
let notificationTimeout;

// Add this function to show the notification
function showCopyNotification(text) {
  const notification = document.getElementById('copy-notification');
  notification.textContent = text;
  notification.classList.add('show');
  
  // Clear any existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  
  // Hide after 2 seconds
  notificationTimeout = setTimeout(() => {
    notification.classList.remove('show');
  }, 2000);
}

// Add this function to handle copying
function handleWordCopy(word, isRightClick = false) {
  if (isRightClick) {
    // Right click resets to (normal)
    currentString = '(normal)';
  } else {
    // Left click appends the word in parentheses
    if (currentString === '(normal)') {
      currentString = `(${word})`;
    } else {
      currentString += `(${word})`;
    }
  }
  
  // Copy to clipboard
  navigator.clipboard.writeText(currentString)
    .then(() => {
      showCopyNotification(currentString);
    })
    .catch(err => {
      console.error('Could not copy text: ', err);
    });
}

// Render words to the table
function renderWords(words) {
  wordsTable.innerHTML = '';
  
  words.forEach(word => {
    const row = document.createElement('tr');
    
    // Term with special class for "big" words
    const termCell = document.createElement('td');
    termCell.textContent = word.term;
    if (word.class === 'Big') {
      termCell.classList.add('big-word');
    }
    
    // Definition
    const defCell = document.createElement('td');
    defCell.textContent = word.definition;
    
    // Class
    const classCell = document.createElement('td');
    classCell.textContent = word.class;
    
    // Type with color coding
    const typeCell = document.createElement('td');
    typeCell.textContent = word.type;
    typeCell.classList.add(word.type.toLowerCase());
    
    // Tags
    const tagsCell = document.createElement('td');
    if (word.tags && word.tags.length > 0) {
      word.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('tag');
        tagSpan.textContent = tag;
        tagsCell.appendChild(tagSpan);
      });
    }
    
    row.appendChild(termCell);
    row.appendChild(defCell);
    row.appendChild(classCell);
    row.appendChild(typeCell);
    row.appendChild(tagsCell);
    wordsTable.appendChild(row);
    
    // Add click handlers
    row.addEventListener('click', (e) => {
      if (e.button === 0) { // Left click
        handleWordCopy(word.term);
      }
    });
    
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault(); // Prevent the context menu from appearing
      handleWordCopy(word.term, true);
    });
  });
  
  wordCountSpan.textContent = words.length;
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
}

// Improve dropdown UX
document.querySelectorAll('select').forEach(select => {
  select.addEventListener('focus', () => {
    select.style.backgroundColor = 'rgba(15, 240, 252, 0.1)';
  });
  select.addEventListener('blur', () => {
    select.style.backgroundColor = 'rgba(26, 26, 46, 0.8)';
  });
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);