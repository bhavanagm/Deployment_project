document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const loginButton = document.getElementById("loginButton");
  const successMessage = document.getElementById("successMessage");
  const errorMessage = document.getElementById("errorMessage");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const passwordToggle = document.getElementById("passwordToggle");
  const passwordIcon = document.getElementById("passwordIcon");

  // URL parameter handling for messages
  const urlParams = new URLSearchParams(window.location.search);
  
  // Handle success messages
  const success = urlParams.get('success');
  if (success === 'registered') {
    showMessage(successMessage, '✅ Account created successfully! You can now login.');
  }
  
  // Handle error messages
  const error = urlParams.get('error');
  const message = urlParams.get('message');
  
  if (error) {
    let errorText = 'An error occurred. Please try again.';
    
    switch(error) {
      case 'invalid':
        errorText = '❌ Invalid username/email or password.';
        break;
      case 'server':
        errorText = '🔧 Server error. Please try again later.';
        break;
      case 'validation':
        errorText = message ? decodeURIComponent(message) : '⚠️ Please check your input.';
        break;
      default:
        errorText = message ? decodeURIComponent(message) : errorText;
    }
    
    showMessage(errorMessage, errorText);
  }

  // Form submission handling
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Basic client-side validation
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      showMessage(errorMessage, '⚠️ Please fill in all fields.');
      return;
    }
    
    if (password.length < 6) {
      showMessage(errorMessage, '⚠️ Password must be at least 6 characters long.');
      return;
    }
    
    // Show loading state
    setLoadingState(true);
    hideMessages();
    
    // Submit the form
    const formData = new URLSearchParams({
      username: username,
      password: password
    });
    
    fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    })
    .then(response => {
      if (response.redirected) {
        // Successful login - redirect to the new page
        window.location.href = response.url;
        return;
      }
      
      // Handle error responses
      return response.text().then(text => {
        setLoadingState(false);
        
        if (response.status === 401) {
          showMessage(errorMessage, '❌ Invalid username/email or password.');
        } else if (response.status === 429) {
          showMessage(errorMessage, '🚫 Too many login attempts. Please try again later.');
        } else if (response.status === 400) {
          showMessage(errorMessage, '⚠️ Please fill in all required fields.');
        } else {
          showMessage(errorMessage, '🔧 Login failed. Please try again.');
        }
      });
    })
    .catch(error => {
      console.error('Login error:', error);
      setLoadingState(false);
      showMessage(errorMessage, '🌐 Network error. Please check your connection and try again.');
    });
  });

  // Input validation and styling
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('input', function() {
      hideMessages();
      
      // Remove error styling
      input.style.borderColor = '';
      
      // Basic validation styling
      if (input.value.trim()) {
        input.style.borderColor = '#10b981';
      }
    });
    
    input.addEventListener('blur', function() {
      if (!input.value.trim()) {
        input.style.borderColor = '#ef4444';
      }
    });
  });

  // Password visibility toggle
  if (passwordToggle && passwordIcon) {
    passwordToggle.addEventListener('click', function() {
      const isPasswordVisible = passwordInput.type === 'text';
      
      passwordInput.type = isPasswordVisible ? 'password' : 'text';
      passwordIcon.textContent = isPasswordVisible ? '👁️' : '🙈';
      
      // Keep focus on password input
      passwordInput.focus();
    });
  }

  // Helper functions
  function showMessage(element, text) {
    const span = element.querySelector('span');
    if (span) {
      span.textContent = text;
    }
    element.style.display = 'flex';
    
    // Auto-hide after 8 seconds for success messages
    if (element === successMessage) {
      setTimeout(() => {
        element.style.display = 'none';
      }, 8000);
    }
  }
  
  function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
  }
  
  function setLoadingState(loading) {
    if (loading) {
      loginButton.classList.add('loading');
      loginButton.disabled = true;
      loginButton.innerHTML = '<span>Signing In...</span>';
    } else {
      loginButton.classList.remove('loading');
      loginButton.disabled = false;
      loginButton.innerHTML = '<span>Sign In</span>';
    }
  }
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Enter key to submit form when focused on inputs
    if (e.key === 'Enter' && (document.activeElement === usernameInput || document.activeElement === passwordInput)) {
      e.preventDefault();
      loginForm.dispatchEvent(new Event('submit'));
    }
    
    // Escape key to clear messages
    if (e.key === 'Escape') {
      hideMessages();
    }
  });
  
  // Clear URL parameters after handling
  if (window.history.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});
