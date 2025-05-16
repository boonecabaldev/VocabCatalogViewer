# Vocab Master

**Vocab Master** is a browser extension for quickly searching, filtering, and copying vocabulary terms from a customizable word database. Designed for writers, editors, and language enthusiasts, it provides a fast and visually appealing way to browse and manage vocabulary lists.

## Features

- 🔍 **Instant Search:** Search words and definitions as you type.
- 🏷️ **Filter by Class, Type, and Tags:** Narrow down results using dropdown filters.
- 📋 **Quick Copy:** Click a word to copy it (or a sequence) in a special format.
- ✨ **Beautiful UI:** Neon-inspired, responsive design with dark mode.
- 📊 **Word Count:** See the total number of words in your database.
- 🏷️ **Dynamic Tags:** Tags are generated from your word data.
- 💡 **Customizable Database:** Easily update or expand your word list via a JSON file.

## How to Use

1. **Install the Extension:** Load the extension in your browser (see below).
2. **Open the Popup:** Click the extension icon to open Vocab Master.
3. **Search & Filter:** Use the search box and dropdowns to find words.
4. **Copy Words:** Click a word to copy it in parentheses format. Right-click to reset the copy string.
5. **Customize:** Edit `data/words-database.json` to add or modify words and tags.

## Installation

1. Clone or download this repository.
2. In your browser, go to the Extensions page and enable "Developer mode".
3. Click "Load unpacked" and select the project folder.
4. Make sure `popup.html`, `popup.js`, `popup.css`, and `data/words-database.json` are present.

## File Structure

```
vocab-master/
├── data/
│   └── words-database.json
├── src/
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
└── README.md
```

## Contributing

Contributions are welcome! Please read the [contribution guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need for a powerful yet simple vocabulary management tool.
- Thanks to all contributors and users for their feedback and support.

## Contact

For support or business inquiries, please email [your-email@example.com](mailto:your-email@example.com).


## Customizing the Word Database

- Edit `data/words-database.json` to add new terms, definitions, classes, types, and tags.
- Changes will be reflected the next time you open the popup.

## Credits

- UI icons by [Font Awesome](https://fontawesome.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)

---

Enjoy mastering your vocabulary!