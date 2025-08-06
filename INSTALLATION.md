# Installation Guide

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Chrome browser

## Step-by-Step Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

For development (with watch mode):
```bash
npm run dev
```

For production:
```bash
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select the project folder (the folder containing `manifest.json`)
5. The extension should now appear in your extensions list

### 4. Verify Installation

1. Navigate to `https://contactout.com/dashboard/search`
2. You should see "import" buttons below AI message buttons
3. Click the extension icon in your toolbar to open the popup

## Development Workflow

### Making Changes

1. Edit files in the `src/` directory
2. If using `npm run dev`, changes will automatically rebuild
3. If using `npm run build`, run the build command after changes
4. Go to `chrome://extensions/` and click the refresh icon on your extension
5. Refresh the ContactOut page to see changes

### File Structure

```
src/
├── components/          # React components
│   ├── ImportModal.jsx # Contact import modal
│   ├── ImportModal.css # Modal styles
│   ├── Popup.jsx      # Extension popup
│   └── popup.css      # Popup styles
├── utils/              # Utility functions
│   ├── contactExtractor.js
│   ├── storage.js
│   └── notification.js
├── content.js          # Main content script
├── background.js       # Background script
├── popup.js           # Popup script
├── popup.html         # Popup template
└── styles.css         # Main styles
```

### Build Output

After building, the `dist/` folder will contain:
- `content.js` - Content script with React components
- `background.js` - Background script
- `popup.js` - Popup script
- `popup.html` - Popup HTML
- `content.css` - Extracted CSS for content script
- `popup.css` - Extracted CSS for popup

## Troubleshooting

### Extension Not Loading

1. Check that all dependencies are installed: `npm install`
2. Ensure the build completed successfully: `npm run build`
3. Check the Chrome extensions page for error messages
4. Verify the `dist/` folder contains the built files

### Import Buttons Not Appearing

1. Make sure you're on the correct ContactOut page
2. Check the browser console for JavaScript errors
3. Try refreshing the page after loading the extension
4. Verify the extension is enabled in Chrome

### Build Errors

1. Check Node.js version: `node --version` (should be 14+)
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check for syntax errors in React components
4. Verify all imports are correct

### React Components Not Rendering

1. Check that React and ReactDOM are properly imported
2. Verify the createRoot API is being used (React 18+)
3. Check for JSX syntax errors
4. Ensure CSS files are being imported correctly

## Production Deployment

For production deployment:

1. Run `npm run build`
2. The `dist/` folder contains all necessary files
3. Zip the entire project folder
4. Submit to Chrome Web Store (if publishing)

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Notes

- The extension uses Manifest V3 for modern Chrome compatibility
- React components are bundled with webpack
- CSS is extracted and optimized for production
- All storage operations use Chrome's local storage API 