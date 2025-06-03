// --- Model ---
class VocabCatalogViewerModel {
  constructor() {
    this.wordDatabase = {};
    this.allWords = [];
    this.uniqueTags = new Set();
  }

  /**
   * Asynchronously loads the word database from a JSON file using the Chrome extension API.
   * 
   * This function fetches the "data/words-database.json" file and populates the `wordDatabase` property
   * with its contents. If loading fails, it logs an error to the console.
   * 
   * Interactions:
   * - Called during application initialization (see `init()`).
   * - After loading, `processAllWords()` should be called to process and flatten the loaded data.
   * - The loaded data is used by other model methods such as `getAllWords()`, `getUniqueTags()`, and `filterWords()`.
   * 
   * @returns {Promise<void>} Resolves when the database is loaded or fails.
   */
  async loadWordDatabase() {
    try {
      const response = await fetch(
        chrome.runtime.getURL("data/words-database.json")
      );
      this.wordDatabase = await response.json();
    } catch (error) {
      console.error("Error loading word database:", error);
    }
  }

  /**
   * Processes and flattens the loaded word database into a single array of word objects.
   *
   * This function iterates through all categories and terms in the `wordDatabase` property,
   * creates a flat array of word entries (each including its category), and populates the
   * `allWords` property. It also collects all unique tags from the words and stores them
   * in the `uniqueTags` set.
   *
   * Interactions:
   * - Should be called after `loadWordDatabase()` to prepare the data for searching and filtering.
   * - The resulting `allWords` array is used by methods like `getAllWords()`, `getUniqueTags()`, and `filterWords()`.
   */
  processAllWords() {
    this.allWords = [];
    this.uniqueTags.clear();

    Object.keys(this.wordDatabase).forEach((category) => {
      const categoryWords = this.wordDatabase[category];
      Object.keys(categoryWords).forEach((term) => {
        const wordData = categoryWords[term];
        const wordEntry = { term, ...wordData, category };
        this.allWords.push(wordEntry);

        if (wordData.tags && Array.isArray(wordData.tags)) {
          wordData.tags.forEach((tag) => this.uniqueTags.add(tag));
        }
      });
    });
  }

  /**
   * Returns a flat array of all word objects in the database.
   *
   * Interactions:
   * - Used by the view to render the list of words.
   * - Used by tests and filtering logic to access all available words.
   *
   * @returns {Array<Object>} Array of word objects.
   */
  getAllWords() {
    return this.allWords;
  }

  /**
   * Returns a sorted array of all unique tags found in the word database.
   *
   * Interactions:
   * - Used by the view to populate the tag filter dropdown.
   * - Used by tests to verify tag extraction.
   *
   * @returns {Array<string>} Sorted array of unique tag strings.
   */
  getUniqueTags() {
    return Array.from(this.uniqueTags).sort();
  }

  /**
   * Filters the list of words based on search term, class, type, and tag.
   *
   * This function checks each word against the provided filter criteria and returns
   * only those that match all filters.
   *
   * Interactions:
   * - Called by the view/controller when the user changes search or filter options.
   * - Used by tests to verify filtering logic.
   *
   * @param {Object} filters - The filter criteria.
   * @param {string} filters.searchTerm - The search term to match in term or definition.
   * @param {string} filters.selectedClass - The selected word class to filter by.
   * @param {string} filters.selectedType - The selected word type to filter by.
   * @param {string} filters.selectedTag - The selected tag to filter by.
   * @returns {Array<Object>} Array of word objects matching the filters.
   */
  filterWords({ searchTerm, selectedClass, selectedType, selectedTag }) {
    return this.allWords.filter((word) => {
      const matchesSearch =
        word.term.toLowerCase().toLowerCase().includes(searchTerm) ||
        word.definition.toLowerCase().includes(searchTerm);

      const matchesClass =
        selectedClass === "all" || word.class === selectedClass;

      const matchesType = selectedType === "all" || word.type === selectedType;

      const matchesTag =
        selectedTag === "all" || (word.tags && word.tags.includes(selectedTag));

      return matchesSearch && matchesClass && matchesType && matchesTag;
    });
  }
}

