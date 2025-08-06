// Notification utilities
export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.className = `contactout-notification contactout-notification-${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10001;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: notificationSlideIn 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'notificationSlideOut 0.3s ease-in';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 300);
  }, 3000);
};

// Add notification animations to the page
export const addNotificationStyles = () => {
  if (document.getElementById('contactout-notification-styles')) {
    return; // Styles already added
  }

  const style = document.createElement('style');
  style.id = 'contactout-notification-styles';
  style.textContent = `
    @keyframes notificationSlideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes notificationSlideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100%);
      }
    }
  `;
  
  document.head.appendChild(style);
}; 