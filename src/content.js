// ContactOut Import Tool - Content Script
import './styles.css';

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        buttonClass: 'contactout-import-btn',
        modalId: 'contactout-import-modal',
        buttonText: 'import',
        checkInterval: 2000, // Check for new profiles every 2 seconds
        maxRetries: 10,
        apiBaseUrl: 'https://api.creationinternational.co'
    };

    // State management
    let state = {
        isInitialized: false,
        modalCreated: false,
        retryCount: 0,
        isAuthenticated: false,
        authToken: null
    };

    // Efficient button detection with limited attempts
    function startEfficientButtonDetection() {
        // Only run once with 2 seconds delay
        setTimeout(() => {
            if (state.isAuthenticated) {
                addImportButtons();
                console.log('Button detection completed after 2 seconds');
            }
        }, 2000);
    }

    // Initialize the extension with better timing
    function init() {
        if (state.isInitialized) return;
        
        console.log('ContactOut Import Tool: Initializing...');
        console.log('Current URL:', window.location.href);
        console.log('Document ready state:', document.readyState);
        
        // Create modal
        createModal();
        
        // Start observing for profile changes
        startProfileObserver();
        
        // Start efficient button detection
        startEfficientButtonDetection();
        
        // Debug: Check if we can find any buttons on the page
        const allButtons = document.querySelectorAll('button');
        console.log(`Total buttons found on page: ${allButtons.length}`);
        
        // Check for AI personalizer buttons specifically
        const aiPersonalizerButtons = document.querySelectorAll('[data-testid="ai-personalizer-button"]');
        console.log(`AI personalizer buttons found: ${aiPersonalizerButtons.length}`);
        aiPersonalizerButtons.forEach((button, index) => {
            console.log(`AI personalizer button ${index}:`, button.textContent.trim());
        });
        
        // Also check for any buttons with AI text
        allButtons.forEach((button, index) => {
            if (button.textContent.toLowerCase().includes('ai write')) {
                console.log(`AI button ${index}:`, button.textContent.trim());
            }
        });
        
        state.isInitialized = true;
        console.log('ContactOut Import Tool: Initialized successfully');
    }

    // Check if user is authenticated
    function checkAuthStatus() {
        chrome.storage.local.get(['authToken'], function(result) {
            if (result.authToken) {
                state.authToken = result.authToken;
                state.isAuthenticated = true;
                console.log('User is authenticated');
                // Initialize the extension if authenticated
                if (!state.isInitialized) {
                    init();
                }
            } else {
                console.log('User is not authenticated');
                // Don't show login modal automatically - let popup handle it
            }
        });
    }

    // Create the modal HTML
    function createModal() {
        if (state.modalCreated) return;

        const modalHTML = `
            <div id="${CONFIG.modalId}" class="contactout-modal-overlay" style="display: none;">
                <div class="contactout-modal-content">
                    <div class="contactout-modal-header">
                        <h3>Import Contact</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="logout-btn" class="contactout-btn contactout-btn-secondary" style="font-size: 11px; padding: 4px 8px;">Logout</button>
                            <button class="contactout-modal-close">&times;</button>
                        </div>
                    </div>
                    <div class="contactout-modal-body">
                        <div class="contactout-form-group">
                            <label>Name:</label>
                            <input type="text" id="import-name" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Email:</label>
                            <input type="email" id="import-email" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Company:</label>
                            <input type="text" id="import-company" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Title:</label>
                            <input type="text" id="import-title" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Phone:</label>
                            <input type="text" id="import-phone" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Location:</label>
                            <input type="text" id="import-location" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>LinkedIn:</label>
                            <input type="url" id="import-linkedin" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Notes:</label>
                            <textarea id="import-notes" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="contactout-modal-footer">
                        <button id="import-save-btn" class="contactout-btn contactout-btn-primary">Save Contact</button>
                        <button id="import-export-btn" class="contactout-btn contactout-btn-secondary">Export to CSV</button>
                        <button class="contactout-btn contactout-btn-cancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addModalEventListeners();
        state.modalCreated = true;
    }

    // Add import buttons to AI message buttons
    function addImportButtons() {
        // Find all AI message buttons by multiple selectors
        const selectors = [
            '[data-testid="ai-personalizer-button"]',
            '[class*="ai-personalizer"]',
            '[class*="ai-write"]',
            'button[class*="ai"]',
            'button[class*="write"]'
        ];
        
        let aiButtonContainers = [];
        
        // Try each selector
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                aiButtonContainers = aiButtonContainers.concat(Array.from(found));
            } catch (e) {
                // Invalid selector, skip
                console.log('Invalid selector skipped:', selector);
            }
        });
        
        // Also search by text content for buttons that might not match the selectors
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes('ai write') || text.includes('write personalized') || text.includes('personalized message')) {
                if (!aiButtonContainers.includes(button)) {
                    aiButtonContainers.push(button);
                }
            }
        });
        
        console.log(`Found ${aiButtonContainers.length} AI message button containers to process`);
        
        aiButtonContainers.forEach((aiButtonContainer, index) => {
            console.log(`Processing AI button container ${index + 1}:`, aiButtonContainer.textContent.trim());
            
            // Check if this container already has an import button
            if (aiButtonContainer.querySelector(`.${CONFIG.buttonClass}`)) {
                console.log('AI button container already has import button, skipping');
                return;
            }
            
            // Check if there's already an import button in the parent container
            const parentContainer = aiButtonContainer.parentElement;
            if (parentContainer && parentContainer.querySelector(`.${CONFIG.buttonClass}`)) {
                console.log('Parent container already has import button, skipping');
                return;
            }
            
            // Create and add import button directly below the AI button container
            const importButton = createImportButton(aiButtonContainer);
            aiButtonContainer.appendChild(importButton);
            console.log('Added import button below AI message button container');
        });
    }

    // Find the profile that contains a specific button container
    function findProfileContainingButton(buttonContainer) {
        // Walk up the DOM tree to find a profile container
        let currentElement = buttonContainer;
        
        while (currentElement && currentElement !== document.body) {
            // Check if this element looks like a profile container
            const hasName = currentElement.querySelector('h1, h2, h3, h4, h5, h6, [class*="name"]');
            const hasEmail = currentElement.querySelector('a[href^="mailto:"]');
            const hasCompany = currentElement.querySelector('[class*="company"], [class*="org"]');
            
            if (hasName || hasEmail || hasCompany) {
                return currentElement;
            }
            
            currentElement = currentElement.parentElement;
        }
        
        // Fallback: return the container's parent if no profile found
        return buttonContainer.parentElement;
    }

    // Create import button element
    function createImportButton(aiButtonContainer) {
        const button = document.createElement('button');
        button.className = CONFIG.buttonClass;
        button.textContent = CONFIG.buttonText;
        
        // Match the exact style of the "AI write personalized message" button
        button.style.cssText = `
            background: white;
            color: #374151;
            border: 1px solid #d1d5db;
            padding: 5px 8px;
            margin-top: 6px;
            font-size: 12px;
            cursor: pointer;
            border-radius: 6px;
            font-family: inherit;
            font-weight: 600;
            transition: all 0.15s;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            display: block;
            width: 100%;
        `;

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const profile = findProfileContainingButton(aiButtonContainer);
            const contactData = extractContactData(profile);
            openImportModal(contactData);
        });

        return button;
    }

    // Extract contact data from a profile element
    function extractContactData(profile) {
        const data = {
            first_name: '',
            last_name: '',
            work_email: '',
            company_name: '',
            main_role_title: '',
            work_mobile_phone: '',
            work_phone: '',
            full_address: '',
            linkedin_url: '',
            summary: '',
            // Additional fields for detailed logging
            private_email: '',
            private_mobile_phone: '',
            private_phone: '',
            linkedin_sales_url: '',
            facebook_url: '',
            twitter_url: '',
            github_url: '',
            instagram_url: '',
            academic_title: '',
            gender: '',
            company_domain: '',
            valid_status: '',
            country: '',
            region: '',
            city: '',
            postal_code: '',
            avatar_url: '',
            full_avatar_url: '',
            middle_name: '',
            want: '',
            personal_interest: '',
            has_duplicate: false,
            unsubscribed: false,
            linkedin_talent_id: '',
            status: 'none',
            user_id: '',
            professional_experiences: [],
            education_experiences: [],
            volunteer_experiences: [],
            accomplishments: [],
            main_professional_experiences: [],
            languages: [],
            extraction_timestamp: new Date().toISOString(),
            page_url: window.location.href,
            profile_source: 'ContactOut',
            profile_id: 'search',
            company_additional_info: [],
            notes: ''
        };

        console.log('Extracting contact data from profile:', profile);

        // Extract name - try multiple selectors
        const nameSelectors = [
            'span.text-base.font-semibold',
            'h1, h2, h3, h4, h5, h6',
            '[class*="name"]',
            '[class*="title"]',
            'strong',
            'b'
        ];
        
        let nameFound = false;
        for (const selector of nameSelectors) {
            const nameElement = profile.querySelector(selector);
            if (nameElement && nameElement.textContent.trim()) {
                const fullName = nameElement.textContent.trim();
                console.log('Found name with selector', selector, ':', fullName);
                const nameParts = fullName.split(' ');
                data.first_name = nameParts[0] || '';
                data.last_name = nameParts.slice(1).join(' ') || '';
                nameFound = true;
                break;
            }
        }

        // Extract email - try multiple selectors
        const emailSelectors = [
            'div[data-for*="@"]',
            'a[href^="mailto:"]',
            '[class*="email"]'
        ];
        
        for (const selector of emailSelectors) {
            const emailElement = profile.querySelector(selector);
            if (emailElement) {
                let emailText = emailElement.textContent.trim();
                if (emailElement.tagName === 'A' && emailElement.href) {
                    emailText = emailElement.href.replace('mailto:', '');
                }
                if (emailText.includes('@')) {
                    data.work_email = emailText;
                    console.log('Found email with selector', selector, ':', data.work_email);
                    break;
                }
            }
        }

        // Extract company - try multiple selectors
        const companySelectors = [
            '[data-testid="company-modal-btn"]',
            '[class*="company"]',
            '[class*="org"]'
        ];
        
        for (const selector of companySelectors) {
            const companyElement = profile.querySelector(selector);
            if (companyElement) {
                const companyText = companyElement.textContent.trim();
                if (companyText && (companyText.includes('Inc') || companyText.includes('LLC') || companyText.includes('Corp') || companyText.includes('Ltd'))) {
                    data.company_name = companyText;
                    console.log('Found company with selector', selector, ':', data.company_name);
                    break;
                }
            }
        }

        // Extract title/role - try multiple approaches
        const titleSelectors = [
            '.css-1o52pgu span',
            '[class*="title"]',
            '[class*="role"]',
            '[class*="position"]'
        ];
        
        for (const selector of titleSelectors) {
            const titleElements = profile.querySelectorAll(selector);
            for (const element of titleElements) {
                const titleText = element.textContent.trim();
                if (titleText && titleText.includes(' at ')) {
                    // Extract just the title part (before " at ")
                    const titleMatch = titleText.match(/^([^a]+?)\s+at\s+/);
                    if (titleMatch) {
                        data.main_role_title = titleMatch[1].trim();
                        console.log('Found title with selector', selector, ':', data.main_role_title);
                        break;
                    }
                }
            }
            if (data.main_role_title) break;
        }

        // Extract phone - try multiple selectors
        const phoneSelectors = [
            'div[data-for*="+"]',
            'a[href^="tel:"]',
            '[class*="phone"]'
        ];
        
        for (const selector of phoneSelectors) {
            const phoneElement = profile.querySelector(selector);
            if (phoneElement) {
                let phoneText = phoneElement.textContent.trim();
                if (phoneElement.tagName === 'A' && phoneElement.href) {
                    phoneText = phoneElement.href.replace('tel:', '');
                }
                if (phoneText.includes('+') || phoneText.match(/\d{10,}/)) {
                    data.work_phone = phoneText;
                    console.log('Found phone with selector', selector, ':', data.work_phone);
                    break;
                }
            }
        }

        // Extract location - try multiple selectors
        const locationSelectors = [
            '.text-gray-500.text-xs',
            '[class*="location"]',
            '[class*="address"]'
        ];
        
        for (const selector of locationSelectors) {
            const locationElement = profile.querySelector(selector);
            if (locationElement) {
                const locationText = locationElement.textContent.trim();
                if (locationText && locationText.includes(',')) {
                    data.full_address = locationText;
                    console.log('Found location with selector', selector, ':', data.full_address);
                    break;
                }
            }
        }

        // Extract LinkedIn URL - try multiple selectors
        const linkedinSelectors = [
            'a[href*="linkedin.com"]',
            '[class*="linkedin"]',
            'a[target="_blank"]'
        ];
        
        for (const selector of linkedinSelectors) {
            const linkedinElements = profile.querySelectorAll(selector);
            for (const element of linkedinElements) {
                if (element.href && element.href.includes('linkedin.com')) {
                    data.linkedin_url = element.href;
                    console.log('Found LinkedIn with selector', selector, ':', data.linkedin_url);
                    break;
                }
            }
            if (data.linkedin_url) break;
        }

        // Extract social media URLs
        const socialLinks = profile.querySelectorAll('a[target="_blank"]');
        socialLinks.forEach(link => {
            const href = link.href;
            if (href.includes('facebook.com')) {
                data.facebook_url = href;
                console.log('Found Facebook:', href);
            } else if (href.includes('twitter.com')) {
                data.twitter_url = href;
                console.log('Found Twitter:', href);
            } else if (href.includes('github.com')) {
                data.github_url = href;
                console.log('Found GitHub:', href);
            }
        });

        // Extract professional experiences - try multiple selectors
        const experienceSelectors = [
            '.css-1o52pgu',
            '[class*="experience"]',
            '[class*="work"]'
        ];
        
        experienceSelectors.forEach(selector => {
            const experienceDivs = profile.querySelectorAll(selector);
            experienceDivs.forEach((expDiv, index) => {
                const spanElement = expDiv.querySelector('span');
                if (spanElement) {
                    const experienceText = spanElement.textContent.trim();
                    if (experienceText && experienceText.includes(' at ')) {
                        const experience = {
                            role_title: experienceText,
                            period_from: '',
                            period_to: '',
                            is_current: index === 0, // First experience is current
                            organization_name: '',
                            organization_logo_url: '',
                            organization_linkedin_url: '',
                            organization_employee_count_range: '',
                            description_responsibility: ''
                        };
                        data.professional_experiences.push(experience);
                        console.log('Found experience:', experienceText);
                    }
                }
            });
        });

        // Extract education experiences - try multiple selectors
        const educationSelectors = [
            '.css-18zmrds',
            '[class*="education"]',
            '[class*="school"]'
        ];
        
        educationSelectors.forEach(selector => {
            const educationDivs = profile.querySelectorAll(selector);
            educationDivs.forEach((eduDiv, index) => {
                const spanElement = eduDiv.querySelector('span');
                if (spanElement) {
                    const educationText = spanElement.textContent.trim();
                    if (educationText && (educationText.includes(' at ') || educationText.includes(' in '))) {
                        const education = {
                            course: educationText,
                            field_of_study: '',
                            grade: '',
                            period_from: '',
                            period_to: '',
                            is_current: false,
                            organization_name: '',
                            organization_logo_url: '',
                            educational_level_value: '',
                            educational_level_icon_name: '',
                            description: ''
                        };
                        data.education_experiences.push(education);
                        console.log('Found education:', educationText);
                    }
                }
            });
        });

        // Generate user_id
        data.user_id = `contactout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Extracted contact data:', data);
        return data;
    }

    // Open the import modal with contact data
    function openImportModal(contactData) {
        // Check if user is authenticated
        if (!state.isAuthenticated || !state.authToken) {
            showNotification('Please login first!', 'error');
            // The login modal is now handled by the popup, so we just show a notification.
            // If the user clicks the import button, they will be prompted to open the popup.
            return;
        }

        const modal = document.getElementById(CONFIG.modalId);
        if (!modal) return;

        // Store the full contact data for detailed logging
        modal.fullContactData = contactData;

        // Populate form fields
        const fullName = `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
        document.getElementById('import-name').value = fullName;
        document.getElementById('import-email').value = contactData.work_email || '';
        document.getElementById('import-company').value = contactData.company_name || '';
        document.getElementById('import-title').value = contactData.main_role_title || '';
        document.getElementById('import-phone').value = contactData.work_mobile_phone || contactData.work_phone || '';
        document.getElementById('import-location').value = contactData.full_address || '';
        document.getElementById('import-linkedin').value = contactData.linkedin_url || '';
        document.getElementById('import-notes').value = '';

        // Show modal
        modal.style.display = 'flex';
    }

    // Close the import modal
    function closeImportModal() {
        const modal = document.getElementById(CONFIG.modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Add event listeners to modal
    function addModalEventListeners() {
        const modal = document.getElementById(CONFIG.modalId);
        if (!modal) return;

        // Close button
        const closeBtn = modal.querySelector('.contactout-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeImportModal);
        }

        // Overlay click to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImportModal();
            }
        });

        // Save button
        const saveBtn = modal.querySelector('#import-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveContact);
        }

        // Export button
        const exportBtn = modal.querySelector('#import-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportToCSV);
        }

        // Cancel button
        const cancelBtn = modal.querySelector('.contactout-btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeImportModal);
        }

        // Logout button
        const logoutBtn = modal.querySelector('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

    // Save contact to API
    function saveContact() {
        // Check if user is authenticated
        if (!state.isAuthenticated || !state.authToken) {
            showNotification('Please login first!', 'error');
            // The login modal is now handled by the popup, so we just show a notification.
            // If the user clicks the import button, they will be prompted to open the popup.
            return;
        }

        const modal = document.getElementById(CONFIG.modalId);
        const fullContactData = modal ? modal.fullContactData : null;
        
        const contactData = {
            name: document.getElementById('import-name').value,
            email: document.getElementById('import-email').value,
            company: document.getElementById('import-company').value,
            title: document.getElementById('import-title').value,
            phone: document.getElementById('import-phone').value,
            location: document.getElementById('import-location').value,
            linkedin: document.getElementById('import-linkedin').value,
            notes: document.getElementById('import-notes').value,
            importedAt: new Date().toISOString(),
            source: 'ContactOut'
        };

        // Log the complete contact information being saved
        console.log('=== SAVING CONTACT INFORMATION ===');
        console.log('Form Data:', JSON.stringify(contactData, null, 2));
        
        if (fullContactData) {
            console.log('Full Extracted Data:', JSON.stringify(fullContactData, null, 2));
            console.log('Detailed Contact Information:');
            console.log('- First Name:', fullContactData.first_name);
            console.log('- Last Name:', fullContactData.last_name);
            console.log('- Work Email:', fullContactData.work_email);
            console.log('- Private Email:', fullContactData.private_email);
            console.log('- Company:', fullContactData.company_name);
            console.log('- Title:', fullContactData.main_role_title);
            console.log('- Work Phone:', fullContactData.work_phone);
            console.log('- Work Mobile:', fullContactData.work_mobile_phone);
            console.log('- Private Phone:', fullContactData.private_phone);
            console.log('- Private Mobile:', fullContactData.private_mobile_phone);
            console.log('- Location:', fullContactData.full_address);
            console.log('- LinkedIn:', fullContactData.linkedin_url);
            console.log('- Facebook:', fullContactData.facebook_url);
            console.log('- Twitter:', fullContactData.twitter_url);
            console.log('- GitHub:', fullContactData.github_url);
            console.log('- Professional Experiences:', fullContactData.professional_experiences.length);
            console.log('- Education Experiences:', fullContactData.education_experiences.length);
            console.log('- User ID:', fullContactData.user_id);
            console.log('- Extraction Timestamp:', fullContactData.extraction_timestamp);
            console.log('- Page URL:', fullContactData.page_url);
        }
        
        console.log('Form Values:');
        console.log('- Name:', contactData.name);
        console.log('- Email:', contactData.email);
        console.log('- Company:', contactData.company);
        console.log('- Title:', contactData.title);
        console.log('- Phone:', contactData.phone);
        console.log('- Location:', contactData.location);
        console.log('- LinkedIn:', contactData.linkedin);
        console.log('- Notes:', contactData.notes);
        console.log('- Imported At:', contactData.importedAt);
        console.log('- Source:', contactData.source);
        console.log('================================');

        // Prepare API request data
        const apiData = {
            work_email: fullContactData?.work_email || contactData.email || '',
            first_name: fullContactData?.first_name || contactData.name.split(' ')[0] || '',
            last_name: fullContactData?.last_name || contactData.name.split(' ').slice(1).join(' ') || '',
            company_name: fullContactData?.company_name || contactData.company || '',
            middle_name: fullContactData?.middle_name || '',
            full_avatar_url: fullContactData?.full_avatar_url || '',
            academic_title: fullContactData?.academic_title || '',
            gender: fullContactData?.gender || '',
            summary: fullContactData?.summary || '',
            want: fullContactData?.want || '',
            personal_interest: fullContactData?.personal_interest || '',
            has_duplicate: fullContactData?.has_duplicate || false,
            avatar_url: fullContactData?.avatar_url || '',
            unsubscribed: fullContactData?.unsubscribed || false,
            private_email: fullContactData?.private_email || '',
            work_mobile_phone: fullContactData?.work_mobile_phone || '',
            private_mobile_phone: fullContactData?.private_mobile_phone || '',
            work_phone: fullContactData?.work_phone || contactData.phone || '',
            private_phone: fullContactData?.private_phone || '',
            linkedin_url: fullContactData?.linkedin_url || contactData.linkedin || '',
            company_domain: fullContactData?.company_domain || '',
            valid_status: fullContactData?.valid_status || 'unverified',
            linkedin_sales_url: fullContactData?.linkedin_sales_url || '',
            linkedin_talent_id: fullContactData?.linkedin_talent_id || '',
            facebook_url: fullContactData?.facebook_url || '',
            twitter_url: fullContactData?.twitter_url || '',
            xing_url: fullContactData?.xing_url || '',
            github_url: fullContactData?.github_url || '',
            instagram_url: fullContactData?.instagram_url || '',
            youtube_url: fullContactData?.youtube_url || '',
            quora_url: fullContactData?.quora_url || '',
            calendly_url: fullContactData?.calendly_url || '',
            tiktok_url: fullContactData?.tiktok_url || '',
            main_role_title: fullContactData?.main_role_title || contactData.title || '',
            status: fullContactData?.status || 'none',
            user_id: fullContactData?.user_id || `contactout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            personal_detail: {
                dob_day: null,
                dob_month: null,
                dob_year: null,
                full_address: fullContactData?.full_address || contactData.location || '',
                country: fullContactData?.country || '',
                region: fullContactData?.region || '',
                city: fullContactData?.city || '',
                postal_code: fullContactData?.postal_code || '',
                nationality: '',
                race_or_ethnicity: '',
                marital_status: '',
                children_number: 0,
                maiden_name: '',
                social_security_number: ''
            },
            professional_experiences: fullContactData?.professional_experiences || [],
            education_experiences: fullContactData?.education_experiences || [],
            volunteer_experiences: fullContactData?.volunteer_experiences || [],
            accomplishments: fullContactData?.accomplishments || [],
            main_professional_experiences: fullContactData?.main_professional_experiences || [],
            languages: fullContactData?.languages || []
        };

        // Validate required fields
        if (!apiData.work_email || !apiData.first_name || !apiData.last_name || !apiData.company_name) {
            showNotification('Error: Email, first name, last name, and company are required!', 'error');
            return;
        }

        console.log('Sending API request with data:', JSON.stringify(apiData, null, 2));

        // Make API call with authentication
        fetch(`${CONFIG.apiBaseUrl}/api/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${state.authToken}`
            },
            body: JSON.stringify(apiData)
        })
        .then(response => {
            console.log('API Response status:', response.status);
            
            if (response.status === 401) {
                // Token expired or invalid
                showNotification('Session expired. Please login again.', 'error');
                logout();
                return Promise.reject('Unauthorized');
            }
            
            return response.json();
        })
        .then(data => {
            console.log('API Response data:', data);
            showNotification('Contact saved successfully!');
            closeImportModal();
            
            // Also save to Chrome storage as backup
            chrome.storage.local.get(['contacts'], function(result) {
                const contacts = result.contacts || [];
                contacts.push(contactData);
                chrome.storage.local.set({ contacts: contacts });
            });
        })
        .catch(error => {
            console.error('API Error:', error);
            if (error !== 'Unauthorized') {
                showNotification('Error saving contact. Please try again.', 'error');
            }
        });
    }

    // Logout function
    function logout() {
        state.authToken = null;
        state.isAuthenticated = false;
        state.isInitialized = false;
        
        chrome.storage.local.remove(['authToken'], function() {
            console.log('Auth token removed');
            showNotification('Logged out successfully', 'success');
            
            // Reset extension state
            state.isInitialized = false;
            state.modalCreated = false;
            
            // Show login modal
            // The login modal is now handled by the popup, so we just show a notification.
            // If the user clicks the import button, they will be prompted to open the popup.
        });
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Start observing for profile changes with improved detection
    function startProfileObserver() {
        // Use MutationObserver to watch for new profiles and buttons
        const observer = new MutationObserver((mutations) => {
            let shouldAddButtons = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for AI buttons specifically
                            if (node.querySelector && (
                                node.querySelector('[data-testid="ai-personalizer-button"]') ||
                                node.textContent.toLowerCase().includes('ai write') ||
                                node.textContent.toLowerCase().includes('write personalized')
                            )) {
                                shouldAddButtons = true;
                            }
                            
                            // Also check for profile containers
                            if (node.querySelector && (
                                node.querySelector('[data-testid="profile-card"]') ||
                                node.querySelector('.profile-card') ||
                                node.querySelector('[class*="profile"]') ||
                                node.querySelector('[class*="card"]')
                            )) {
                                shouldAddButtons = true;
                            }
                        }
                    });
                }
            });

            if (shouldAddButtons) {
                setTimeout(() => addImportButtons(), 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Export contacts to CSV
    function exportToCSV() {
        chrome.storage.local.get(['contacts'], function(result) {
            const contacts = result.contacts || [];
            if (contacts.length === 0) {
                showNotification('No contacts to export!');
                return;
            }

            const csvContent = [
                ['Name', 'Email', 'Company', 'Title', 'Phone', 'Location', 'LinkedIn', 'Notes', 'Imported At'],
                ...contacts.map(contact => [
                    contact.name,
                    contact.email,
                    contact.company,
                    contact.title,
                    contact.phone,
                    contact.location,
                    contact.linkedin,
                    contact.notes,
                    contact.importedAt
                ])
            ].map(row => row.map(field => `"${field || ''}"`).join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'contactout-contacts.csv';
            a.click();
            URL.revokeObjectURL(url);

            showNotification('Contacts exported to CSV!');
        });
    }

    // Bulk scrape contacts
    function bulkScrapeContacts() {
        const profileSelectors = [
            '[data-testid="profile-card"]',
            '.profile-card',
            '[class*="profile"]',
            '[class*="card"]',
            '[class*="result"]',
            '[class*="item"]',
            'div[class*="person"]',
            'div[class*="contact"]'
        ];
        
        let profiles = [];
        profileSelectors.forEach(selector => {
            const found = document.querySelectorAll(selector);
            profiles = profiles.concat(Array.from(found));
        });
        
        // Remove duplicates
        profiles = [...new Set(profiles)];
        
        const contacts = [];
        
        profiles.forEach(profile => {
            const contactData = extractContactData(profile);
            if (contactData.first_name || contactData.work_email) {
                contactData.importedAt = new Date().toISOString();
                contactData.source = 'ContactOut';
                contacts.push(contactData);
            }
        });

        if (contacts.length > 0) {
            chrome.storage.local.get(['contacts'], function(result) {
                const existingContacts = result.contacts || [];
                const allContacts = [...existingContacts, ...contacts];
                
                chrome.storage.local.set({ contacts: allContacts }, function() {
                    showNotification(`Bulk imported ${contacts.length} contacts!`);
                });
            });
        } else {
            showNotification('No contacts found to scrape!');
        }
    }

    // Initialize when DOM is ready with efficient timing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Check authentication first
            checkAuthStatus();
        });
    } else {
        // Check authentication first
        checkAuthStatus();
    }

    // Single initialization attempt with proper delay
    setTimeout(() => {
        if (!state.isAuthenticated) {
            checkAuthStatus();
        } else if (!state.isInitialized) {
            init();
        }
    }, 1000); // Single 1-second delay instead of multiple attempts
})(); 