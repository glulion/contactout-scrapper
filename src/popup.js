import React from 'react';
import { createRoot } from 'react-dom/client';
import Popup from './components/Popup';
import './popup.css';

// Create popup component
const popupRoot = createRoot(document.getElementById('popup-root'));
popupRoot.render(<Popup />); 