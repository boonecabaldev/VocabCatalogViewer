// Load word database
let wordDatabase = {};
let allWords = [];
let uniqueTags = new Set();

// DOM elements
const searchInput = document.getElementById("search-input");
const classFilter = document.getElementById("class-filter");
const typeFilter = document.getElementById("type-filter");
const tagFilter = document.getElementById("tag-filter");
const wordsTable = document
  .getElementById("words-table")
  .getElementsByTagName("tbody")[0];
const wordCountSpan = document.getElementById("word-count");

// --- Model Code ---
const VocabModel = (() => {
    let vocabList = [];

    function loadVocab() {
        // Example: Load from localStorage or hardcoded data
        const data = localStorage.getItem('vocabList');
        vocabList = data ? JSON.parse(data) : [];
    }

    function saveVocab() {
        localStorage.setItem('vocabList', JSON.stringify(vocabList));
    }

    function addWord(word, meaning) {
        vocabList.push({ word, meaning });
        saveVocab();
    }

    function getAllWords() {
        return vocabList;
    }

    function removeWord(index) {
        vocabList.splice(index, 1);
        saveVocab();
    }

    // Expose model methods
    return {
        loadVocab,
        addWord,
        getAllWords,
        removeWord
    };
})();

// Initialize the app
async function init() {
  await loadWordDatabase();
  processAllWords();
  setupClassFilter();
  setupTypeFilter();
  populateTagFilter();
  renderWords(allWords);
  setupEventListeners();
}

// Load word database from JSON file
async function loadWordDatabase() {
  try {
    const response = await fetch(
      chrome.runtime.getURL("data/words-database.json")
    );
    wordDatabase = await response.json();
  } catch (error) {
    console.error("Error loading word database:", error);
  }
}

// Process all words into a single array
// In your processAllWords function:
function processAllWords() {
  allWords = [];
  uniqueTags.clear(); // Reset the Set

  Object.keys(wordDatabase).forEach((category) => {
    const categoryWords = wordDatabase[category];

    Object.keys(categoryWords).forEach((term) => {
      const wordData = categoryWords[term];
      const wordEntry = { term, ...wordData, category };
      allWords.push(wordEntry);

      // Safe tag processing
      if (wordData.tags && Array.isArray(wordData.tags)) {
        wordData.tags.forEach(function (tag) {
          uniqueTags.add(tag);
        });
      }
    });
  });

  wordCountSpan.textContent = allWords.length;
}

// Modify the populateTagFilter function:
function populateTagFilter() {
  const tagFilter = document.getElementById("tag-filter");
  tagFilter.innerHTML = "";

  // Placeholder option
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Tags";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.style.color = "#bbb"; // Set gray color for placeholder
  tagFilter.appendChild(placeholderOption);

  // (all) option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "(all)";
  tagFilter.appendChild(allOption);

  const sortedTags = Array.from(uniqueTags).sort();
  sortedTags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.appendChild(option);
  });

  // Set initial color for placeholder
  tagFilter.style.color = "#bbb";
  tagFilter.selectedIndex = 0;
  tagFilter.value = "";

  tagFilter.addEventListener("change", function () {
    tagFilter.style.color = tagFilter.value === "" ? "#bbb" : "";
  });
}

// Add these variables at the top with the other declarations
let currentString = "(normal)";
let notificationTimeout;

// Add this function to show the notification
function showCopyNotification(text) {
  const notification = document.getElementById("copy-notification");
  notification.textContent = text;
  notification.classList.add("show");

  // Clear any existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  // Hide after 2 seconds
  notificationTimeout = setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
}

