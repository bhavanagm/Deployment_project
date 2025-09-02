// 🔔 Notification System
class NotificationSystem {
    constructor() {
        this.pollingInterval = null;
        this.notificationsList = [];
        this.init();
    }

    init() {
        this.createNotificationUI();
        this.attachEventListeners();
        this.loadNotifications();
        this.startPolling();
    }

    attachEventListeners() {
        // Notification bell click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('notification-bell') || e.target.closest('.notification-bell')) {
                this.toggleNotificationPanel();
            }
        });

        // Mark notification as read
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('mark-read-btn')) {
                const notificationId = e.target.dataset.notificationId;
                this.markAsRead(notificationId);
            }
        });

        // Close notification panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notifications-panel');
            const bell = document.querySelector('.notification-bell');
            
            if (panel && !panel.contains(e.target) && !bell.contains(e.target)) {
                panel.style.display = 'none';
            }
        });

        // Clear all notifications
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clear-all-btn')) {
                this.clearAllNotifications();
            }
        });
    }

    createNotificationUI() {
        // Add notification bell to navbar if it doesn't exist
        const navbar = document.querySelector('.navbar') || document.querySelector('nav');
        if (navbar && !document.querySelector('.notification-bell')) {
            const bellHTML = `
                <div class="notification-bell" title="Notifications">
                    <span class="bell-icon">🔔</span>
                    <span class="notification-count" style="display: none;">0</span>
                </div>
            `;
            navbar.insertAdjacentHTML('beforeend', bellHTML);
        }

        // Create notification panel
        if (!document.getElementById('notifications-panel')) {
            const panelHTML = `
                <div id="notifications-panel" class="notifications-panel" style="display: none;">
                    <div class="panel-header">
                        <h3>🔔 Notifications</h3>
                        <button class="clear-all-btn btn-link">Clear All</button>
                    </div>
                    <div class="notifications-list">
                        <div class="loading">Loading notifications...</div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', panelHTML);
        }
    }

    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications');
            const result = await response.json();

            if (result.success) {
                this.notificationsList = result.notifications;
                this.displayNotifications();
                this.updateNotificationCount(result.unreadCount);
            } else {
                console.error('Error loading notifications:', result.error);
            }
        } catch (error) {
            console.error('Network error loading notifications:', error);
        }
    }

    displayNotifications() {
        const container = document.querySelector('.notifications-list');
        if (!container) return;

        if (this.notificationsList.length === 0) {
            container.innerHTML = '<div class="no-notifications">No notifications yet.</div>';
            return;
        }

        container.innerHTML = '';

        this.notificationsList.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            container.appendChild(notificationElement);
        });
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${!notification.isRead ? 'unread' : ''}`;
        
        const timeAgo = this.getTimeAgo(notification.createdAt);
        const icon = this.getNotificationIcon(notification.type);

        div.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-details">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${timeAgo}</div>
                </div>
                <div class="notification-actions">
                    ${!notification.isRead ? 
                        `<button class="mark-read-btn" data-notification-id="${notification._id}">✓</button>` : 
                        ''
                    }
                </div>
            </div>
        `;

        // Add click handler for navigation
        if (notification.relatedId) {
            div.style.cursor = 'pointer';
            div.addEventListener('click', () => {
                this.handleNotificationClick(notification);
            });
        }

        return div;
    }

    getNotificationIcon(type) {
        const icons = {
            'message': '💬',
            'book_shared': '📚',
            'pickup_request': '🚚',
            'achievement': '🏆',
            'rating': '⭐',
            'swap_request': '🔄',
            'system': '🔔',
            'welcome': '👋'
        };
        return icons[type] || '🔔';
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT'
            });

            const result = await response.json();

            if (result.success) {
                // Update local notification
                const notification = this.notificationsList.find(n => n._id === notificationId);
                if (notification) {
                    notification.isRead = true;
                }

                this.displayNotifications();
                this.updateNotificationCount();
            } else {
                console.error('Error marking notification as read:', result.error);
            }
        } catch (error) {
            console.error('Network error marking notification as read:', error);
        }
    }

    async clearAllNotifications() {
        try {
            // Mark all as read
            const unreadNotifications = this.notificationsList.filter(n => !n.isRead);
            
            for (const notification of unreadNotifications) {
                await this.markAsRead(notification._id);
            }

            this.showAlert('All notifications cleared!', 'success');
        } catch (error) {
            console.error('Error clearing notifications:', error);
            this.showAlert('Error clearing notifications.', 'error');
        }
    }

    handleNotificationClick(notification) {
        // Handle different notification types
        switch (notification.type) {
            case 'message':
                if (window.messagingSystem) {
                    // Extract user ID from relatedId or metadata
                    window.messagingSystem.openMessaging(notification.relatedId);
                }
                break;
            case 'book_shared':
            case 'pickup_request':
                // Navigate to gallery or relevant page
                window.location.href = '/gallery';
                break;
            case 'achievement':
                // Navigate to profile or achievements page
                window.location.href = '/profile';
                break;
            default:
                // Default action - could be configurable
                break;
        }

        // Mark as read when clicked
        if (!notification.isRead) {
            this.markAsRead(notification._id);
        }

        // Close panel
        this.toggleNotificationPanel(false);
    }

    toggleNotificationPanel(show = null) {
        const panel = document.getElementById('notifications-panel');
        if (!panel) return;

        if (show === null) {
            show = panel.style.display === 'none';
        }

        panel.style.display = show ? 'block' : 'none';

        // Refresh notifications when opening
        if (show) {
            this.loadNotifications();
        }
    }

    updateNotificationCount(count = null) {
        const countElement = document.querySelector('.notification-count');
        if (!countElement) return;

        if (count === null) {
            count = this.notificationsList.filter(n => !n.isRead).length;
        }

        if (count > 0) {
            countElement.textContent = count > 99 ? '99+' : count.toString();
            countElement.style.display = 'inline';
            
            // Add animation class
            countElement.classList.add('bounce');
            setTimeout(() => countElement.classList.remove('bounce'), 500);
        } else {
            countElement.style.display = 'none';
        }
    }

    startPolling() {
        // Poll for new notifications every 30 seconds
        this.pollingInterval = setInterval(() => {
            this.loadNotifications();
        }, 30000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Method to create a new notification (for real-time updates)
    addNotification(notification) {
        this.notificationsList.unshift(notification);
        this.displayNotifications();
        this.updateNotificationCount();
        this.showToast(notification);
    }

    showToast(notification) {
        // Show a brief toast notification for new notifications
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
        `;

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlert = document.querySelector('.notification-alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertHTML = `
            <div class="notification-alert alert-${type}">
                ${message}
                <button class="alert-close" onclick="this.parentElement.remove()">×</button>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', alertHTML);

        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.notification-alert');
            if (alert) alert.remove();
        }, 5000);
    }

    // Cleanup method
    destroy() {
        this.stopPolling();
        // Remove event listeners if needed
    }
}

// Initialize notification system when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.notificationSystem = new NotificationSystem();
});

// Clean up when page unloads
window.addEventListener('beforeunload', () => {
    if (window.notificationSystem) {
        window.notificationSystem.destroy();
    }
});
