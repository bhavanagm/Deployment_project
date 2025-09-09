/* =============================================================================
   PICKUP FORM VALIDATION SYSTEM
   Enhanced validation with real-time feedback and comprehensive checks
   ============================================================================= */

class PickupFormValidator {
  constructor() {
    this.form = document.getElementById('pickupForm');
    this.errors = {};
    this.validators = {
      name: this.validateName.bind(this),
      email: this.validateEmail.bind(this),
      mobile: this.validateMobile.bind(this),
      address: this.validateAddress.bind(this),
      pickupType: this.validatePickupType.bind(this),
      bookTitle: this.validateBookTitle.bind(this),
      pickupDate: this.validatePickupDate.bind(this),
      pickupTime: this.validatePickupTime.bind(this),
      terms: this.validateTerms.bind(this)
    };
    
    this.init();
  }

  init() {
    if (!this.form) return;

    // Add real-time validation listeners
    this.addEventListeners();
    
    // Set up form submission handler
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Initialize date constraints
    this.setDateConstraints();
    
    console.log('✅ Pickup form validation system initialized');
  }

  addEventListeners() {
    const fields = ['userName', 'email', 'mobile', 'pickupAddress', 'pickupType', 'bookTitle', 'pickupDate', 'pickupTime'];
    
    fields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('blur', () => this.validateField(fieldId));
        field.addEventListener('input', () => this.clearError(fieldId));
      }
    });

    // Special handling for terms checkbox
    const termsField = document.getElementById('terms');
    if (termsField) {
      termsField.addEventListener('change', () => this.validateField('terms'));
    }
  }

  setDateConstraints() {
    const dateField = document.getElementById('pickupDate');
    if (dateField) {
      const today = new Date().toISOString().split('T')[0];
      dateField.min = today;
      
      // Set max date to 30 days from today
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      dateField.max = maxDate.toISOString().split('T')[0];
    }
  }

  validateField(fieldName) {
    const validator = this.validators[fieldName];
    if (validator) {
      const result = validator();
      this.displayError(fieldName, result);
      return result.isValid;
    }
    return true;
  }

  validateName() {
    const field = document.getElementById('userName');
    const value = field ? field.value.trim() : '';

    if (!value) {
      return { isValid: false, message: 'Full name is required' };
    }

    if (value.length < 2) {
      return { isValid: false, message: 'Name must be at least 2 characters long' };
    }

    if (value.length > 50) {
      return { isValid: false, message: 'Name must not exceed 50 characters' };
    }

    if (!/^[A-Za-z\s.-]+$/.test(value)) {
      return { isValid: false, message: 'Name can only contain letters, spaces, dots, and hyphens' };
    }

    // Check for consecutive spaces or special characters
    if (/\s{2,}/.test(value) || /[.-]{2,}/.test(value)) {
      return { isValid: false, message: 'Name cannot contain consecutive spaces or special characters' };
    }

    return { isValid: true, message: '' };
  }

  validateEmail() {
    const field = document.getElementById('email');
    const value = field ? field.value.trim().toLowerCase() : '';

    if (!value) {
      return { isValid: false, message: 'Email address is required' };
    }

    // Comprehensive email validation regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(value)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }

    if (value.length > 254) {
      return { isValid: false, message: 'Email address is too long' };
    }

    return { isValid: true, message: '' };
  }

  validateMobile() {
    const field = document.getElementById('mobile');
    const value = field ? field.value.trim() : '';

    if (!value) {
      return { isValid: false, message: 'Mobile number is required' };
    }

    // Remove all non-digit characters except + for country code
    const cleanNumber = value.replace(/[^\d+]/g, '');
    
    // Check for valid mobile number patterns
    const patterns = [
      /^\+91[6-9]\d{9}$/, // Indian mobile with +91
      /^[6-9]\d{9}$/, // Indian mobile without country code
      /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/, // US mobile
      /^\+44[1-9]\d{8,9}$/, // UK mobile
      /^\+\d{1,3}[1-9]\d{6,14}$/ // International format
    ];

    const isValid = patterns.some(pattern => pattern.test(cleanNumber));
    
    if (!isValid) {
      return { isValid: false, message: 'Please enter a valid mobile number (10-15 digits)' };
    }

    // Update field value with cleaned number
    if (field) {
      field.value = cleanNumber;
    }

    return { isValid: true, message: '' };
  }

  validateAddress() {
    const field = document.getElementById('pickupAddress');
    const value = field ? field.value.trim() : '';

    if (!value) {
      return { isValid: false, message: 'Pickup address is required' };
    }

    if (value.length < 10) {
      return { isValid: false, message: 'Address must be at least 10 characters long' };
    }

    if (value.length > 500) {
      return { isValid: false, message: 'Address must not exceed 500 characters' };
    }

    // Check for meaningful content (not just spaces or repeated characters)
    if (!/[a-zA-Z]{3,}.*[a-zA-Z]{3,}/.test(value)) {
      return { isValid: false, message: 'Please provide a complete address with street, area, and city' };
    }

    return { isValid: true, message: '' };
  }

  validatePickupType() {
    const field = document.getElementById('pickupType');
    const value = field ? field.value : '';

    if (!value) {
      return { isValid: false, message: 'Please select a pickup type' };
    }

    const validTypes = ['single', 'multiple', 'donation', 'swap'];
    if (!validTypes.includes(value)) {
      return { isValid: false, message: 'Please select a valid pickup type' };
    }

    return { isValid: true, message: '' };
  }

  validateBookTitle() {
    const field = document.getElementById('bookTitle');
    const value = field ? field.value.trim() : '';

    if (!value) {
      return { isValid: false, message: 'Book title is required' };
    }

    if (value.length < 2) {
      return { isValid: false, message: 'Book title must be at least 2 characters long' };
    }

    if (value.length > 1000) {
      return { isValid: false, message: 'Book titles list is too long (max 1000 characters)' };
    }

    // For multiple books, validate each line
    const books = value.split('\n').filter(book => book.trim());
    const pickupType = document.getElementById('pickupType')?.value;
    
    if (pickupType === 'multiple' && books.length < 2) {
      return { isValid: false, message: 'For multiple book pickup, please enter at least 2 books (one per line)' };
    }

    if (books.length > 20) {
      return { isValid: false, message: 'Maximum 20 books allowed per pickup request' };
    }

    // Validate each book title
    for (let i = 0; i < books.length; i++) {
      const book = books[i].trim();
      if (book.length < 2) {
        return { isValid: false, message: `Book ${i + 1}: Title must be at least 2 characters long` };
      }
      if (book.length > 100) {
        return { isValid: false, message: `Book ${i + 1}: Title too long (max 100 characters)` };
      }
    }

    return { isValid: true, message: '' };
  }

  validatePickupDate() {
    const field = document.getElementById('pickupDate');
    const value = field ? field.value : '';

    if (!value) {
      return { isValid: false, message: 'Pickup date is required' };
    }

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { isValid: false, message: 'Pickup date cannot be in the past' };
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    maxDate.setHours(23, 59, 59, 999);

    if (selectedDate > maxDate) {
      return { isValid: false, message: 'Pickup date cannot be more than 30 days from today' };
    }

    // Check if it's a weekend (optional warning)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      this.showWarning('pickupDate', 'Weekend pickup may have limited availability');
    }

    return { isValid: true, message: '' };
  }

  validatePickupTime() {
    const field = document.getElementById('pickupTime');
    const value = field ? field.value : '';

    if (!value) {
      return { isValid: false, message: 'Pickup time slot is required' };
    }

    const validTimes = ['09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00'];
    if (!validTimes.includes(value)) {
      return { isValid: false, message: 'Please select a valid time slot' };
    }

    return { isValid: true, message: '' };
  }

  validateTerms() {
    const field = document.getElementById('terms');
    const isChecked = field ? field.checked : false;

    if (!isChecked) {
      return { isValid: false, message: 'You must agree to the terms and conditions' };
    }

    return { isValid: true, message: '' };
  }

  validateAll() {
    const results = {};
    let isValid = true;

    Object.keys(this.validators).forEach(fieldName => {
      const result = this.validateField(fieldName);
      results[fieldName] = result;
      if (!result) isValid = false;
    });

    return { isValid, results };
  }

  displayError(fieldName, result) {
    const errorElementId = this.getErrorElementId(fieldName);
    const errorElement = document.getElementById(errorElementId);
    const field = this.getFieldElement(fieldName);

    if (errorElement) {
      if (!result.isValid) {
        errorElement.textContent = result.message;
        errorElement.style.display = 'block';
        if (field) {
          field.classList.add('error');
          field.setAttribute('aria-invalid', 'true');
        }
      } else {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        if (field) {
          field.classList.remove('error');
          field.removeAttribute('aria-invalid');
        }
      }
    }
  }

  clearError(fieldName) {
    const errorElementId = this.getErrorElementId(fieldName);
    const errorElement = document.getElementById(errorElementId);
    const field = this.getFieldElement(fieldName);

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.style.display = 'none';
    }
    
    if (field) {
      field.classList.remove('error');
      field.removeAttribute('aria-invalid');
    }
  }

  showWarning(fieldName, message) {
    const errorElementId = this.getErrorElementId(fieldName);
    const errorElement = document.getElementById(errorElementId);

    if (errorElement) {
      errorElement.textContent = `⚠️ ${message}`;
      errorElement.style.color = '#F59E0B';
      errorElement.style.display = 'block';
    }
  }

  getErrorElementId(fieldName) {
    const errorMapping = {
      userName: 'userNameError',
      email: 'emailError',
      mobile: 'mobileError',
      pickupAddress: 'addressError',
      pickupType: 'pickupTypeError',
      bookTitle: 'bookTitleError',
      pickupDate: 'dateError',
      pickupTime: 'timeError',
      terms: 'termsError'
    };

    return errorMapping[fieldName] || `${fieldName}Error`;
  }

  getFieldElement(fieldName) {
    const fieldMapping = {
      userName: 'userName',
      email: 'email',
      mobile: 'mobile',
      pickupAddress: 'pickupAddress',
      pickupType: 'pickupType',
      bookTitle: 'bookTitle',
      pickupDate: 'pickupDate',
      pickupTime: 'pickupTime',
      terms: 'terms'
    };

    const fieldId = fieldMapping[fieldName] || fieldName;
    return document.getElementById(fieldId);
  }

  handleSubmit(event) {
    event.preventDefault();
    
    // Show loading state
    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = '📤 Validating...';

    // Validate all fields
    const validation = this.validateAll();
    
    if (!validation.isValid) {
      // Scroll to first error
      this.scrollToFirstError();
      
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.textContent = originalText;
      
      return;
    }

    // If validation passes, prepare and submit data
    this.submitForm(submitBtn, originalText);
  }

  async submitForm(submitBtn, originalText) {
    try {
      submitBtn.textContent = '📤 Submitting...';

      const formData = this.collectFormData();
      
      const response = await fetch('/api/pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!result.success) {
        if (result.errors) {
          // Display server validation errors
          Object.entries(result.errors).forEach(([field, message]) => {
            this.displayError(field, { isValid: false, message });
          });
          this.scrollToFirstError();
        } else {
          this.showAlert('error', result.message || 'Submission failed. Please try again.');
        }
        
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.textContent = originalText;
        return;
      }

      // Success - show confirmation
      this.showSuccessMessage(result);
      
      // Clear saved draft
      localStorage.removeItem('pickupFormDraft');

    } catch (error) {
      console.error('Form submission error:', error);
      this.showAlert('error', 'Network error. Please check your connection and try again.');
      
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
      submitBtn.textContent = originalText;
    }
  }

  collectFormData() {
    return {
      userName: document.getElementById('userName').value.trim(),
      email: document.getElementById('email').value.trim().toLowerCase(),
      mobile: document.getElementById('mobile').value.trim(),
      pickupAddress: document.getElementById('pickupAddress').value.trim(),
      pickupType: document.getElementById('pickupType').value,
      bookTitle: document.getElementById('bookTitle').value.trim(),
      preferredDate: document.getElementById('pickupDate').value,
      preferredTime: document.getElementById('pickupTime').value,
      specialInstructions: document.getElementById('specialInstructions')?.value.trim() || '',
      notificationPreferences: {
        sms: document.getElementById('notifications')?.checked || true,
        email: true,
        push: true
      },
      bookId: new URLSearchParams(window.location.search).get('bookId'),
      timestamp: new Date().toISOString()
    };
  }

  showSuccessMessage(result) {
    const confirmMsg = document.getElementById('confirmationMsg');
    const formData = this.collectFormData();
    
    if (confirmMsg) {
      // Update the existing confirmation message elements
      document.getElementById('confirmName').textContent = formData.userName;
      document.getElementById('confirmBook').textContent = formData.bookTitle;
      document.getElementById('confirmEmail').textContent = formData.email;
      document.getElementById('trackingIdDisplay').textContent = result.trackingId;
      
      // Store tracking ID globally for copy function
      window.currentTrackingId = result.trackingId;
      
      // Hide form sections
      document.querySelector('.book-selection').style.display = 'none';
      document.getElementById('pickupForm').style.display = 'none';
      confirmMsg.classList.remove('hidden');
      confirmMsg.style.display = 'block';
      
      // Scroll to confirmation
      confirmMsg.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showAlert(type, message) {
    // Create alert element if it doesn't exist
    let alert = document.getElementById('pickup-alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.id = 'pickup-alert';
      alert.style.cssText = `
        position: fixed;
        top: 100px;
        right: var(--space-lg);
        max-width: 400px;
        padding: var(--space-lg);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 1500;
        font-weight: 500;
        animation: slideInRight var(--transition-normal) ease;
      `;
      document.body.appendChild(alert);
    }

    const colors = {
      success: { bg: 'var(--success)', text: 'white' },
      error: { bg: 'var(--error)', text: 'white' },
      warning: { bg: 'var(--warning)', text: 'white' },
      info: { bg: 'var(--info)', text: 'white' }
    };

    const color = colors[type] || colors.info;
    alert.style.background = color.bg;
    alert.style.color = color.text;
    alert.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-md);">
        <div>${message}</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; padding: 0; opacity: 0.7;">
          &times;
        </button>
      </div>
    `;

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (alert && alert.parentElement) {
        alert.remove();
      }
    }, 5000);
  }

  scrollToFirstError() {
    const errorElements = document.querySelectorAll('.error[style*="block"]:not([style*="none"])');
    if (errorElements.length > 0) {
      errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if pickup form exists
  if (document.getElementById('pickupForm')) {
    window.pickupValidator = new PickupFormValidator();
  }
});

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PickupFormValidator;
}