// --- View ---
class VocabCatalogViewerView {
  /**
   * Constructs the view and initializes references to DOM elements.
   *
   * @param {VocabCatalogViewerModel} model - The model instance to interact with.
   *
   * Interactions:
   * - Stores references to key DOM elements for rendering and event handling.
   * - Used by controller to initialize and render the UI.
   */
  constructor(model) {
    this.model = model;
    // DOM elements
    this.searchInput = document.getElementById("search-input");
    this.classFilter = document.getElementById("class-filter");
    this.typeFilter = document.getElementById("type-filter");
    this.tagFilter = document.getElementById("tag-filter");
    this.wordsTable = document
      .getElementById("words-table")
      .getElementsByTagName("tbody")[0];
    this.wordCountSpan = document.getElementById("word-count");
    this.notification = document.getElementById("copy-notification");
    this.currentString = "(normal)";
    this.notificationTimeout = null;
  }

  /**
   * Populates the class filter dropdown with available word classes.
   *
   * Interactions:
   * - Reads available classes and updates the class filter DOM element.
   * - Called during initialization and when the class filter needs to be refreshed.
   */
  populateClassFilter() {
    this.classFilter.innerHTML = "";

    // Add a dark magenta placeholder as the first option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Word Class";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.style.color = "#8B008B"; // dark magenta
    this.classFilter.appendChild(placeholder);

    // (all) as the first selectable item
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "(all)";
    this.classFilter.appendChild(allOption);

    ["Normal", "Big"].forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls;
      option.textContent = cls;
      this.classFilter.appendChild(option);
    });
  }

  /**
   * Populates the type filter dropdown with available word types.
   *
   * Interactions:
   * - Reads available types and updates the type filter DOM element.
   * - Called during initialization and when the type filter needs to be refreshed.
   */
  populateTypeFilter() {
    this.typeFilter.innerHTML = "";

    // Add a dark magenta placeholder as the first option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Word Type";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.style.color = "#8B008B"; // dark magenta
    this.typeFilter.appendChild(placeholder);

    // (all) as the first selectable item
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "(all)";
    this.typeFilter.appendChild(allOption);

    ["Positive", "Negative", "Neutral", "Tone"].forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      this.typeFilter.appendChild(option);
    });
  }

  /**
   * Populates the tag filter dropdown with unique tags from the model.
   *
   * Interactions:
   * - Calls model.getUniqueTags() to get tags.
   * - Updates the tag filter DOM element.
   * - Called during initialization and when the tag filter needs to be refreshed.
   */
  populateTagFilter() {
    this.tagFilter.innerHTML = "";

    // Add a dark magenta placeholder as the first option
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Tags";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.style.color = "#8B008B"; // dark magenta
    this.tagFilter.appendChild(placeholder);

    // (all) as the first selectable item
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "(all)";
    this.tagFilter.appendChild(allOption);

    this.model.getUniqueTags().forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      this.tagFilter.appendChild(option);
    });
  }

  /**
   * Displays a temporary notification when a word is copied.
   *
   * @param {string} text - The text to display in the notification.
   *
   * Interactions:
   * - Updates the notification DOM element.
   * - Called by handleWordCopy() after copying to clipboard.
   */
  showCopyNotification(text) {
    this.notification.textContent = text;
    this.notification.classList.add("show");
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notification.classList.remove("show");
    }, 2000);
  }

  /**
   * Handles copying a word to the clipboard and updates the notification.
   *
   * @param {string} word - The word to copy.
   * @param {boolean} [isRightClick=false] - Whether the copy was triggered by a right-click.
   *
   * Interactions:
   * - Updates the currentString for clipboard.
   * - Calls showCopyNotification() after copying.
   * - Used as an event handler for word row clicks.
   */
  handleWordCopy(word, isRightClick = false) {
    if (isRightClick) {
      this.currentString = "(normal)";
    } else {
      if (this.currentString === "(normal)") {
        this.currentString = `(${word})`;
      } else {
        this.currentString += `(${word})`;
      }
    }
    navigator.clipboard
      .writeText(this.currentString)
      .then(() => this.showCopyNotification(this.currentString))
      .catch((err) => console.error("Could not copy text: ", err));
  }

  /**
   * Renders the list of words in the table body.
   *
   * @param {Array<Object>} words - The array of word objects to render.
   *
   * Interactions:
   * - Updates the words table DOM element.
   * - Sets up click and contextmenu event listeners for copying.
   * - Updates the word count display.
   */
  renderWords(words) {
    this.wordsTable.innerHTML = "";
    words.forEach((word) => {
      const row = document.createElement("tr");

      const termCell = document.createElement("td");
      termCell.textContent = word.term;
      if (word.class === "Big") termCell.classList.add("big-word");

      const defCell = document.createElement("td");
      defCell.textContent = word.definition;

      const classCell = document.createElement("td");
      classCell.textContent = word.class;

      const typeCell = document.createElement("td");
      typeCell.textContent = word.type;
      typeCell.classList.add(word.type.toLowerCase());

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
      this.wordsTable.appendChild(row);

      row.addEventListener("click", (e) => {
        if (e.button === 0) this.handleWordCopy(word.term);
      });
      row.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.handleWordCopy(word.term, true);
      });
    });
    this.wordCountSpan.textContent = words.length;
  }

  /**
   * Sets up event listeners for search and filter controls.
   *
   * @param {Function} filterCallback - The callback to invoke when a filter changes.
   *
   * Interactions:
   * - Attaches input/change listeners to filter and search elements.
   * - Removes placeholder options on first change.
   * - Focuses the search input on setup.
   */
  setupEventListeners(filterCallback) {
    this.searchInput.addEventListener("input", filterCallback);

    // Remove placeholder on first change for class filter
    this.classFilter.addEventListener("change", function handler(e) {
      if (this.options[0].value === "") {
        this.remove(0);
        this.removeEventListener("change", handler);
      }
      filterCallback();
    });

    // Remove placeholder on first change for type filter
    this.typeFilter.addEventListener("change", function handler(e) {
      if (this.options[0].value === "") {
        this.remove(0);
        this.removeEventListener("change", handler);
      }
      filterCallback();
    });

    // Remove placeholder on first change for tag filter
    this.tagFilter.addEventListener("change", function handler(e) {
      if (this.options[0].value === "") {
        this.remove(0);
        this.removeEventListener("change", handler);
      }
      filterCallback();
    });

    this.searchInput.focus();
  }

  /**
   * Improves the user experience for dropdown filters (focus/blur styling and placeholder removal).
   *
   * Interactions:
   * - Adds focus and blur event listeners to filter dropdowns.
   * - Removes placeholder options and updates styling on focus/blur.
   */
  improveDropdownUX() {
    // Word Class
    this.classFilter.addEventListener("focus", function () {
      if (this.selectedIndex === 0 && this.options[0].value === "") {
        this.selectedIndex = 1; // Select (all)
        this.remove(0); // Remove the placeholder
      }
      this.style.backgroundColor = "rgba(15, 240, 252, 0.1)";
    });
    this.classFilter.addEventListener("blur", function () {
      this.style.backgroundColor = "rgba(26, 26, 46, 0.8)";
    });

    // Word Type
    this.typeFilter.addEventListener("focus", function () {
      if (this.selectedIndex === 0 && this.options[0].value === "") {
        this.selectedIndex = 1; // Select (all)
        this.remove(0); // Remove the placeholder
      }
      this.style.backgroundColor = "rgba(15, 240, 252, 0.1)";
    });
    this.typeFilter.addEventListener("blur", function () {
      this.style.backgroundColor = "rgba(26, 26, 46, 0.8)";
    });

    // Tags
    this.tagFilter.addEventListener("focus", function () {
      if (this.selectedIndex === 0 && this.options[0].value === "") {
        this.selectedIndex = 1; // Select (all)
        this.remove(0); // Remove the placeholder
      }
      this.style.backgroundColor = "rgba(15, 240, 252, 0.1)";
    });
    this.tagFilter.addEventListener("blur", function () {
      this.style.backgroundColor = "rgba(26, 26, 46, 0.8)";
    });
  }
}

