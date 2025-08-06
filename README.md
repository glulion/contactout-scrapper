# ContactOut Import Tool - React Edition

A Chrome extension that adds import functionality to ContactOut search results, built with React.js for a modern and maintainable codebase.

## Features

- **Individual Contact Import**: Import contacts one by one with a beautiful React modal
- **Bulk Contact Scraping**: Scrape all visible contacts at once
- **CSV Export**: Export all imported contacts to CSV format
- **Chrome Storage**: Persistent storage of imported contacts
- **Modern UI**: React-based components with smooth animations
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Automatic dark mode detection

## Project Structure

```
contactout-scrapper/
├── src/
│   ├── components/
│   │   ├── ImportModal.jsx      # React modal for contact import
│   │   ├── ImportModal.css      # Modal styles
│   │   ├── Popup.jsx           # Extension popup component
│   │   └── popup.css           # Popup styles
│   ├── utils/
│   │   ├── contactExtractor.js # Contact data extraction logic
│   │   ├── storage.js          # Chrome storage utilities
│   │   └── notification.js     # Notification system
│   ├── content.js              # Main content script
│   ├── background.js           # Background script
│   ├── popup.js               # Popup script
│   ├── popup.html             # Popup HTML template
│   └── styles.css             # Main styles
├── dist/                      # Built files (generated)
├── manifest.json              # Chrome extension manifest
├── package.json               # Dependencies and scripts
├── webpack.config.js          # Webpack configuration
└── README.md                  # This file
```

## Installation & Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Development mode:**
   ```bash
   npm run dev
   ```
   This will watch for changes and rebuild automatically.

3. **Production build:**
   ```bash
   npm run build
   ```

### Loading the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the project folder
4. The extension will be loaded and ready to use

## Usage

### On ContactOut Search Results

1. Navigate to ContactOut search results page
2. You'll see "import" buttons below each AI message button
3. Click "import" to open the contact import modal
4. Review the extracted contact data
5. Add notes if needed
6. Click "Save Contact" to store the contact

### Bulk Import

1. Look for the "📥 Bulk Scrape" button (usually in the header or as a floating button)
2. Click it to import all visible contacts at once
3. You'll see a notification with the number of contacts imported

### Managing Contacts

1. Click the extension icon in your browser toolbar
2. View statistics and recent contacts
3. Export all contacts to CSV
4. Clear all contacts if needed

## Technical Details

### React Components

- **ImportModal**: Modal dialog for reviewing and saving individual contacts
- **Popup**: Extension popup for managing imported contacts

### Utilities

- **contactExtractor.js**: Extracts comprehensive contact data from ContactOut profiles
- **storage.js**: Handles Chrome storage operations with Promise-based API
- **notification.js**: Shows user-friendly notifications

### Build System

- **Webpack**: Bundles React components and utilities
- **Babel**: Transpiles modern JavaScript and JSX
- **CSS Loaders**: Handles CSS imports and styling

## Data Extraction

The extension extracts the following contact information:

- **Basic Info**: Name, email, company, title, phone, location
- **Social Profiles**: LinkedIn, Facebook, Twitter, GitHub, Instagram
- **Professional Info**: Summary, avatar, company domain
- **Experience**: Current and previous roles with dates
- **Education**: Academic background and degrees
- **Metadata**: Import timestamp, source, profile ID

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to ensure everything builds correctly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Changelog

### v1.0.0
- Complete rewrite with React.js
- Modern component-based architecture
- Improved UI/UX with smooth animations
- Better error handling and notifications
- Comprehensive contact data extraction
- Chrome storage integration
- CSV export functionality 