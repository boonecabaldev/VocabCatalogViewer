const VocabCatalogViewerModel = require('../VocabCatalogViewerModel');

describe('VocabCatalogViewerModel', () => {
  let model;

  beforeEach(() => {
    model = new VocabCatalogViewerModel();
    // Mock wordDatabase structure
    model.wordDatabase = {
      Animals: {
        Cat: { definition: 'A small domesticated carnivorous mammal', class: 'Normal', type: 'Neutral', tags: ['pet', 'furry'] },
        Dog: { definition: 'A domesticated carnivorous mammal', class: 'Big', type: 'Positive', tags: ['pet', 'loyal'] }
      },
      Plants: {
        Rose: { definition: 'A woody perennial flowering plant', class: 'Normal', type: 'Positive', tags: ['flower', 'thorny'] }
      }
    };
    model.processAllWords();
  });

  it('should process all words and collect unique tags', () => {
    expect(model.allWords.length).toBe(3);
    expect(model.getUniqueTags().sort()).toEqual(['flower', 'furry', 'loyal', 'pet', 'thorny']);
  });

  it('should return all words', () => {
    const all = model.getAllWords();
    expect(all.length).toBe(3);
    const terms = all.map(w => w.term);
    expect(terms).toContain('Cat');
    expect(terms).toContain('Dog');
    expect(terms).toContain('Rose');
  });

  it('should filter words by searchTerm', () => {
    const filtered = model.filterWords({ searchTerm: 'cat', selectedClass: 'all', selectedType: 'all', selectedTag: 'all' });
    expect(filtered.length).toBe(2);
    const terms = filtered.map(w => w.term);
    expect(terms).toContain('Cat');
    expect(terms).toContain('Dog');
  });

  it('should filter words by definition search', () => {
    const filtered = model.filterWords({ searchTerm: 'flowering', selectedClass: 'all', selectedType: 'all', selectedTag: 'all' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].term).toBe('Rose');
  });

  it('should filter words by class', () => {
    const filtered = model.filterWords({ searchTerm: '', selectedClass: 'Big', selectedType: 'all', selectedTag: 'all' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].term).toBe('Dog');
  });

  it('should filter words by type', () => {
    const filtered = model.filterWords({ searchTerm: '', selectedClass: 'all', selectedType: 'Positive', selectedTag: 'all' });
    expect(filtered.length).toBe(2);
    const terms = filtered.map(w => w.term);
    expect(terms).toContain('Dog');
    expect(terms).toContain('Rose');
  });

  it('should filter words by tag', () => {
    const filtered = model.filterWords({ searchTerm: '', selectedClass: 'all', selectedType: 'all', selectedTag: 'pet' });
    expect(filtered.length).toBe(2);
    const terms = filtered.map(w => w.term);
    expect(terms).toContain('Cat');
    expect(terms).toContain('Dog');
  });

  it('should return empty array if no match', () => {
    const filtered = model.filterWords({ searchTerm: 'unicorn', selectedClass: 'all', selectedType: 'all', selectedTag: 'all' });
    expect(filtered.length).toBe(0);
  });

  it('should handle missing tags gracefully', () => {
    model.wordDatabase = {
      Misc: {
        Rock: { definition: 'A hard mineral', class: 'Normal', type: 'Neutral' }
      }
    };
    model.processAllWords();
    expect(model.getUniqueTags()).toEqual([]);
    const filtered = model.filterWords({ searchTerm: '', selectedClass: 'all', selectedType: 'all', selectedTag: 'all' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].term).toBe('Rock');
  });
});