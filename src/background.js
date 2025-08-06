// Background script for ContactOut Import Tool
chrome.runtime.onInstalled.addListener(() => {
  console.log('ContactOut Import Tool installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveContact') {
    chrome.storage.local.get(['importedContacts'], (result) => {
      const contacts = result.importedContacts || [];
      contacts.push(request.data);
      
      chrome.storage.local.set({ importedContacts: contacts }, () => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getContacts') {
    chrome.storage.local.get(['importedContacts'], (result) => {
      sendResponse({ contacts: result.importedContacts || [] });
    });
    return true;
  }
  
  if (request.action === 'exportContacts') {
    chrome.storage.local.get(['importedContacts'], (result) => {
      const contacts = result.importedContacts || [];
      sendResponse({ contacts });
    });
    return true;
  }
}); 