// Add this function to handle copying
function handleWordCopy(word, isRightClick = false) {
  if (isRightClick) {
    // Right click resets to (normal)
    currentString = "(normal)";
  } else {
    // Left click appends the word in parentheses
    if (currentString === "(normal)") {
      currentString = `(${word})`;
    } else {
      currentString += `(${word})`;
    }
  }

  // Copy to clipboard
  navigator.clipboard
    .writeText(currentString)
    .then(() => {
      showCopyNotification(currentString);
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}

// Render words to the table
function renderWords(words) {
  wordsTable.innerHTML = "";

  words.forEach((word) => {
    const row = document.createElement("tr");

    // Term with special class for "big" words
    const termCell = document.createElement("td");
    termCell.textContent = word.term;
    if (word.class === "Big") {
      termCell.classList.add("big-word");
    }

    // Definition
    const defCell = document.createElement("td");
    defCell.textContent = word.definition;

    // Class
    const classCell = document.createElement("td");
    classCell.textContent = word.class;

    // Type with color coding
    const typeCell = document.createElement("td");
    typeCell.textContent = word.type;
    typeCell.classList.add(word.type.toLowerCase());

    // Tags
    const tagsCell = document.createElement("td");
    if (word.tags && word.tags.length > 0) {
      word.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.classList.add("tag");
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
    row.addEventListener("click", (e) => {
      if (e.button === 0) {
        // Left click
        handleWordCopy(word.term);
      }
    });

    row.addEventListener("contextmenu", (e) => {
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

  const filteredWords = allWords.filter((word) => {
    // Search term matching (term or definition)
    const matchesSearch =
      word.term.toLowerCase().includes(searchTerm) ||
      word.definition.toLowerCase().includes(searchTerm);

    // Class filter: show all if "" (placeholder) or "all" is selected
    const matchesClass =
      !selectedClass || selectedClass === "all" || word.class === selectedClass;

    // Type filter: show all if "" (placeholder) or "all" is selected
    const matchesType =
      !selectedType || selectedType === "all" || word.type === selectedType;

    // Tag filter: show all if "" (placeholder) or "all" is selected
    const matchesTag =
      !selectedTag ||
      selectedTag === "all" ||
      (word.tags && word.tags.includes(selectedTag));

    return matchesSearch && matchesClass && matchesType && matchesTag;
  });

  renderWords(filteredWords);
}

// Set up event listeners
function setupEventListeners() {
  searchInput.addEventListener("input", filterWords);
  classFilter.addEventListener("change", filterWords);
  typeFilter.addEventListener("change", filterWords);
  tagFilter.addEventListener("change", filterWords);

  // Focus the search input on popup open
  searchInput.focus();
}

// Improve dropdown UX
document.querySelectorAll("select").forEach((select) => {
  select.addEventListener("focus", () => {
    select.style.backgroundColor = "rgba(15, 240, 252, 0.1)";
  });
  select.addEventListener("blur", () => {
    select.style.backgroundColor = "rgba(26, 26, 46, 0.8)";
  });
});

// --- Unit Tests for VocabModel ---
function runVocabModelTests() {
  let passed = 0, failed = 0;

  // Helper to reset localStorage and model
  function reset() {
    localStorage.removeItem('vocabList');
    VocabModel.loadVocab();
  }

  function assertEqual(actual, expected, msg) {
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    if (pass) {
      passed++;
      console.log('✅', msg);
    } else {
      failed++;
      console.error('❌', msg, '\n  Expected:', expected, '\n  Got:', actual);
    }
  }

  // Test: loadVocab with no data
  reset();
  assertEqual(VocabModel.getAllWords(), [], 'Should load empty vocab list if none exists');

  // Test: addWord and persistence
  reset();
  VocabModel.addWord('test', 'a procedure');
  assertEqual(VocabModel.getAllWords().length, 1, 'Should add a word');
  assertEqual(VocabModel.getAllWords()[0], { word: 'test', meaning: 'a procedure' }, 'Should store correct word/meaning');
  // Simulate reload
  VocabModel.loadVocab();
  assertEqual(VocabModel.getAllWords().length, 1, 'Should persist after reload');

  // Test: removeWord
  reset();
  VocabModel.addWord('one', 'first');
  VocabModel.addWord('two', 'second');
  VocabModel.removeWord(0);
  assertEqual(VocabModel.getAllWords().length, 1, 'Should remove a word by index');
  assertEqual(VocabModel.getAllWords()[0].word, 'two', 'Should keep the correct word after removal');

  // Test: remove out-of-bounds
  reset();
  VocabModel.addWord('one', 'first');
  try {
    VocabModel.removeWord(5);
    assertEqual(VocabModel.getAllWords().length, 1, 'Should not throw when removing out-of-bounds index');
  } catch (e) {
    failed++;
    console.error('❌ Should not throw when removing out-of-bounds index', e);
  }

  console.log(`VocabModel tests: ${passed} passed, ${failed} failed.`);
}

// Uncomment to run tests in the browser console
runVocabModelTests();

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", init);

// In your HTML, update the class-filter <select> to match this logic:
// <select id="class-filter">
//   <option value="all" selected>(all)</option>
//   <option value="Normal">Normal</option>
//   <option value="Big">Big</option>
// </select>

// If you want to ensure this is always set up in JS (in case options are dynamic), you can do:
function setupClassFilter() {
  classFilter.innerHTML = "";

  // Placeholder option
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Word Class";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.style.color = "#bbb"; // Set gray color for placeholder
  classFilter.appendChild(placeholderOption);

  // (all) option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "(all)";
  classFilter.appendChild(allOption);

  // Normal option
  const normalOption = document.createElement("option");
  normalOption.value = "Normal";
  normalOption.textContent = "Normal";
  classFilter.appendChild(normalOption);

  // Big option
  const bigOption = document.createElement("option");
  bigOption.value = "Big";
  bigOption.textContent = "Big";
  classFilter.appendChild(bigOption);

  // Set initial color for placeholder
  classFilter.style.color = "#bbb";
  classFilter.selectedIndex = 0;
  classFilter.value = "";

  classFilter.addEventListener("change", function () {
    // Remove gray color when a real value is selected
    classFilter.style.color = classFilter.value === "" ? "#bbb" : "";
  });
}

function setupTypeFilter() {
  typeFilter.innerHTML = "";

  // Placeholder option
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Word Type";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  placeholderOption.style.color = "#bbb"; // Set gray color for placeholder
  typeFilter.appendChild(placeholderOption);

  // (all) option
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "(all)";
  typeFilter.appendChild(allOption);

  // Type options
  ["Positive", "Negative", "Neutral", "Tone"].forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    typeFilter.appendChild(option);
  });

  // Set initial color for placeholder
  typeFilter.style.color = "#bbb";
  typeFilter.selectedIndex = 0;
  typeFilter.value = "";

  typeFilter.addEventListener("change", function () {
    typeFilter.style.color = typeFilter.value === "" ? "#bbb" : "";
  });
}

// Ensure this is called in your init function
async function init() {
  await loadWordDatabase();
  processAllWords();
  setupClassFilter();
  setupTypeFilter();
  populateTagFilter();
  renderWords(allWords);
  setupEventListeners();
}

// Optional: Change text color when user selects a real value
classFilter.addEventListener("change", function () {
  if (classFilter.value === "") {
    classFilter.style.color = "#888";
  } else {
    classFilter.style.color = ""; // Use default text color
  }
});

// Set initial color for placeholder
classFilter.style.color = "#888";
