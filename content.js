// ContactOut Import Tool - Content Script
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        buttonClass: 'contactout-import-btn',
        modalId: 'contactout-import-modal',
        buttonText: 'import',
        checkInterval: 2000, // Check for new profiles every 2 seconds
        maxRetries: 10
    };

    // State management
    let state = {
        isInitialized: false,
        modalCreated: false,
        retryCount: 0
    };

    // Initialize the extension
    function init() {
        if (state.isInitialized) return;
        
        console.log('ContactOut Import Tool: Initializing...');
        
        // Create modal
        createModal();
        
        // Add bulk scrape button
        addBulkScrapeButton();
        
        // Start observing for profile changes
        startProfileObserver();
        
        // Add initial import buttons
        addImportButtons();
        
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

    // Create the modal HTML
    function createModal() {
        if (state.modalCreated) return;

        const modalHTML = `
            <div id="${CONFIG.modalId}" class="contactout-modal-overlay" style="display: none;">
                <div class="contactout-modal-content">
                    <div class="contactout-modal-header">
                        <h3>Import Contact</h3>
                        <button class="contactout-modal-close">&times;</button>
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
                            <label>Industry:</label>
                            <input type="text" id="import-industry" readonly>
                        </div>
                        <div class="contactout-form-group">
                            <label>Notes:</label>
                            <textarea id="import-notes" placeholder="Add any notes about this contact..."></textarea>
                        </div>
                    </div>
                    <div class="contactout-modal-footer">
                        <button class="contactout-btn contactout-btn-secondary" data-action="cancel">Cancel</button>
                        <button class="contactout-btn contactout-btn-primary" data-action="save">Save Contact</button>
                        <button class="contactout-btn contactout-btn-success" data-action="export">Export All</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners to modal buttons
        addModalEventListeners();
        
        state.modalCreated = true;
    }

    // Add import buttons to existing profiles
    function addImportButtons() {
        // Find all AI message buttons by data-testid
        const aiButtonContainers = document.querySelectorAll('[data-testid="ai-personalizer-button"]');
        
        console.log(`Found ${aiButtonContainers.length} AI message button containers to process`);
        
        aiButtonContainers.forEach((aiButtonContainer, index) => {
            console.log(`Processing AI button container ${index + 1}:`, aiButtonContainer.textContent.trim());
            
            // Check if this container already has an import button
            if (aiButtonContainer.querySelector(`.${CONFIG.buttonClass}`)) {
                console.log('AI button container already has import button, skipping');
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

    // Find the email container within a profile (fallback)
    function findEmailContainer(profile) {
        // Try multiple selectors to find email container
        const selectors = [
            '[class*="email"]',
            '[class*="contact"]',
            '[class*="info"]',
            '[class*="details"]',
            '[class*="data"]',
            'div:has(a[href^="mailto:"])',
            'div:has([class*="email"])'
        ];

        for (const selector of selectors) {
            const container = profile.querySelector(selector);
            if (container) return container;
        }

        // Fallback: look for any container with email-like content
        const allDivs = profile.querySelectorAll('div');
        for (const div of allDivs) {
            if (div.textContent.includes('@') && div.textContent.includes('.')) {
                return div;
            }
        }

        // Additional fallback: look for any element with email
        const emailLinks = profile.querySelectorAll('a[href^="mailto:"]');
        if (emailLinks.length > 0) {
            return emailLinks[0].parentElement;
        }

        return null;
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
            // Find the profile that contains this AI button container
            const profile = findProfileContainingButton(aiButtonContainer);
            openImportModal(profile);
        });

        return button;
    }

    // Extract contact data from profile
    function extractContactData(profile) {
        const data = {
            // Core fields (most important)
            work_email: '',
            first_name: '',
            last_name: '',
            company_name: '',
            main_role_title: '',
            
            // Additional contact info
            work_mobile_phone: '',
            work_phone: '',
            private_email: '',
            private_mobile_phone: '',
            private_phone: '',
            
            // Social profiles
            linkedin_url: '',
            linkedin_sales_url: '',
            facebook_url: '',
            twitter_url: '',
            github_url: '',
            instagram_url: '',
            
            // Professional info
            academic_title: '',
            gender: '',
            summary: '',
            company_domain: '',
            valid_status: 'unverified',
            
            // Location info
            full_address: '',
            country: '',
            region: '',
            city: '',
            postal_code: '',
            
            // Additional fields
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
            
            // Arrays (will be populated if found)
            professional_experiences: [],
            education_experiences: [],
            volunteer_experiences: [],
            accomplishments: [],
            main_professional_experiences: [],
            languages: []
        };

        // Extract name (split into first and last name)
        const nameSelectors = [
            'h3', 'h4', 'h5', 'h6',
            '[class*="name"]', 
            '[class*="title"]',
            '[class*="full-name"]',
            '[class*="person-name"]',
            'span', // Try span elements as well
            'div[class*="name"]'
        ];
        for (const selector of nameSelectors) {
            const nameElement = profile.querySelector(selector);
            if (nameElement && nameElement.textContent.trim()) {
                const fullName = nameElement.textContent.trim();
                // Clean up the name (remove extra spaces, special characters)
                const cleanName = fullName.replace(/\s+/g, ' ').trim();
                const nameParts = cleanName.split(' ');
                data.first_name = nameParts[0] || '';
                data.last_name = nameParts.slice(1).join(' ') || '';
                break;
            }
        }

        // Extract all email addresses
        const emailLinks = profile.querySelectorAll('a[href^="mailto:"]');
        const allEmails = [];
        
        emailLinks.forEach(link => {
            const email = link.href.replace('mailto:', '');
            if (email && !allEmails.includes(email)) {
                allEmails.push(email);
            }
        });
        
        // Also look for masked emails (like ***@company.com)
        const maskedEmailPattern = /\*{3}@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g;
        const maskedEmails = profile.textContent.match(maskedEmailPattern);
        if (maskedEmails) {
            maskedEmails.forEach(email => {
                if (!allEmails.includes(email)) {
                    allEmails.push(email);
                }
            });
        }
        
        // Also try to extract emails from text content (in case they're not links)
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const textEmails = profile.textContent.match(emailPattern);
        if (textEmails) {
            textEmails.forEach(email => {
                if (!allEmails.includes(email)) {
                    allEmails.push(email);
                }
            });
        }
        
        // Set primary work email (first one found)
        if (allEmails.length > 0) {
            data.work_email = allEmails[0];
            
            // If multiple emails, try to identify work vs personal
            if (allEmails.length > 1) {
                // Look for work email (usually contains company domain or is first)
                const workEmail = allEmails.find(email => 
                    email.includes(data.company_domain) || 
                    email.includes('work') ||
                    email.includes('business')
                );
                if (workEmail) {
                    data.work_email = workEmail;
                }
                
                // Set personal email as the other one
                const personalEmail = allEmails.find(email => email !== data.work_email);
                if (personalEmail) {
                    data.private_email = personalEmail;
                }
            }
        }

        // Extract company name - try multiple approaches
        const companySelectors = [
            '[class*="company"]', 
            '[class*="org"]',
            '[class*="organization"]',
            '[class*="firm"]',
            '[class*="employer"]',
            '[class*="current-company"]',
            '[class*="workplace"]'
        ];
        
        // First try to find company in current role text
        const currentRoleSelectors = [
            '[class*="current-role"]',
            '[class*="current-position"]',
            '[class*="current-job"]',
            '[class*="role"]',
            '[class*="position"]',
            '[class*="job"]'
        ];
        
        for (const selector of currentRoleSelectors) {
            const roleElement = profile.querySelector(selector);
            if (roleElement) {
                const roleText = roleElement.textContent.trim();
                // Look for "at Company Name" pattern
                const atMatch = roleText.match(/at\s+([^(]+)/i);
                if (atMatch) {
                    data.company_name = atMatch[1].trim();
                    break;
                }
                // Look for "Company Name" pattern
                const companyMatch = roleText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:LLC|Inc|Corp|Company|Ltd|Group))/);
                if (companyMatch) {
                    data.company_name = companyMatch[1].trim();
                    break;
                }
            }
        }
        
        // If no company found in role text, try direct company selectors
        if (!data.company_name) {
            for (const selector of companySelectors) {
                const companyElement = profile.querySelector(selector);
                if (companyElement && companyElement.textContent.trim()) {
                    data.company_name = companyElement.textContent.trim();
                    break;
                }
            }
        }
        
        // Also try to extract from any text containing company-like patterns
        if (!data.company_name) {
            const allText = profile.textContent;
            const companyPatterns = [
                /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:LLC|Inc|Corp|Company|Ltd|Group|Partners))/g,
                /at\s+([^(]+?)(?:\s+in|\s+\(|$)/gi
            ];
            
            for (const pattern of companyPatterns) {
                const matches = allText.match(pattern);
                if (matches && matches.length > 0) {
                    data.company_name = matches[0].replace(/^at\s+/i, '').trim();
                    break;
                }
            }
        }

        // Extract main role title
        const titleSelectors = [
            '[class*="headline"]', 
            '[class*="position"]', 
            '[class*="role"]',
            '[class*="job-title"]',
            '[class*="title"]',
            '[class*="occupation"]'
        ];
        for (const selector of titleSelectors) {
            const titleElement = profile.querySelector(selector);
            if (titleElement && titleElement.textContent.trim()) {
                data.main_role_title = titleElement.textContent.trim();
                break;
            }
        }

        // Extract phone numbers
        const phoneSelectors = [
            '[class*="phone"]', 
            'a[href^="tel:"]',
            '[class*="mobile"]',
            '[class*="telephone"]',
            '[class*="contact-phone"]'
        ];
        
        const allPhones = [];
        
        phoneSelectors.forEach(selector => {
            const phoneElements = profile.querySelectorAll(selector);
            phoneElements.forEach(phoneElement => {
                let phoneText = phoneElement.textContent.trim() || phoneElement.href.replace('tel:', '');
                
                // Clean up phone text (remove asterisks, underscores, etc.)
                phoneText = phoneText.replace(/[*_\-]/g, '');
                
                if (phoneText && phoneText.length > 5 && !allPhones.includes(phoneText)) {
                    allPhones.push(phoneText);
                }
            });
        });
        
        // Also try to extract phone numbers from text content
        const phonePattern = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
        const textPhones = profile.textContent.match(phonePattern);
        if (textPhones) {
            textPhones.forEach(phone => {
                const cleanPhone = phone.replace(/[*_\-]/g, '');
                if (!allPhones.includes(cleanPhone)) {
                    allPhones.push(cleanPhone);
                }
            });
        }
        
        // Also look for masked phone numbers (like *_-***_***_****)
        const maskedPhonePattern = /[\*_\-]+\s*[\*_\-]+\s*[\*_\-]+\s*[\*_\-]+/g;
        const maskedPhones = profile.textContent.match(maskedPhonePattern);
        if (maskedPhones) {
            maskedPhones.forEach(phone => {
                if (!allPhones.includes(phone)) {
                    allPhones.push(phone);
                }
            });
        }
        
        // Assign phones to appropriate fields
        if (allPhones.length > 0) {
            data.work_phone = allPhones[0];
            if (allPhones.length > 1) {
                data.work_mobile_phone = allPhones[1];
            }
        }

        // Extract LinkedIn URL
        const linkedinLinks = profile.querySelectorAll('a[href*="linkedin.com"]');
        if (linkedinLinks.length > 0) {
            data.linkedin_url = linkedinLinks[0].href;
            // Try to extract LinkedIn Sales Navigator URL
            const salesNavLinks = profile.querySelectorAll('a[href*="linkedin.com/sales"]');
            if (salesNavLinks.length > 0) {
                data.linkedin_sales_url = salesNavLinks[0].href;
            }
        }

        // Extract location information
        const locationSelectors = [
            '[class*="location"]',
            '[class*="locality"]',
            '[class*="address"]',
            '[class*="city"]',
            '[class*="country"]'
        ];
        for (const selector of locationSelectors) {
            const locationElement = profile.querySelector(selector);
            if (locationElement && locationElement.textContent.trim()) {
                const locationText = locationElement.textContent.trim();
                data.full_address = locationText;
                
                // Try to parse city and country
                const parts = locationText.split(',').map(part => part.trim());
                if (parts.length >= 2) {
                    data.city = parts[0];
                    data.country = parts[parts.length - 1];
                } else if (parts.length === 1) {
                    data.city = parts[0];
                }
                break;
            }
        }

        // Extract company domain
        if (data.work_email && data.work_email.includes('@')) {
            data.company_domain = data.work_email.split('@')[1];
        }

        // Extract summary/bio
        const summarySelectors = [
            '[class*="summary"]',
            '[class*="bio"]',
            '[class*="about"]',
            '[class*="description"]'
        ];
        for (const selector of summarySelectors) {
            const summaryElement = profile.querySelector(selector);
            if (summaryElement && summaryElement.textContent.trim()) {
                data.summary = summaryElement.textContent.trim();
                break;
            }
        }

        // Extract avatar URL
        const avatarSelectors = [
            'img[class*="avatar"]',
            'img[class*="profile"]',
            'img[src*="avatar"]',
            'img[src*="profile"]'
        ];
        for (const selector of avatarSelectors) {
            const avatarElement = profile.querySelector(selector);
            if (avatarElement && avatarElement.src) {
                data.avatar_url = avatarElement.src;
                data.full_avatar_url = avatarElement.src;
                break;
            }
        }

        // Extract social media URLs
        const socialSelectors = {
            facebook: 'a[href*="facebook.com"]',
            twitter: 'a[href*="twitter.com"]',
            github: 'a[href*="github.com"]',
            instagram: 'a[href*="instagram.com"]',
            linkedin: 'a[href*="linkedin.com"]'
        };

        Object.entries(socialSelectors).forEach(([platform, selector]) => {
            const socialElements = profile.querySelectorAll(selector);
            socialElements.forEach((socialElement, index) => {
                if (index === 0) {
                    data[`${platform}_url`] = socialElement.href;
                } else {
                    // Store additional social links if available
                    if (!data.additional_social_links) {
                        data.additional_social_links = [];
                    }
                    data.additional_social_links.push({
                        platform: platform,
                        url: socialElement.href
                    });
                }
            });
        });

        // Generate a simple user ID (you might want to extract this from the page if available)
        data.user_id = `contactout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Extract additional metadata
        data.extraction_timestamp = new Date().toISOString();
        data.page_url = window.location.href;
        data.profile_source = 'ContactOut';
        
        // Try to extract profile ID or unique identifier
        const profileIdMatch = window.location.pathname.match(/\/([a-zA-Z0-9-]+)$/);
        if (profileIdMatch) {
            data.profile_id = profileIdMatch[1];
        }
        
        // Extract any additional notes or tags
        const tagElements = profile.querySelectorAll('[class*="tag"], [class*="label"], [class*="badge"]');
        if (tagElements.length > 0) {
            data.tags = Array.from(tagElements).map(tag => tag.textContent.trim());
        }

        // Try to extract professional experiences from the profile text
        const profileText = profile.textContent;
        
        // Look for patterns like "Role at Company (Year - Year)" or "Role at Company in Year - Present"
        const experiencePatterns = [
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+(?:in\s+)?(\d{4})\s*-\s*(Present|\d{4})/gi,
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+\((\d{4})\s*-\s*(Present|\d{4})\)/gi,
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+in\s+(\d{4})\s*-\s*(Present|\d{4})/gi,
            // Also look for patterns with "formerly" or additional info
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+\(formerly\s+([^)]+)\)\s+in\s+(\d{4})\s*-\s*(Present|\d{4})/gi,
            // Look for patterns with just years
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+(\d{4})\s*-\s*(\d{4})/gi
        ];
        
        experiencePatterns.forEach(pattern => {
            const matches = profileText.matchAll(pattern);
            for (const match of matches) {
                const roleTitle = match[1].trim();
                const organizationName = match[2].trim();
                const periodFrom = match[3];
                const periodTo = match[4];
                
                // Skip if it's education (contains "at" followed by university-like names)
                if (organizationName.toLowerCase().includes('university') || 
                    organizationName.toLowerCase().includes('school') ||
                    organizationName.toLowerCase().includes('college')) {
                    continue;
                }
                
                const experience = {
                    role_title: roleTitle,
                    period_from: `${periodFrom}-01-01T00:00:00Z`,
                    period_to: periodTo === 'Present' ? '' : `${periodTo}-12-31T00:00:00Z`,
                    is_current: periodTo === 'Present',
                    organization_name: organizationName,
                    organization_logo_url: '',
                    organization_linkedin_url: '',
                    organization_employee_count_range: '',
                    description_responsibility: ''
                };
                
                // Check if this experience already exists
                const exists = data.professional_experiences.some(exp => 
                    exp.role_title === experience.role_title && 
                    exp.organization_name === experience.organization_name
                );
                
                if (!exists) {
                    data.professional_experiences.push(experience);
                }
            }
        });
        
        // Also try to extract from structured elements
        const experienceSelectors = [
            '[class*="experience"]',
            '[class*="work-history"]',
            '[class*="employment"]',
            '[class*="current-role"]',
            '[class*="previous-role"]'
        ];
        
        experienceSelectors.forEach(selector => {
            const experienceElements = profile.querySelectorAll(selector);
            experienceElements.forEach(expElement => {
                const expText = expElement.textContent.trim();
                
                // Skip if already extracted
                const alreadyExists = data.professional_experiences.some(exp => 
                    expText.includes(exp.role_title) || expText.includes(exp.organization_name)
                );
                
                if (!alreadyExists) {
                    const experience = {
                        role_title: '',
                        period_from: '',
                        period_to: '',
                        is_current: false,
                        organization_name: '',
                        organization_logo_url: '',
                        organization_linkedin_url: '',
                        organization_employee_count_range: '',
                        description_responsibility: ''
                    };

                    // Extract role title
                    const roleElement = expElement.querySelector('[class*="title"], [class*="role"]');
                    if (roleElement) {
                        experience.role_title = roleElement.textContent.trim();
                    }

                    // Extract organization name
                    const orgElement = expElement.querySelector('[class*="company"], [class*="org"]');
                    if (orgElement) {
                        experience.organization_name = orgElement.textContent.trim();
                    }

                    // Extract period
                    const periodElement = expElement.querySelector('[class*="period"], [class*="date"], [class*="duration"]');
                    if (periodElement) {
                        const periodText = periodElement.textContent.trim();
                        if (periodText.includes('Present') || periodText.includes('Current')) {
                            experience.is_current = true;
                        }
                        experience.period_from = periodText;
                    }

                    // Extract description
                    const descElement = expElement.querySelector('[class*="description"], [class*="responsibility"]');
                    if (descElement) {
                        experience.description_responsibility = descElement.textContent.trim();
                    }

                    if (experience.role_title || experience.organization_name) {
                        data.professional_experiences.push(experience);
                    }
                }
            });
        });

        // Try to extract education experiences from profile text
        const educationPatterns = [
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+(?:in\s+)?(\d{4})\s*-\s*(\d{4})/gi,
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+\((\d{4})\s*-\s*(\d{4})\)/gi,
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+in\s+(\d{4})\s*-\s*(\d{4})/gi,
            // Also look for patterns with just years
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+(\d{4})\s*-\s*(\d{4})/gi,
            // Look for patterns with "Fellow Member" or similar
            /([^,\n]+?)\s+at\s+([^,\n]+?)\s+-\s+([^,\n]+?)\s+in\s+(\d{4})\s*-\s*(\d{4})/gi
        ];
        
        educationPatterns.forEach(pattern => {
            const matches = profileText.matchAll(pattern);
            for (const match of matches) {
                const course = match[1].trim();
                const institution = match[2].trim();
                const periodFrom = match[3];
                const periodTo = match[4];
                
                // Only include if it's education (contains university, school, college, etc.)
                if (institution.toLowerCase().includes('university') || 
                    institution.toLowerCase().includes('school') ||
                    institution.toLowerCase().includes('college') ||
                    institution.toLowerCase().includes('institute')) {
                    
                    const education = {
                        course: course,
                        field_of_study: '',
                        grade: '',
                        period_from: `${periodFrom}-01-01T00:00:00Z`,
                        period_to: `${periodTo}-12-31T00:00:00Z`,
                        is_current: false,
                        organization_name: institution,
                        organization_logo_url: '',
                        educational_level_value: '',
                        educational_level_icon_name: '',
                        description: ''
                    };
                    
                    // Determine educational level from course name
                    if (course.toLowerCase().includes('phd') || course.toLowerCase().includes('doctorate')) {
                        education.educational_level_value = "Doctorate";
                    } else if (course.toLowerCase().includes('master') || course.toLowerCase().includes('ms') || course.toLowerCase().includes('mba')) {
                        education.educational_level_value = "Master's Degree";
                    } else if (course.toLowerCase().includes('bachelor') || course.toLowerCase().includes('bs') || course.toLowerCase().includes('ba')) {
                        education.educational_level_value = "Bachelor's Degree";
                    } else if (course.toLowerCase().includes('associate') || course.toLowerCase().includes('aa')) {
                        education.educational_level_value = "Associate's Degree";
                    } else if (course.toLowerCase().includes('high school') || course.toLowerCase().includes('diploma')) {
                        education.educational_level_value = "High School";
                    }
                    
                    // Check if this education already exists
                    const exists = data.education_experiences.some(edu => 
                        edu.course === education.course && 
                        edu.organization_name === education.organization_name
                    );
                    
                    if (!exists) {
                        data.education_experiences.push(education);
                    }
                }
            }
        });
        
        // Also try to extract from structured elements
        const educationSelectors = [
            '[class*="education"]',
            '[class*="academic"]',
            '[class*="degree"]'
        ];
        
        educationSelectors.forEach(selector => {
            const educationElements = profile.querySelectorAll(selector);
            educationElements.forEach(eduElement => {
                const eduText = eduElement.textContent.trim();
                
                // Skip if already extracted
                const alreadyExists = data.education_experiences.some(edu => 
                    eduText.includes(edu.course) || eduText.includes(edu.organization_name)
                );
                
                if (!alreadyExists) {
                    const education = {
                        course: '',
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

                    // Extract course/degree
                    const courseElement = eduElement.querySelector('[class*="course"], [class*="degree"]');
                    if (courseElement) {
                        education.course = courseElement.textContent.trim();
                    }

                    // Extract institution
                    const institutionElement = eduElement.querySelector('[class*="university"], [class*="school"], [class*="institution"]');
                    if (institutionElement) {
                        education.organization_name = institutionElement.textContent.trim();
                    }

                    // Extract field of study
                    const fieldElement = eduElement.querySelector('[class*="field"], [class*="major"]');
                    if (fieldElement) {
                        education.field_of_study = fieldElement.textContent.trim();
                    }

                    if (education.course || education.organization_name) {
                        data.education_experiences.push(education);
                    }
                }
            });
        });

        // Add main professional experience if we have current role
        if (data.main_role_title && data.company_name) {
            data.main_professional_experiences.push({
                role_title: data.main_role_title,
                period_from: new Date().toISOString(),
                period_to: '',
                is_current: true,
                organization_name: data.company_name,
                organization_logo_url: '',
                organization_linkedin_url: '',
                organization_employee_count_range: '',
                main_location_full_address: data.full_address,
                main_location_country: data.country,
                main_location_city: data.city,
                main_location_postal_code: data.postal_code,
                organization_website: '',
                main_location_coord: null,
                employment_type: '',
                industries: [],
                management_level: '',
                money_amount: 0,
                description_responsibility: data.summary,
                career_level_value: '',
                career_level_level: 0,
                career_path: '',
                months_of_experience: 0
            });
        }
        
        // Extract "formerly" information and company changes
        const formerlyPattern = /formerly\s+([^)]+)/gi;
        const formerlyMatches = profileText.match(formerlyPattern);
        if (formerlyMatches) {
            data.former_companies = formerlyMatches.map(match => 
                match.replace(/formerly\s+/i, '').trim()
            );
        }
        
        // Extract any additional company information
        const companyInfoPattern = /\(([^)]+)\)/g;
        const companyInfoMatches = profileText.match(companyInfoPattern);
        if (companyInfoMatches) {
            data.company_additional_info = companyInfoMatches.map(match => 
                match.replace(/[()]/g, '').trim()
            );
        }

        console.log('Extracted comprehensive contact data:', data);
        return data;
    }

    // Open import modal with contact data
    function openImportModal(profile) {
        const contactData = extractContactData(profile);
        
        // Populate modal fields with basic info for display
        const fullName = `${contactData.first_name} ${contactData.last_name}`.trim();
        document.getElementById('import-name').value = fullName;
        document.getElementById('import-email').value = contactData.work_email;
        document.getElementById('import-company').value = contactData.company_name;
        document.getElementById('import-title').value = contactData.main_role_title;
        document.getElementById('import-phone').value = contactData.work_mobile_phone || contactData.work_phone;
        document.getElementById('import-location').value = contactData.full_address;
        document.getElementById('import-linkedin').value = contactData.linkedin_url;
        document.getElementById('import-industry').value = contactData.summary;
        document.getElementById('import-notes').value = '';

        // Store the full contact data for saving
        window.currentContactData = contactData;

        // Show modal
        const modal = document.getElementById(CONFIG.modalId);
        modal.style.display = 'flex';
    }

    // Close import modal
    function closeImportModal() {
        const modal = document.getElementById(CONFIG.modalId);
        modal.style.display = 'none';
    }
    
    // Add event listeners to modal buttons
    function addModalEventListeners() {
        const modal = document.getElementById(CONFIG.modalId);
        if (!modal) return;
        
        // Close button
        const closeBtn = modal.querySelector('.contactout-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeImportModal);
        }
        
        // Cancel button
        const cancelBtn = modal.querySelector('[data-action="cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeImportModal);
        }
        
        // Save button
        const saveBtn = modal.querySelector('[data-action="save"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveContact);
        }
        
        // Export button
        const exportBtn = modal.querySelector('[data-action="export"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportToCSV);
        }
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImportModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeImportModal();
            }
        });
    }

    // Save contact data
    function saveContact() {
        // Get the comprehensive contact data that was extracted
        const comprehensiveData = window.currentContactData || {};
        
        // Add notes from the modal
        comprehensiveData.notes = document.getElementById('import-notes').value;
        comprehensiveData.importedAt = new Date().toISOString();
        comprehensiveData.source = 'ContactOut';
        
        // Log the comprehensive data to console
        console.log('=== COMPREHENSIVE CONTACT DATA SAVED ===');
        console.log(JSON.stringify(comprehensiveData, null, 2));
        console.log('=== END CONTACT DATA ===');
        
        // Also create a simplified version for storage
        const simplifiedData = {
            name: document.getElementById('import-name').value,
            email: document.getElementById('import-email').value,
            company: document.getElementById('import-company').value,
            title: document.getElementById('import-title').value,
            phone: document.getElementById('import-phone').value,
            location: document.getElementById('import-location').value,
            linkedin: document.getElementById('import-linkedin').value,
            industry: document.getElementById('import-industry').value,
            notes: document.getElementById('import-notes').value,
            importedAt: new Date().toISOString(),
            source: 'ContactOut'
        };

        // Store simplified version in Chrome storage
        chrome.storage.local.get(['importedContacts'], function(result) {
            const contacts = result.importedContacts || [];
            contacts.push(simplifiedData);
            
            chrome.storage.local.set({ importedContacts: contacts }, function() {
                console.log('Simplified contact saved to storage:', simplifiedData);
                showNotification('Contact imported successfully!');
                closeImportModal();
            });
        });
        
        // Clear the stored contact data
        window.currentContactData = null;
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'contactout-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add bulk scrape button to the page
    function addBulkScrapeButton() {
        // Look for a good place to add the bulk scrape button
        const buttonContainers = [
            document.querySelector('[class*="header"]'),
            document.querySelector('[class*="toolbar"]'),
            document.querySelector('[class*="actions"]'),
            document.querySelector('[class*="controls"]'),
            document.querySelector('header'),
            document.querySelector('nav')
        ];

        let container = null;
        for (const cont of buttonContainers) {
            if (cont) {
                container = cont;
                break;
            }
        }

        if (!container) {
            // Create a floating button if no container found
            const floatingButton = document.createElement('div');
            floatingButton.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: #28a745;
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            `;
            floatingButton.textContent = '📥 Bulk Scrape';
            floatingButton.onclick = bulkScrapeContacts;
            document.body.appendChild(floatingButton);
        } else {
            // Add button to existing container
            const bulkButton = document.createElement('button');
            bulkButton.textContent = '📥 Bulk Scrape';
            bulkButton.style.cssText = `
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                margin-left: 10px;
                font-weight: 500;
            `;
            bulkButton.onclick = bulkScrapeContacts;
            container.appendChild(bulkButton);
        }
    }

    // Start observing for profile changes
    function startProfileObserver() {
        // Use MutationObserver to watch for new profiles
        const observer = new MutationObserver(function(mutations) {
            let shouldAddButtons = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
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
                setTimeout(addImportButtons, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Export all contacts to CSV
    function exportToCSV() {
        chrome.storage.local.get(['importedContacts'], function(result) {
            const contacts = result.importedContacts || [];
            
            if (contacts.length === 0) {
                showNotification('No contacts to export!');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Email', 'Company', 'Title', 'Phone', 'Location', 'LinkedIn', 'Industry', 'Notes', 'Imported At', 'Source'];
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

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `contactout-contacts-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification(`Exported ${contacts.length} contacts to CSV!`);
        });
    }

    // Bulk scrape all visible contacts
    function bulkScrapeContacts() {
        // Use the same selectors as addImportButtons
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
            if (contactData.name || contactData.email) {
                contactData.importedAt = new Date().toISOString();
                contactData.source = 'ContactOut';
                contacts.push(contactData);
            }
        });

        if (contacts.length > 0) {
            chrome.storage.local.get(['importedContacts'], function(result) {
                const existingContacts = result.importedContacts || [];
                const allContacts = [...existingContacts, ...contacts];
                
                chrome.storage.local.set({ importedContacts: allContacts }, function() {
                    showNotification(`Bulk imported ${contacts.length} contacts!`);
                });
            });
        } else {
            showNotification('No contacts found to scrape!');
        }
    }

    // Make functions globally available for modal
    window.openImportModal = openImportModal;
    window.closeImportModal = closeImportModal;
    window.saveContact = saveContact;
    window.exportToCSV = exportToCSV;
    window.bulkScrapeContacts = bulkScrapeContacts;
    
    // Also add event listeners to ensure buttons work
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('contactout-modal-close') || 
            e.target.closest('.contactout-modal-close')) {
            closeImportModal();
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also initialize after a delay to catch dynamic content
    setTimeout(init, 1000);
    setTimeout(init, 3000);

})(); 