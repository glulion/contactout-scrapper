// Contact data extraction utilities
export const extractContactData = (profile) => {
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
    'span',
    'div[class*="name"]'
  ];
  
  for (const selector of nameSelectors) {
    const nameElement = profile.querySelector(selector);
    if (nameElement && nameElement.textContent.trim()) {
      const fullName = nameElement.textContent.trim();
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
  
  // Also try to extract emails from text content
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
      const workEmail = allEmails.find(email => 
        email.includes(data.company_domain) || 
        email.includes('work') ||
        email.includes('business')
      );
      if (workEmail) {
        data.work_email = workEmail;
      }
      
      const personalEmail = allEmails.find(email => email !== data.work_email);
      if (personalEmail) {
        data.private_email = personalEmail;
      }
    }
  }

  // Extract company name
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
      const atMatch = roleText.match(/at\s+([^(]+)/i);
      if (atMatch) {
        data.company_name = atMatch[1].trim();
        break;
      }
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
  
  // Also look for masked phone numbers
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

  // Generate a simple user ID
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

  // Extract professional experiences
  const profileText = profile.textContent;
  
  const experiencePatterns = [
    /([^,\n]+?)\s+at\s+([^,\n]+?)\s+(?:in\s+)?(\d{4})\s*-\s*(Present|\d{4})/gi,
    /([^,\n]+?)\s+at\s+([^,\n]+?)\s+\((\d{4})\s*-\s*(Present|\d{4})\)/gi,
    /([^,\n]+?)\s+at\s+([^,\n]+?)\s+in\s+(\d{4})\s*-\s*(Present|\d{4})/gi,
    /([^,\n]+?)\s+at\s+([^,\n]+?)\s+\(formerly\s+([^)]+)\)\s+in\s+(\d{4})\s*-\s*(Present|\d{4})/gi,
    /([^,\n]+?)\s+at\s+([^,\n]+?)\s+(\d{4})\s*-\s*(\d{4})/gi
  ];
  
  experiencePatterns.forEach(pattern => {
    const matches = profileText.matchAll(pattern);
    for (const match of matches) {
      const roleTitle = match[1].trim();
      const organizationName = match[2].trim();
      const periodFrom = match[3];
      const periodTo = match[4];
      
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
      
      const exists = data.professional_experiences.some(exp => 
        exp.role_title === experience.role_title && 
        exp.organization_name === experience.organization_name
      );
      
      if (!exists) {
        data.professional_experiences.push(experience);
      }
    }
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

  console.log('Extracted comprehensive contact data:', data);
  return data;
};

export const findProfileContainingButton = (buttonContainer) => {
  let currentElement = buttonContainer;
  
  while (currentElement && currentElement !== document.body) {
    const hasName = currentElement.querySelector('h1, h2, h3, h4, h5, h6, [class*="name"]');
    const hasEmail = currentElement.querySelector('a[href^="mailto:"]');
    const hasCompany = currentElement.querySelector('[class*="company"], [class*="org"]');
    
    if (hasName || hasEmail || hasCompany) {
      return currentElement;
    }
    
    currentElement = currentElement.parentElement;
  }
  
  return buttonContainer.parentElement;
}; 