// --- Controller / App Initialization ---
const model = new VocabCatalogViewerModel();
let view;

async function init() {
  await model.loadWordDatabase();
  model.processAllWords();
  view = new VocabCatalogViewerView(model);
  view.populateClassFilter();
  view.populateTypeFilter();
  view.populateTagFilter();
  view.renderWords(model.getAllWords());
  view.setupEventListeners(filterWords);
  view.improveDropdownUX();
}

function filterWords() {
  const searchTerm = view.searchInput.value.trim().toLowerCase();
  const selectedClass = view.classFilter.value || "all";
  const selectedType = view.typeFilter.value || "all";
  const selectedTag = view.tagFilter.value || "all";
  const filtered = model.filterWords({
    searchTerm,
    selectedClass,
    selectedType,
    selectedTag,
  });
  view.renderWords(filtered);
}

function filterAndRenderWords() {
  const searchTerm = view.searchInput.value.trim().toLowerCase();
  // Treat empty or placeholder value as "all"
  const selectedClass = view.classFilter.value || "all";
  const selectedType = view.typeFilter.value || "all";
  const selectedTag = view.tagFilter.value || "all";

  const filteredWords = model.filterWords({
    searchTerm,
    selectedClass,
    selectedType,
    selectedTag,
  });
  view.renderWords(filteredWords);
}

