// Load word database
let wordDatabase = {};
let allWords = [];
let uniqueTags = new Set();
let copiedWords = ''; // Stores the current copied words string

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
function processAllWords() {
  allWords = [];
  uniqueTags.clear();

  Object.keys(wordDatabase).forEach(category => {
    const categoryWords = wordDatabase[category];
    
    Object.keys(categoryWords).forEach(term => {
      const wordData = categoryWords[term];
      const wordEntry = { term, ...wordData, category };
      allWords.push(wordEntry);
      
      if (wordData.tags && Array.isArray(wordData.tags)) {
        wordData.tags.forEach(tag => {
          uniqueTags.add(tag);
        });
      }
    });
  });

  wordCountSpan.textContent = allWords.length;
}

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

    // Add click event listeners
    row.addEventListener('click', (e) => handleRowClick(e, word.term, false));
    row.addEventListener('contextmenu', (e) => handleRowClick(e, word.term, true));
  });
  
  wordCountSpan.textContent = words.length;
}

// Handle row clicks
function handleRowClick(event, term, isRightClick) {
  event.preventDefault();
  
  // Remove any existing feedback elements
  document.querySelectorAll('.copy-feedback').forEach(el => el.remove());
  
  if (isRightClick) {
    // Right click - always set to '(normal)'
    copiedWords = '(normal)';
  } else {
    // Left click - if current value is '(normal)', start fresh
    if (copiedWords === '(normal)') {
      copiedWords = `(${term})`;
    } else {
      // Otherwise append to existing string
      copiedWords = copiedWords === '' ? `(${term})` : copiedWords + `(${term})`;
    }
  }
  
  // Create feedback element
  const feedback = document.createElement('div');
  feedback.className = 'copy-feedback';
  feedback.textContent = `${copiedWords}`;
  
  // Position it over the clicked row
  const row = event.currentTarget;
  const rowRect = row.getBoundingClientRect();
  
  feedback.style.position = 'absolute';
  feedback.style.left = '0';
  feedback.style.right = '0';
  feedback.style.top = `${rowRect.top}px`;
  feedback.style.height = `${rowRect.height}px`;
  feedback.style.lineHeight = `${rowRect.height}px`;
  feedback.style.backgroundColor = isRightClick ? 'rgba(255, 165, 0, 0.9)' 
    : 'rgba(15, 240, 252, 0.9)';
  feedback.style.color = '#1a1a2e';
  feedback.style.fontSize = '14px';
  feedback.style.fontWeight = 'bold';
  feedback.style.textAlign = 'center';
  feedback.style.zIndex = '1000';
  feedback.style.borderRadius = '4px';
  feedback.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  feedback.style.animation = 'fadeInOut 2.5s forwards';
  
  document.body.appendChild(feedback);
  
  // Copy to clipboard
  navigator.clipboard.writeText(copiedWords)
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
  
  // Remove feedback after animation
  setTimeout(() => {
    feedback.remove();
  }, 2500);
}

// Add fade animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateY(10px); }
    20% { opacity: 1; transform: translateY(0); }
    80% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);

// Filter words based on current filters
function filterWords() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedClass = classFilter.value;
  const selectedType = typeFilter.value;
  const selectedTag = tagFilter.value;
  
  const filteredWords = allWords.filter(word => {
    const matchesSearch = 
      word.term.toLowerCase().includes(searchTerm) || 
      word.definition.toLowerCase().includes(searchTerm);
    
    const matchesClass = 
      selectedClass === 'all' || 
      word.class === selectedClass;
    
    const matchesType = 
      selectedType === 'all' || 
      word.type === selectedType;
    
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