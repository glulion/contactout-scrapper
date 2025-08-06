import React, { useState, useEffect } from 'react';
import './ImportModal.css';

const ImportModal = ({ isOpen, onClose, contactData, onSave, onExport }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    phone: '',
    location: '',
    linkedin: '',
    industry: '',
    notes: ''
  });

  useEffect(() => {
    if (contactData && isOpen) {
      const fullName = `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
      setFormData({
        name: fullName,
        email: contactData.work_email || '',
        company: contactData.company_name || '',
        title: contactData.main_role_title || '',
        phone: contactData.work_mobile_phone || contactData.work_phone || '',
        location: contactData.full_address || '',
        linkedin: contactData.linkedin_url || '',
        industry: contactData.summary || '',
        notes: ''
      });
    }
  }, [contactData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    const dataToSave = {
      ...contactData,
      ...formData,
      importedAt: new Date().toISOString(),
      source: 'ContactOut'
    };
    onSave(dataToSave);
    onClose();
  };

  const handleExport = () => {
    onExport();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="contactout-modal-overlay" onClick={onClose}>
      <div className="contactout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="contactout-modal-header">
          <h3>Import Contact</h3>
          <button className="contactout-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="contactout-modal-body">
          <div className="contactout-form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Company:</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Phone:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>LinkedIn:</label>
            <input
              type="url"
              name="linkedin"
              value={formData.linkedin}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Industry:</label>
            <input
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              readOnly
            />
          </div>
          
          <div className="contactout-form-group">
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes about this contact..."
            />
          </div>
        </div>
        
        <div className="contactout-modal-footer">
          <button className="contactout-btn contactout-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="contactout-btn contactout-btn-primary" onClick={handleSave}>
            Save Contact
          </button>
          <button className="contactout-btn contactout-btn-success" onClick={handleExport}>
            Export All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal; 