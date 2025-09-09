// Enhanced Chatbot Frontend
class BookSwapChatbot {
    constructor() {
        this.chatContainer = null;
        this.chatMessages = null;
        this.chatInput = null;
        this.isOpen = false;
        this.isTyping = false;
        this.messageHistory = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
        
        this.init();
        this.loadHistory();
    }

    init() {
        this.createChatInterface();
        this.attachEventListeners();
        this.showWelcomeMessage();
    }

    createChatInterface() {
        // Create chatbot container
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'chatbot-container';
        this.chatContainer.className = 'chatbot-container';
        
        this.chatContainer.innerHTML = `
            <div class="chatbot-header">
                <div class="chatbot-avatar">
                    <span>📚</span>
                </div>
                <div class="chatbot-title">
                    <h4>Elina - BookSwap Assistant</h4>
                    <span class="chatbot-status">Online</span>
                </div>
                <button class="chatbot-close" id="chatbot-close">×</button>
            </div>
            
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chatbot-welcome">
                    <div class="avatar bot-avatar">📚</div>
                    <div class="message bot-message">
                        <p>Hi! I'm Elina, your BookSwap assistant! 🌟</p>
                        <p>I can help you with:</p>
                        <div class="quick-actions">
                            <button class="quick-btn" data-msg="recommend books">📚 Book Recommendations</button>
                            <button class="quick-btn" data-msg="how to donate">📖 How to Donate</button>
                            <button class="quick-btn" data-msg="how to swap">🔄 How to Swap</button>
                            <button class="quick-btn" data-msg="pickup service">🚚 Pickup Service</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="chatbot-typing" id="chatbot-typing" style="display: none;">
                <div class="avatar bot-avatar">📚</div>
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            
            <div class="chatbot-input-container">
                <div class="suggested-questions" id="suggested-questions">
                    <button class="suggestion-btn" data-msg="what books do you recommend?">Book recommendations?</button>
                    <button class="suggestion-btn" data-msg="how do I donate books?">How to donate?</button>
                    <button class="suggestion-btn" data-msg="tell me about pickup service">Pickup service?</button>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Ask me anything about books..." maxlength="200">
                    <button id="chatbot-send" class="chatbot-send-btn">
                        <span>📤</span>
                    </button>
                </div>
            </div>
        `;

        // Create toggle button
        const toggleButton = document.createElement('div');
        toggleButton.id = 'chatbot-toggle';
        toggleButton.className = 'chatbot-toggle';
        toggleButton.innerHTML = `
            <div class="chatbot-icon">
                <span>💬</span>
            </div>
            <div class="chatbot-badge" id="chatbot-badge">1</div>
        `;

        document.body.appendChild(this.chatContainer);
        document.body.appendChild(toggleButton);

        // Get references
        this.chatMessages = document.getElementById('chatbot-messages');
        this.chatInput = document.getElementById('chatbot-input');
    }

    attachEventListeners() {
        // Toggle chat
        document.getElementById('chatbot-toggle').addEventListener('click', () => {
            this.toggleChat();
        });

        // Close chat
        document.getElementById('chatbot-close').addEventListener('click', () => {
            this.closeChat();
        });

        // Send message on Enter
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Send button
        document.getElementById('chatbot-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn') || e.target.classList.contains('suggestion-btn')) {
                const message = e.target.getAttribute('data-msg');
                this.chatInput.value = message;
                this.sendMessage();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.chatContainer.classList.add('chatbot-open');
        this.isOpen = true;
        this.chatInput.focus();
        
        // Hide notification badge
        const badge = document.getElementById('chatbot-badge');
        if (badge) {
            badge.style.display = 'none';
        }
        
        // Scroll to bottom
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    }

    closeChat() {
        this.chatContainer.classList.remove('chatbot-open');
        this.isOpen = false;
    }

    showWelcomeMessage() {
        if (this.messageHistory.length === 0) {
            // Show notification badge for new users
            const badge = document.getElementById('chatbot-badge');
            if (badge) {
                badge.style.display = 'block';
            }
        }
    }

    loadHistory() {
        this.messageHistory.forEach(msg => {
            this.displayMessage(msg.text, msg.isUser, false);
        });
        this.scrollToBottom();
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Display user message
        this.displayMessage(message, true);
        this.chatInput.value = '';
        
        // Hide suggestions
        document.getElementById('suggested-questions').style.display = 'none';
        
        // Show typing indicator
        this.showTyping();

        try {
            const response = await fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            
            // Hide typing indicator
            this.hideTyping();
            
            // Display bot response
            this.displayMessage(data.reply, false);
            
        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTyping();
            this.displayMessage('Sorry, I\'m having trouble connecting right now. Please try again! 🤖', false);
        }
    }

    displayMessage(text, isUser, saveToHistory = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message-container ${isUser ? 'user-message-container' : 'bot-message-container'}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="avatar ${isUser ? 'user-avatar' : 'bot-avatar'}">
                ${isUser ? '👤' : '📚'}
            </div>
            <div class="message ${isUser ? 'user-message' : 'bot-message'}">
                ${this.formatMessage(text)}
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Save to history
        if (saveToHistory) {
            this.messageHistory.push({ text, isUser, timestamp });
            if (this.messageHistory.length > 100) {
                this.messageHistory = this.messageHistory.slice(-100); // Keep last 100 messages
            }
            localStorage.setItem('chatbot_history', JSON.stringify(this.messageHistory));
        }
    }

    formatMessage(text) {
        // Convert line breaks to HTML
        let formatted = text.replace(/\n/g, '<br>');
        
        // Convert bullet points
        formatted = formatted.replace(/• /g, '• ');
        
        // Convert numbered lists
        formatted = formatted.replace(/(\d+\. )/g, '<strong>$1</strong>');
        
        return `<p>${formatted}</p>`;
    }

    showTyping() {
        this.isTyping = true;
        document.getElementById('chatbot-typing').style.display = 'flex';
        this.scrollToBottom();
    }

    hideTyping() {
        this.isTyping = false;
        document.getElementById('chatbot-typing').style.display = 'none';
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    clearHistory() {
        this.messageHistory = [];
        localStorage.removeItem('chatbot_history');
        this.chatMessages.innerHTML = '';
        this.showWelcomeMessage();
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new BookSwapChatbot();
    
    // Global function to clear chat history
    window.clearChatHistory = () => chatbot.clearHistory();
});

// Chatbot styles are now in external CSS file: /css/chatbot.css
// This file is loaded by pages that include the chatbot
