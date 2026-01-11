# Development Guide

## ✨ No Compilation Needed!

This app now uses **plain JavaScript** files, just like Quizia and DeltaBooks. Edit files directly and refresh your browser!

## Quick Start

1. **Start Flask server**:
   ```bash
   python app.py
   ```

2. **Open your browser**: http://localhost:6006

3. **Edit JavaScript files** in `app/frontend/static/js/` - refresh browser to see changes!

## File Structure

```
app/frontend/
├── static/
│   └── js/          ← Edit JavaScript files here
│       ├── main.js
│       └── components/
├── styles/
│   └── main.css
└── index.html
```

## How It Works

- **Flask** serves static files directly from `app/frontend/`
- **No compilation** - edit JavaScript and refresh
- **ES6 modules** - uses modern `import/export` syntax
- **Same as Quizia/DeltaBooks** - simple and straightforward

## Editing Files

- Edit any `.js` file in `app/frontend/static/js/`
- Save the file
- Refresh your browser
- See changes immediately!

No build step, no compilation, no watchers - just edit and refresh!
