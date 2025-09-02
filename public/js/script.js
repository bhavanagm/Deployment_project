document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menu");
  const toggleBtn = document.getElementById("menu-toggle");

  const loggedInLinks = `
    <li><a href="/profile">👤 Profile</a></li>
    <li><a href="/add-book">➕ Add Book</a></li>
    <li><a href="/gallery">📚 Gallery</a></li>
    <li><a href="/pickup">🚚 Pickup</a></li>
  `;

  const guestLinks = `
    <li><a href="/">🏠 Home</a></li>
    <li><a href="/login">🔐 Login</a></li>
    <li><a href="/register">📝 Register</a></li>
  `;

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  menu.innerHTML = isLoggedIn ? loggedInLinks : guestLinks;

  toggleBtn.addEventListener("click", () => {
    menu.classList.toggle("show");
  });


  // Add Book Form Logic
  const addBookForm = document.getElementById("addBookForm");
  if (addBookForm) {
    const bookIdInput = document.getElementById("bookId");
    const imageInput = document.getElementById("image");
    const previewImg = document.getElementById("previewImg");
    const confirmDiv = document.getElementById("confirmation");
    const confirmBookId = document.getElementById("confirmBookId");

    const generateBookId = () => 'BOOK' + Date.now();
    if (bookIdInput) {
      bookIdInput.value = generateBookId();
    }

    if (imageInput && previewImg) {
      imageInput.addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewImg.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    }

    addBookForm.addEventListener("submit", function (e) {
      if (confirmDiv && confirmBookId) {
        confirmBookId.textContent = bookIdInput.value;
        confirmDiv.classList.remove("hidden");
      }
    });
  }

  // Pickup Form Logic
  const pickupForm = document.getElementById("pickupForm");
  if (pickupForm) {
    const confirmMsg = document.getElementById("confirmationMsg");
    const confirmName = document.getElementById("confirmName");
    const confirmBook = document.getElementById("confirmBook");
    const confirmEmail = document.getElementById("confirmEmail");

    pickupForm.addEventListener("submit", function (e) {
      if (confirmMsg && confirmName && confirmBook && confirmEmail) {
        confirmName.textContent = document.getElementById("userName").value;
        confirmBook.textContent = document.getElementById("bookTitle").value;
        confirmEmail.textContent = document.getElementById("email").value;
        confirmMsg.classList.remove("hidden");
      }
    });
  }

  // Login Form Logic
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value.trim();
      if (!email || !password) {
        e.preventDefault();
        alert("Please enter both email and password.");
      } else {
        localStorage.setItem("loggedIn", "true");
      }
    });
  }

  // Zoom Modal Logic (Optional: only if you have modal setup)
  const modal = document.getElementById("zoomModal");
  const modalImg = document.getElementById("zoomImg");
  const closeBtn = document.querySelector(".zoom-close");

  if (modal && modalImg && closeBtn) {
    document.querySelectorAll(".book-card img").forEach(img => {
      img.addEventListener("click", () => {
        modal.style.display = "block";
        modalImg.src = img.src;
      });
    });

    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    window.addEventListener("click", e => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  // Chatbot functionality
  const chatLauncher = document.getElementById("chat-launcher");
  const chatWidget = document.getElementById("chat-widget");
  const closeChat = document.getElementById("close-chat");
  const sendBtn = document.getElementById("send-btn");
  const voiceBtn = document.getElementById("voice-btn");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  let isListening = false;
  let recognition;

  // Initialize speech recognition if available
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      userInput.value = transcript;
      sendMessage(transcript);
      isListening = false;
      voiceBtn.textContent = '🎤';
      voiceBtn.style.background = '';
    };

    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      isListening = false;
      voiceBtn.textContent = '🎤';
      voiceBtn.style.background = '';
      addMessageToChat('bot', '❌ Sorry, I couldn\'t hear you clearly. Please try again or type your message.');
    };

    recognition.onend = function() {
      isListening = false;
      voiceBtn.textContent = '🎤';
      voiceBtn.style.background = '';
    };
  }

  // Chat launcher click event
  if (chatLauncher) {
    chatLauncher.addEventListener("click", () => {
      chatWidget.classList.remove("hidden");
      userInput.focus();
      // Add welcome message if chat is empty
      if (chatBox && chatBox.children.length === 0) {
        addMessageToChat('bot', '👋 Hello! I\'m Elina, your BookSwap assistant! How can I help you today?');
      }
    });
  }

  // Close chat
  if (closeChat) {
    closeChat.addEventListener("click", () => {
      chatWidget.classList.add("hidden");
    });
  }

  // Send message on button click
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const message = userInput.value.trim();
      if (message) {
        sendMessage(message);
      }
    });
  }

  // Send message on Enter key
  if (userInput) {
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
          sendMessage(message);
        }
      }
    });
  }

  // Voice input
  if (voiceBtn && recognition) {
    voiceBtn.addEventListener("click", () => {
      if (!isListening) {
        recognition.start();
        isListening = true;
        voiceBtn.textContent = '🔴';
        voiceBtn.style.background = '#ff4444';
        addMessageToChat('bot', '🎤 Listening... Please speak now.');
      } else {
        recognition.stop();
        isListening = false;
        voiceBtn.textContent = '🎤';
        voiceBtn.style.background = '';
      }
    });
  } else if (voiceBtn) {
    // Hide voice button if speech recognition is not supported
    voiceBtn.style.display = 'none';
  }

  // Function to send message to chatbot API
  async function sendMessage(message) {
    if (!message.trim()) return;

    // Add user message to chat
    addMessageToChat('user', message);
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      // Remove typing indicator
      removeTypingIndicator();

      if (data.reply) {
        // Add bot response with slight delay for natural feel
        setTimeout(() => {
          addMessageToChat('bot', data.reply);
          // Speak the response if speech synthesis is available
          speakResponse(data.reply);
        }, 300);
      } else {
        addMessageToChat('bot', '❌ Sorry, I\'m having trouble understanding. Please try again.');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      removeTypingIndicator();
      addMessageToChat('bot', '❌ I\'m having connection issues. Please check your internet and try again.');
    }
  }

  // Function to add message to chat
  function addMessageToChat(sender, message) {
    if (!chatBox) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (sender === 'user') {
      messageDiv.innerHTML = `
        <div class="message-content user-message">
          <p>${escapeHtml(message)}</p>
          <span class="timestamp">${timestamp}</span>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-content bot-message">
          <strong>Elina:</strong>
          <p>${formatBotMessage(message)}</p>
          <span class="timestamp">${timestamp}</span>
        </div>
      `;
    }

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Function to show typing indicator
  function showTypingIndicator() {
    if (!chatBox) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message bot typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content bot-message">
        <strong>Elina:</strong>
        <p class="typing-dots">
          <span>.</span><span>.</span><span>.</span>
        </p>
      </div>
    `;
    
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Function to remove typing indicator
  function removeTypingIndicator() {
    const typingIndicator = chatBox?.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  // Function to format bot messages (preserve line breaks)
  function formatBotMessage(message) {
    return escapeHtml(message).replace(/\n/g, '<br>');
  }

  // Function to escape HTML
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Function to speak response using Text-to-Speech
  function speakResponse(text) {
    if ('speechSynthesis' in window) {
      // Clean text for speech (remove emojis and special characters)
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      
      // Use a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Google UK English Female'));
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }
});



  