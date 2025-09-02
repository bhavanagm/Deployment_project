// messaging.js - Complete messaging functionality

// 💬 In-App Messaging System
class MessagingSystem {
    constructor() {
        this.currentConversation = null;
        this.messagePollingInterval = null;
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.loadConversations();
    }

    attachEventListeners() {
        // Message form submission
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('message-form')) {
                e.preventDefault();
                this.handleMessageSubmit(e);
            }
        });

        // Contact user buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('contact-user-btn')) {
                const userId = e.target.dataset.userId;
                const bookId = e.target.dataset.bookId;
                this.openMessaging(userId, bookId);
            }
        });

        // Conversation list clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('conversation-item')) {
                const userId = e.target.dataset.userId;
                this.loadConversation(userId);
            }
        });

        // Close messaging modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-messaging')) {
                this.closeMessaging();
            }
        });
    }

    async handleMessageSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        
        const messageData = {
            receiverId: form.dataset.receiverId,
            message: formData.get('message').trim(),
            bookId: form.dataset.bookId || null,
            messageType: 'text'
        };

        if (!messageData.message) {
            this.showAlert('Please enter a message.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            const result = await response.json();

            if (result.success) {
                form.reset();
                await this.loadConversation(messageData.receiverId);
                this.scrollToBottom();
            } else {
                this.showAlert(result.error || 'Error sending message.', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    async loadConversations() {
        // This would load a list of all conversations for the current user
        // For now, we'll focus on individual conversation loading
    }

    async loadConversation(userId) {
        try {
            const response = await fetch(`/api/messages/${userId}`);
            const result = await response.json();

            if (result.success) {
                this.displayConversation(result.messages);
                this.currentConversation = userId;
                this.startMessagePolling();
            } else {
                this.showAlert(result.error || 'Error loading conversation.', 'error');
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            this.showAlert('Network error loading conversation.', 'error');
        }
    }

    displayConversation(messages) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
            return;
        }

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            container.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        const isCurrentUser = message.senderId._id === this.getCurrentUserId();
        
        messageDiv.className = `message-item ${isCurrentUser ? 'own-message' : 'other-message'}`;
        
        const time = new Date(message.createdAt).toLocaleString();
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="sender">${message.senderId.username}</span>
                <span class="timestamp">${time}</span>
            </div>
            <div class="message-content">
                ${this.formatMessageContent(message.message, message.messageType)}
            </div>
            ${message.bookId ? `<div class="message-context">About: ${message.bookId.title}</div>` : ''}
            ${message.isRead ? '' : '<div class="unread-indicator">●</div>'}
        `;

        return messageDiv;
    }

    formatMessageContent(content, type) {
        switch (type) {
            case 'text':
                return `<p>${this.escapeHtml(content)}</p>`;
            case 'book_interest':
                return `<div class="book-interest-message">${this.escapeHtml(content)}</div>`;
            default:
                return `<p>${this.escapeHtml(content)}</p>`;
        }
    }

    openMessaging(userId, bookId = null) {
        let modal = document.getElementById('messaging-modal');
        if (!modal) {
            this.createMessagingModal();
            modal = document.getElementById('messaging-modal');
        }

        // Set up the form
        const form = modal.querySelector('.message-form');
        form.dataset.receiverId = userId;
        if (bookId) {
            form.dataset.bookId = bookId;
        }

        modal.style.display = 'flex';
        this.loadConversation(userId);
    }

    createMessagingModal() {
        const modalHTML = `
            <div id="messaging-modal" class="modal messaging-modal" style="display: none;">
                <div class="modal-content messaging-content">
                    <div class="modal-header">
                        <h3>💬 Messages</h3>
                        <button class="close-messaging">×</button>
                    </div>
                    
                    <div class="messaging-body">
                        <div id="messages-container" class="messages-container">
                            <div class="loading">Loading messages...</div>
                        </div>
                        
                        <form class="message-form">
                            <div class="message-input-group">
                                <textarea name="message" placeholder="Type your message..." 
                                    rows="3" required></textarea>
                                <button type="submit" class="btn-primary send-btn">
                                    📤 Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeMessaging() {
        document.getElementById('messaging-modal').style.display = 'none';
        this.stopMessagePolling();
        this.currentConversation = null;
    }

    startMessagePolling() {
        this.stopMessagePolling();
        
        // Poll for new messages every 5 seconds
        this.messagePollingInterval = setInterval(() => {
            if (this.currentConversation) {
                this.loadConversation(this.currentConversation);
            }
        }, 5000);
    }

    stopMessagePolling() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }

    scrollToBottom() {
        const container = document.getElementById('messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    getCurrentUserId() {
        // This should be set from the session/authentication
        // For now, return a placeholder - in real implementation, 
        // this would come from the authenticated user session
        return window.currentUserId || null;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.messaging-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertHTML = `
            <div class="messaging-alert alert-${type}">
                ${message}
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', alertHTML);

        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.messaging-alert');
            if (alert) alert.remove();
        }, 5000);
    }

    // Utility method to create a quick message button for book listings
    static createContactButton(userId, bookId, bookTitle) {
        return `
            <button class="contact-user-btn btn-secondary" 
                data-user-id="${userId}" 
                data-book-id="${bookId}"
                title="Contact about ${bookTitle}">
                💬 Contact Owner
            </button>
        `;
    }
}

// Initialize messaging system when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.messagingSystem = new MessagingSystem();
    
    // Set current user ID if available from session
    if (typeof currentUser !== 'undefined' && currentUser.id) {
        window.currentUserId = currentUser.id;
    }
});
