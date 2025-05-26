// --- Model ---
class VocabCatalogViewerModel {
  constructor() {
    this.wordDatabase = {};
    this.allWords = [];
    this.uniqueTags = new Set();
  }

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

  getAllWords() {
    return this.allWords;
  }

  getUniqueTags() {
    return Array.from(this.uniqueTags).sort();
  }

  filterWords({ searchTerm, selectedClass, selectedType, selectedTag }) {
    return this.allWords.filter((word) => {
      const matchesSearch =
        word.term.toLowerCase().includes(searchTerm) ||
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

  showCopyNotification(text) {
    this.notification.textContent = text;
    this.notification.classList.add("show");
    if (this.notificationTimeout) clearTimeout(this.notificationTimeout);
    this.notificationTimeout = setTimeout(() => {
      this.notification.classList.remove("show");
    }, 2000);
  }

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