import React, { useState, useEffect } from 'react';
import { getContacts, clearContacts, exportToCSV } from '../utils/storage';

const Popup = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const result = await chrome.storage.local.get(['authToken']);
      if (result.authToken) {
        setIsAuthenticated(true);
        loadContacts();
      } else {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const contactsData = await getContacts();
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginData.username || !loginData.password) {
      setLoginError('Please enter both username and password');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('https://api.creationinternational.co/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: loginData.username,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (data.access_token) {
        // Store both auth token and user_id from login response
        await chrome.storage.local.set({ 
          authToken: data.access_token,
          userId: data.user_id || data.id || null
        });
        setIsAuthenticated(true);
        setShowLoginModal(false);
        setLoginData({ username: '', password: '' });
        loadContacts();
      } else {
        setLoginError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await chrome.storage.local.remove(['authToken']);
      setIsAuthenticated(false);
      setContacts([]);
      setShowLoginModal(true);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleExport = async () => {
    try {
      await exportToCSV(contacts);
    } catch (error) {
      console.error('Error exporting contacts:', error);
    }
  };

  const handleClear = async () => {
    try {
      await clearContacts();
      setContacts([]);
    } catch (error) {
      console.error('Error clearing contacts:', error);
    }
  };

  // Login Modal
  if (showLoginModal) {
    return (
      <div className="popup-container">
        <div className="popup-header">
          <h2>ContactOut Import Tool</h2>
          <p>Login Required</p>
        </div>
        
        <div className="popup-content">
          <div className="login-form">
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                placeholder="Enter your username"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter your password"
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            {loginError && (
              <div className="error-message">{loginError}</div>
            )}
            
            <button 
              className="action-btn login-btn" 
              onClick={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <h2>ContactOut Import Tool</h2>
        <p>Manage your imported contacts</p>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
      
      <div className="popup-content">
        {loading ? (
          <div className="loading">Loading contacts...</div>
        ) : (
          <>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">{contacts.length}</span>
                <span className="stat-label">Contacts</span>
              </div>
            </div>
            
            <div className="actions">
              <button 
                className="action-btn export-btn" 
                onClick={handleExport}
                disabled={contacts.length === 0}
              >
                Export to CSV
              </button>
              <button 
                className="action-btn clear-btn" 
                onClick={handleClear}
                disabled={contacts.length === 0}
              >
                Clear All
              </button>
            </div>
            
            {contacts.length > 0 && (
              <div className="contacts-list">
                <h3>Recent Contacts</h3>
                <div className="contacts">
                  {contacts.slice(-5).map((contact, index) => (
                    <div key={index} className="contact-item">
                      <div className="contact-name">{contact.name || 'Unknown'}</div>
                      <div className="contact-email">{contact.email || 'No email'}</div>
                      <div className="contact-company">{contact.company || 'No company'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Popup; 