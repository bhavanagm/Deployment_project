// 📊 Dashboard System
class DashboardManager {
    constructor() {
        this.dashboardData = null;
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.loadDashboardData();
        this.attachEventListeners();
    }
    
    async loadCurrentUser() {
        try {
            const response = await fetch('/api/current-user');
            const result = await response.json();
            
            if (!result.success) {
                // User not logged in, redirect to login
                window.location.href = '/login';
                return;
            }
            
            this.currentUser = result.user;
            console.log('Current user loaded:', this.currentUser);
        } catch (error) {
            console.error('Error loading current user:', error);
            window.location.href = '/login';
        }
    }

    attachEventListeners() {
        // Refresh dashboard button (if added)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-dashboard')) {
                this.loadDashboardData();
            }
        });
    }

    async loadDashboardData() {
        try {
            const response = await fetch('/api/dashboard');
            const result = await response.json();

            if (result.success) {
                this.dashboardData = result.data;
                this.updateDashboardDisplay();
                
                // Load additional data
                await this.loadAchievements();
                await this.loadLeaderboard();
                await this.loadRecentNotifications();
            } else {
                console.error('Error loading dashboard:', result.error);
                this.showError('Unable to load dashboard data.');
            }
        } catch (error) {
            console.error('Network error loading dashboard:', error);
            this.showError('Network error. Please check your connection.');
        }
    }

    updateDashboardDisplay() {
        const data = this.dashboardData;

        // Update user info
        document.getElementById('user-name').textContent = data.user.username;
        document.getElementById('user-level').textContent = `Level ${data.user.level}`;
        document.getElementById('user-points').textContent = `${data.user.totalPoints} pts`;

        // Update stats cards
        document.getElementById('my-books-count').textContent = data.stats.myBooks;
        document.getElementById('notifications-count').textContent = data.stats.unreadNotifications;
        document.getElementById('achievements-count').textContent = data.stats.totalAchievements;
        document.getElementById('total-reviews').textContent = data.user.totalReviews || 0;

        // Update recent books
        this.displayRecentBooks(data.recentBooks);
    }

    displayRecentBooks(books) {
        const container = document.getElementById('recent-books-list');
        
        if (!books || books.length === 0) {
            container.innerHTML = '<div class="no-items">No recent books available.</div>';
            return;
        }

        container.innerHTML = '';

        books.slice(0, 3).forEach(book => {
            const bookElement = this.createBookElement(book);
            container.appendChild(bookElement);
        });
    }

    createBookElement(book) {
        const div = document.createElement('div');
        div.className = 'book-item';
        
        const condition = book.condition || 'Unknown';
        const type = book.type || 'Unknown';
        const imageUrl = book.image || '/images/book-placeholder.png';
        
        div.innerHTML = `
            <div class="book-card">
                <div class="book-image">
                    <img src="${imageUrl}" alt="${book.title}" 
                         onerror="this.src='/images/book-placeholder.png'">
                </div>
                <div class="book-details">
                    <h4 class="book-title">${book.title}</h4>
                    <p class="book-author">by ${book.author}</p>
                    <div class="book-meta">
                        <span class="book-condition">${condition}</span>
                        <span class="book-type">${type}</span>
                    </div>
                    <div class="book-rating" data-book-id="${book._id}">
                        <div class="rating-display"></div>
                    </div>
                </div>
                <div class="book-actions">
                    <button class="contact-user-btn btn-small" 
                            data-user-id="${book.userId}" 
                            data-book-id="${book._id}">
                        💬 Contact
                    </button>
                    <button class="rate-book-btn btn-small" 
                            data-book-id="${book._id}">
                        ⭐ Rate
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    async loadAchievements() {
        try {
            const response = await fetch('/api/achievements');
            const result = await response.json();

            if (result.success) {
                this.displayAchievements(result.achievements);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    displayAchievements(achievements) {
        const container = document.getElementById('achievements-grid');
        
        if (!achievements || achievements.length === 0) {
            container.innerHTML = '<div class="no-achievements">No achievements unlocked yet. Start sharing books!</div>';
            return;
        }

        container.innerHTML = '';

        achievements.slice(0, 6).forEach(achievement => {
            const achievementElement = this.createAchievementElement(achievement);
            container.appendChild(achievementElement);
        });
    }

    createAchievementElement(achievement) {
        const div = document.createElement('div');
        div.className = `achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`;
        
        const icon = this.getAchievementIcon(achievement.type);
        const dateEarned = achievement.dateEarned ? 
            new Date(achievement.dateEarned).toLocaleDateString() : '';

        div.innerHTML = `
            <div class="achievement-icon">${icon}</div>
            <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <div class="achievement-points">+${achievement.points} pts</div>
                ${dateEarned ? `<div class="achievement-date">Earned: ${dateEarned}</div>` : ''}
            </div>
        `;

        return div;
    }

    getAchievementIcon(type) {
        const icons = {
            'first_book': '📖',
            'book_sharer': '📚',
            'helpful_reviewer': '⭐',
            'community_helper': '🤝',
            'book_lover': '💕',
            'popular_book': '🔥',
            'social_butterfly': '🦋',
            'milestone': '🏆'
        };
        return icons[type] || '🏆';
    }

    async loadLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            const result = await response.json();

            if (result.success) {
                this.displayLeaderboard(result.leaderboard);
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
    }

    displayLeaderboard(leaderboard) {
        const container = document.getElementById('leaderboard-list');
        
        if (!leaderboard || leaderboard.length === 0) {
            container.innerHTML = '<div class="no-data">Leaderboard data not available.</div>';
            return;
        }

        container.innerHTML = '';

        leaderboard.slice(0, 5).forEach((user, index) => {
            const userElement = this.createLeaderboardElement(user, index + 1);
            container.appendChild(userElement);
        });
    }

    createLeaderboardElement(user, rank) {
        const div = document.createElement('div');
        div.className = 'leaderboard-item';
        
        const rankIcon = this.getRankIcon(rank);
        
        div.innerHTML = `
            <div class="rank-info">
                <span class="rank-icon">${rankIcon}</span>
                <span class="rank-number">#${rank}</span>
            </div>
            <div class="user-info">
                <h4>${user.username}</h4>
                <p>Level ${user.level}</p>
            </div>
            <div class="user-stats">
                <span class="points">${user.totalPoints} pts</span>
                <span class="books">${user.totalBooksShared} books</span>
            </div>
        `;

        return div;
    }

    getRankIcon(rank) {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏅';
        }
    }

    async loadRecentNotifications() {
        // This will be handled by the notification system
        // We just need to display the latest few in dashboard format
        if (window.notificationSystem && window.notificationSystem.notificationsList) {
            const notifications = window.notificationSystem.notificationsList.slice(0, 3);
            this.displayRecentNotifications(notifications);
        }
    }

    displayRecentNotifications(notifications) {
        const container = document.getElementById('recent-notifications-list');
        
        if (!notifications || notifications.length === 0) {
            container.innerHTML = '<div class="no-items">No recent notifications.</div>';
            return;
        }

        container.innerHTML = '';

        notifications.forEach(notification => {
            const notificationElement = this.createNotificationElement(notification);
            container.appendChild(notificationElement);
        });
    }

    createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item ${!notification.isRead ? 'unread' : ''}`;
        
        const icon = this.getNotificationIcon(notification.type);
        const timeAgo = this.getTimeAgo(notification.createdAt);
        
        div.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-details">
                    <h5>${notification.title}</h5>
                    <p>${notification.message}</p>
                    <span class="time-ago">${timeAgo}</span>
                </div>
            </div>
        `;

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
        
        return date.toLocaleDateString();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'dashboard-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <p>⚠️ ${message}</p>
                <button onclick="dashboardManager.loadDashboardData()" class="retry-btn">
                    Retry
                </button>
            </div>
        `;

        const container = document.querySelector('.dashboard-container');
        container.insertAdjacentElement('afterbegin', errorDiv);

        // Auto remove after 10 seconds
        setTimeout(() => errorDiv.remove(), 10000);
    }
}

// Global functions for modal controls
function showAchievementsModal() {
    document.getElementById('achievement-modal').style.display = 'flex';
    loadAllAchievements();
}

function closeAchievementModal() {
    document.getElementById('achievement-modal').style.display = 'none';
}

function showMessagingModal() {
    document.getElementById('quick-messaging-modal').style.display = 'flex';
    // Load recent contacts if available
}

function closeMessagingModal() {
    document.getElementById('quick-messaging-modal').style.display = 'none';
}

async function loadAllAchievements() {
    try {
        const response = await fetch('/api/achievements');
        const result = await response.json();

        const container = document.getElementById('all-achievements');
        
        if (result.success && result.achievements.length > 0) {
            container.innerHTML = '';
            result.achievements.forEach(achievement => {
                const element = dashboardManager.createAchievementElement(achievement);
                container.appendChild(element);
            });
        } else {
            container.innerHTML = '<div class="no-achievements">No achievements available yet.</div>';
        }
    } catch (error) {
        console.error('Error loading all achievements:', error);
        document.getElementById('all-achievements').innerHTML = 
            '<div class="error">Error loading achievements.</div>';
    }
}

// Initialize dashboard when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
