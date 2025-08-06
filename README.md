# ContactOut Import Tool

A Chrome extension that adds an "import" button to ContactOut's search results, allowing you to easily save contact information to your local storage.

## Features

- ✅ Adds "import" buttons next to email addresses on ContactOut search results
- ✅ Extracts contact information (name, email, company, title, phone)
- ✅ Beautiful modal interface for reviewing and editing contact data
- ✅ Saves contacts to Chrome's local storage
- ✅ Works only on ContactOut's search page (`https://contactout.com/dashboard/search`)
- ✅ Responsive design with dark mode support
- ✅ Real-time notifications

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download the extension files**
   - Make sure you have all the files in a folder:
     - `manifest.json`
     - `content.js`
     - `styles.css`
     - `README.md`

2. **Open Chrome Extensions Page**
   - Open Chrome and go to `chrome://extensions/`
   - Or navigate to: Chrome Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing your extension files
   - The extension should now appear in your extensions list

5. **Verify Installation**
   - You should see "ContactOut Import Tool" in your extensions list
   - The extension will be active when you visit ContactOut's search page

### Method 2: Install from Chrome Web Store (Future)

*This extension will be published to the Chrome Web Store in the future for easier installation.*

## Usage

1. **Navigate to ContactOut**
   - Go to `https://contactout.com/dashboard/search`
   - Make sure you're logged in to your ContactOut account

2. **Search for Contacts**
   - Use ContactOut's search functionality to find contacts
   - The extension will automatically add "import" buttons next to email addresses

3. **Import Contacts**
   - Click the red "import" button next to any email address
   - A modal will open with the contact's information pre-filled
   - Review and edit the information if needed
   - Add any notes in the notes field
   - Click "Save Contact" to store the contact

4. **View Saved Contacts**
   - Currently, contacts are saved to Chrome's local storage
   - Future versions will include a dashboard to view and manage saved contacts

## How It Works

### Content Script (`content.js`)
- Automatically detects ContactOut's search page
- Finds profile cards and email containers
- Injects "import" buttons next to email addresses
- Extracts contact information from the page
- Manages the modal interface
- Saves data to Chrome storage

### Styling (`styles.css`)
- Provides modern, responsive styling
- Matches ContactOut's design language
- Includes dark mode support
- Smooth animations and transitions

### Manifest (`manifest.json`)
- Defines extension permissions and behavior
- Specifies content script injection rules
- Sets up host permissions for ContactOut

## Technical Details

### Permissions Used
- `activeTab`: To access the current tab
- `storage`: To save contact data locally
- `https://contactout.com/*`: To run on ContactOut's domain

### Data Extraction
The extension extracts the following information:
- **Name**: From profile headers and name elements
- **Email**: From mailto links
- **Company**: From company/organization elements
- **Title**: From headline/position elements
- **Phone**: From phone links and elements

### Storage
Contacts are stored in Chrome's local storage with the following structure:
```javascript
{
  name: "John Doe",
  email: "john@example.com",
  company: "Example Corp",
  title: "CEO",
  phone: "+1234567890",
  notes: "Met at conference",
  importedAt: "2024-01-01T12:00:00.000Z"
}
```

## Troubleshooting

### Extension Not Working?
1. **Check the URL**: Make sure you're on `https://contactout.com/dashboard/search`
2. **Refresh the page**: Try refreshing the page after installing the extension
3. **Check console**: Open Developer Tools (F12) and look for any error messages
4. **Reinstall**: Try removing and reinstalling the extension

### Import Buttons Not Appearing?
1. **Wait for page load**: The extension needs time to detect profile cards
2. **Check ContactOut login**: Make sure you're logged into ContactOut
3. **Try scrolling**: Sometimes new profiles load as you scroll

### Modal Not Opening?
1. **Check for JavaScript errors**: Open Developer Tools and check the console
2. **Disable other extensions**: Some extensions might conflict
3. **Try a different browser**: Test in a fresh Chrome profile

## Development

### File Structure
```
contactout-import-tool/
├── manifest.json      # Extension configuration
├── content.js         # Main functionality
├── styles.css         # Styling
└── README.md         # Documentation
```

### Making Changes
1. Edit the files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Refresh the ContactOut page to see changes

### Debugging
- Open Developer Tools (F12)
- Check the Console tab for extension logs
- Use `console.log()` statements in `content.js` for debugging

## Future Enhancements

- [ ] Export contacts to CSV/Excel
- [ ] Integration with CRM systems
- [ ] Contact management dashboard
- [ ] Bulk import functionality
- [ ] Custom field mapping
- [ ] Contact deduplication
- [ ] Search and filter saved contacts

## Privacy & Security

- **No data sent to external servers**: All data is stored locally in Chrome
- **No tracking**: The extension doesn't collect any personal information
- **Open source**: Code is transparent and can be reviewed
- **Minimal permissions**: Only requests necessary permissions

## Support

If you encounter any issues or have suggestions for improvements:

1. Check the troubleshooting section above
2. Review the console for error messages
3. Create an issue in the project repository
4. Contact the development team

## License

This project is open source and available under the MIT License.

---

**Note**: This extension is not affiliated with ContactOut. It's a third-party tool designed to enhance the ContactOut experience. 