document.addEventListener("DOMContentLoaded", init);

// --- Simple Unit Tests for VocabCatalogViewerModel ---

function runVocabCatalogViewerModelTests(logFn = console.log, errorFn = console.error) {
  // Add this function:
  function assertEquals(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      errorFn("❌ " + message + "<br>Expected: " + JSON.stringify(expected) + "<br>Actual: " + JSON.stringify(actual));
    } else {
      logFn("✅ " + message);
    }
  }

  // Mock data
  const mockDB = {
    Animals: {
      Cat: {
        definition: "A small domesticated carnivorous mammal.",
        class: "Normal",
        type: "Neutral",
        tags: ["pet", "mammal"],
      },
      Dog: {
        definition: "A domesticated carnivorous mammal.",
        class: "Big",
        type: "Positive",
        tags: ["pet", "mammal", "friend"],
      },
    },
    Plants: {
      Rose: {
        definition: "A woody perennial flowering plant.",
        class: "Normal",
        type: "Positive",
        tags: ["flower", "thorn"],
      },
    },
  };

  // Setup
  //////////////////////////////////////
  const model = new VocabCatalogViewerModel();
  model.wordDatabase = mockDB;
  model.processAllWords();

  // Test getAllWords
  assertEquals(model.getAllWords().length, 3, "getAllWords returns all words");

  // Test getUniqueTags
  assertEquals(
    model.getUniqueTags(),
    ["flower", "friend", "mammal", "pet", "thorn"],
    "getUniqueTags returns sorted unique tags"
  );

  // Test filterWords: searchTerm
  let filtered = model.filterWords({
    searchTerm: "cat",
    selectedClass: "all",
    selectedType: "all",
    selectedTag: "all",
  });
  assertEquals(filtered.length, 2, "filterWords filters by searchTerm (term)");

  filtered = model.filterWords({
    searchTerm: "carnivorous",
    selectedClass: "all",
    selectedType: "all",
    selectedTag: "all",
  });
  assertEquals(
    filtered.length,
    2,
    "filterWords filters by searchTerm (definition)"
  );

  // Test filterWords: class
  filtered = model.filterWords({
    searchTerm: "",
    selectedClass: "Big",
    selectedType: "all",
    selectedTag: "all",
  });
  assertEquals(
    filtered.map((w) => w.term),
    ["Dog"],
    "filterWords filters by class"
  );

  // Test filterWords: type
  filtered = model.filterWords({
    searchTerm: "",
    selectedClass: "all",
    selectedType: "Positive",
    selectedTag: "all",
  });
  assertEquals(
    filtered.map((w) => w.term).sort(),
    ["Dog", "Rose"],
    "filterWords filters by type"
  );

  // Test filterWords: tag
  filtered = model.filterWords({
    searchTerm: "",
    selectedClass: "all",
    selectedType: "all",
    selectedTag: "mammal",
  });
  assertEquals(
    filtered.map((w) => w.term).sort(),
    ["Cat", "Dog"],
    "filterWords filters by tag"
  );

  // Test filterWords: combined filters
  filtered = model.filterWords({
    searchTerm: "",
    selectedClass: "Normal",
    selectedType: "Positive",
    selectedTag: "flower",
  });
  assertEquals(
    filtered.map((w) => w.term),
    ["Rose"],
    "filterWords filters by combined criteria"
  );
}

// Run tests if in dev mode (or always, for demonstration)
if (typeof window !== "undefined") {
  window.runVocabCatalogViewerModelTests = runVocabCatalogViewerModelTests;
  // Uncomment to run automatically:
  // runVocabCatalogViewerModelTests();
}

runVocabCatalogViewerModelTests();
