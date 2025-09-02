document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('submitBtn');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  // Password requirements elements
  const lengthReq = document.getElementById('length');
  const uppercaseReq = document.getElementById('uppercase');
  const lowercaseReq = document.getElementById('lowercase');
  const numberReq = document.getElementById('number');

  // Check URL parameters for messages
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  const success = urlParams.get('success');

  if (error === 'exists') {
    showError('Username or email already exists. Please choose different credentials.');
  } else if (error === 'server') {
    showError('Server error occurred. Please try again later.');
  } else if (error === 'validation') {
    showError('Please fill in all fields correctly.');
  }

  if (success === 'true') {
    showSuccess('Account created successfully! You can now login.');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }

  // Real-time password validation
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    
    // Length check
    if (password.length >= 6) {
      lengthReq.classList.remove('invalid');
      lengthReq.classList.add('valid');
    } else {
      lengthReq.classList.remove('valid');
      lengthReq.classList.add('invalid');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      uppercaseReq.classList.remove('invalid');
      uppercaseReq.classList.add('valid');
    } else {
      uppercaseReq.classList.remove('valid');
      uppercaseReq.classList.add('invalid');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      lowercaseReq.classList.remove('invalid');
      lowercaseReq.classList.add('valid');
    } else {
      lowercaseReq.classList.remove('valid');
      lowercaseReq.classList.add('invalid');
    }

    // Number check
    if (/\d/.test(password)) {
      numberReq.classList.remove('invalid');
      numberReq.classList.add('valid');
    } else {
      numberReq.classList.remove('valid');
      numberReq.classList.add('invalid');
    }
  });

  // Password confirmation validation
  confirmPasswordInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const confirmPassword = this.value;

    if (password !== confirmPassword) {
      this.style.borderColor = '#f44336';
    } else {
      this.style.borderColor = '#4caf50';
    }
  });

  // Form submission
  registerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const username = formData.get('username');
    const email = formData.get('email');
    const location = formData.get('location');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Client-side validation
    if (!username || username.length < 3) {
      showError('Username must be at least 3 characters long.');
      return;
    }

    if (!email || !isValidEmail(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    if (!location || location.length < 2) {
      showError('Please enter your location.');
      return;
    }

    if (!isValidPassword(password)) {
      showError('Password must meet all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match.');
      return;
    }

    // Show loading state
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;

    // Create a new XMLHttpRequest (more compatible than fetch)
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/register', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        submitBtn.textContent = 'Create Account 🚀';
        submitBtn.disabled = false;
        
        if (xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              showSuccess('Account created successfully! Redirecting to login...');
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            }
          } catch (e) {
            showSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          }
        } else if (xhr.status === 400) {
          try {
            const data = JSON.parse(xhr.responseText);
            showError(data.message || 'Registration failed. Please try again.');
          } catch (e) {
            showError('Registration failed. Please check your input.');
          }
        } else {
          showError('Server error. Please try again later.');
        }
      }
    };
    
    xhr.onerror = function() {
      submitBtn.textContent = 'Create Account 🚀';
      submitBtn.disabled = false;
      showError('Network error. Please check if the server is running.');
    };
    
    xhr.send(JSON.stringify({
      username,
      email,
      location,
      password
    }));
  });

  // Helper functions
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    // Scroll to top to show message
    document.querySelector('.register-container').scrollTop = 0;
  }

  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    // Scroll to top to show message
    document.querySelector('.register-container').scrollTop = 0;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidPassword(password) {
    return password.length >= 6 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password);
  }

  // Auto-hide messages after 5 seconds
  setTimeout(() => {
    if (errorMessage.style.display === 'block') {
      errorMessage.style.display = 'none';
    }
    if (successMessage.style.display === 'block') {
      successMessage.style.display = 'none';
    }
  }, 5000);
});
