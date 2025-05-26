class VocabCatalogViewerModel {
  constructor() {
    this.wordDatabase = {};
    this.allWords = [];
    this.uniqueTags = new Set();
  }

  async loadWordDatabase() {
    // Not tested here (requires mocking fetch/chrome)
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

module.exports = VocabCatalogViewerModel;