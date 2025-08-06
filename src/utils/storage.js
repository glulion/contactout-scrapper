// Chrome storage utilities
export const saveContact = (contactData) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['importedContacts'], (result) => {
      const contacts = result.importedContacts || [];
      contacts.push(contactData);
      
      chrome.storage.local.set({ importedContacts: contacts }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(contactData);
        }
      });
    });
  });
};

export const getContacts = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['importedContacts'], (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.importedContacts || []);
      }
    });
  });
};

export const clearContacts = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(['importedContacts'], () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

export const exportToCSV = (contacts) => {
  if (contacts.length === 0) {
    throw new Error('No contacts to export!');
  }

  const headers = [
    'Name', 'Email', 'Company', 'Title', 'Phone', 'Location', 
    'LinkedIn', 'Industry', 'Notes', 'Imported At', 'Source'
  ];
  
  const csvContent = [
    headers.join(','),
    ...contacts.map(contact => [
      `"${contact.name || ''}"`,
      `"${contact.email || ''}"`,
      `"${contact.company || ''}"`,
      `"${contact.title || ''}"`,
      `"${contact.phone || ''}"`,
      `"${contact.location || ''}"`,
      `"${contact.linkedin || ''}"`,
      `"${contact.industry || ''}"`,
      `"${contact.notes || ''}"`,
      `"${contact.importedAt || ''}"`,
      `"${contact.source || ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `contactout-contacts-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 