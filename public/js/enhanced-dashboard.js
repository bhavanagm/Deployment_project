// Enhanced Dashboard Features
class EnhancedDashboard {
    constructor() {
        this.initializeFeatures();
        this.setupEventListeners();
        this.loadInitialData();
    }

    initializeFeatures() {
        this.searchTimeout = null;
        this.recommendations = [
            {
                title: "Sapiens",
                author: "Yuval Noah Harari",
                reason: "Based on your reading history",
                emoji: "📖"
            },
            {
                title: "1984",
                author: "George Orwell",
                reason: "Popular in your area",
                emoji: "📚"
            },
            {
                title: "The Alchemist",
                author: "Paulo Coelho",
                reason: "Highly rated by similar readers",
                emoji: "✨"
            }
        ];
    }

    setupEventListeners() {
        // Quick search functionality
        const searchInput = document.getElementById('quick-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleQuickSearch(e.target.value));
            searchInput.addEventListener('focus', () => this.showSearchSuggestions());
        }

        // Floating action buttons
        document.querySelectorAll('.floating-btn').forEach(btn => {
            btn.addEventListener('mouseenter', this.animateFloatingButton);
            btn.addEventListener('mouseleave', this.resetFloatingButton);
        });

        // Enhanced stat cards click handlers
        document.querySelectorAll('.enhanced-stat-card').forEach(card => {
            card.addEventListener('click', this.handleStatCardClick);
        });

        // Weather widget click
        const weatherWidget = document.querySelector('.weather-widget');
        if (weatherWidget) {
            weatherWidget.addEventListener('click', this.showWeatherDetails);
        }

        // Goal progress bars animation on scroll
        this.setupScrollAnimations();
    }

    loadInitialData() {
        this.updateEnhancedStats();
        this.loadBookRecommendations();
        this.updateActivityTimeline();
        this.setupDynamicSearch();
    }

    handleQuickSearch(query) {
        clearTimeout(this.searchTimeout);
        const resultsDiv = document.getElementById('search-results');
        
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }

        // Show loading
        resultsDiv.innerHTML = '<div class="search-loading">🔍 Searching...</div>';

        this.searchTimeout = setTimeout(async () => {
            try {
                const results = await this.performSearch(query);
                this.displaySearchResults(results);
            } catch (error) {
                console.error('Search error:', error);
                resultsDiv.innerHTML = '<div class="search-error">❌ Search failed. Please try again.</div>';
            }
        }, 300);
    }

    async performSearch(query) {
        // Simulate API call for now
        return new Promise(resolve => {
            setTimeout(() => {
                const mockResults = [
                    { type: 'book', title: 'Atomic Habits', author: 'James Clear', owner: 'John Doe' },
                    { type: 'user', name: 'Jane Smith', books: 15, rating: 4.8 },
                    { type: 'book', title: 'The Power of Now', author: 'Eckhart Tolle', owner: 'Alice Wilson' }
                ];
                
                const filtered = mockResults.filter(item => 
                    (item.title && item.title.toLowerCase().includes(query.toLowerCase())) ||
                    (item.author && item.author.toLowerCase().includes(query.toLowerCase())) ||
                    (item.name && item.name.toLowerCase().includes(query.toLowerCase()))
                );
                
                resolve(filtered);
            }, 500);
        });
    }

    displaySearchResults(results) {
        const resultsDiv = document.getElementById('search-results');
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">📭 No results found</div>';
            return;
        }

        const resultHTML = results.map(result => {
            if (result.type === 'book') {
                return `
                    <div class="search-result-item" onclick="this.viewBook('${result.title}')">
                        📖 <strong>${result.title}</strong> by ${result.author}
                        <small>Available from ${result.owner}</small>
                    </div>
                `;
            } else if (result.type === 'user') {
                return `
                    <div class="search-result-item" onclick="this.viewUser('${result.name}')">
                        👤 <strong>${result.name}</strong>
                        <small>${result.books} books • ${result.rating}⭐</small>
                    </div>
                `;
            }
        }).join('');

        resultsDiv.innerHTML = `<div class="search-results-container">${resultHTML}</div>`;
    }

    showSearchSuggestions() {
        const resultsDiv = document.getElementById('search-results');
        if (resultsDiv.innerHTML === '') {
            resultsDiv.innerHTML = `
                <div class="search-suggestions">
                    <div class="suggestion-category">
                        <strong>💡 Popular Searches</strong>
                        <div class="suggestion-item" onclick="document.getElementById('quick-search-input').value='fiction books'; this.handleQuickSearch('fiction books');">Fiction Books</div>
                        <div class="suggestion-item" onclick="document.getElementById('quick-search-input').value='mystery novels'; this.handleQuickSearch('mystery novels');">Mystery Novels</div>
                        <div class="suggestion-item" onclick="document.getElementById('quick-search-input').value='self help'; this.handleQuickSearch('self help');">Self Help</div>
                    </div>
                </div>
            `;
        }
    }

    updateEnhancedStats() {
        // Animate stat values
        const stats = [
            { id: 'total-books-shared', value: 24, trend: '+3 this week' },
            { id: 'successful-swaps', value: 12, trend: '+2 this month' },
            { id: 'donations-made', value: 8, trend: 'Generous giver!' },
            { id: 'avg-rating', value: 4.8, trend: 'Excellent!' }
        ];

        stats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) {
                this.animateCountUp(element, stat.value);
            }
        });
    }

    animateCountUp(element, targetValue) {
        const startValue = 0;
        const duration = 2000;
        const startTime = performance.now();

        const updateCount = (currentTime) => {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            const currentValue = startValue + (targetValue - startValue) * this.easeOutCubic(progress);
            
            if (typeof targetValue === 'number' && targetValue % 1 !== 0) {
                element.textContent = currentValue.toFixed(1);
            } else {
                element.textContent = Math.round(currentValue);
            }

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        };

        requestAnimationFrame(updateCount);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    loadBookRecommendations() {
        const container = document.getElementById('book-recommendations');
        if (!container) return;

        const recommendationsHTML = this.recommendations.map(book => `
            <div class="recommendation-item" onclick="enhancedDashboard.findBook('${book.title}')">
                <strong>${book.emoji} "${book.title}" by ${book.author}</strong><br>
                <small>${book.reason}</small>
                <div style="margin-top: 10px;">
                    <button class="action-btn primary" style="font-size: 0.8rem; padding: 5px 10px;">
                        Find This Book
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = recommendationsHTML;
    }

    updateActivityTimeline() {
        // Add real-time activity updates
        const timeline = document.querySelector('.activity-timeline');
        if (timeline) {
            // Add scroll animation observer
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('timeline-animate');
                    }
                });
            });

            timeline.querySelectorAll('.timeline-item').forEach(item => {
                observer.observe(item);
            });
        }
    }

    setupDynamicSearch() {
        // Add click outside to close search results
        document.addEventListener('click', (e) => {
            const searchContainer = e.target.closest('.quick-search');
            const resultsDiv = document.getElementById('search-results');
            
            if (!searchContainer && resultsDiv) {
                setTimeout(() => {
                    resultsDiv.innerHTML = '';
                }, 100);
            }
        });
    }

    animateFloatingButton(e) {
        e.target.style.transform = 'scale(1.1) rotate(5deg)';
    }

    resetFloatingButton(e) {
        e.target.style.transform = 'scale(1) rotate(0deg)';
    }

    handleStatCardClick(e) {
        const card = e.currentTarget;
        card.style.transform = 'scale(0.95)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);

        // Add click feedback and navigation
        const cardType = card.querySelector('.stat-value').id;
        this.navigateToStatDetails(cardType);
    }

    navigateToStatDetails(statType) {
        switch(statType) {
            case 'total-books-shared':
                window.location.href = '/profile?tab=books';
                break;
            case 'successful-swaps':
                window.location.href = '/profile?tab=activity';
                break;
            case 'donations-made':
                window.location.href = '/profile?tab=donations';
                break;
            case 'avg-rating':
                window.location.href = '/profile?tab=reviews';
                break;
        }
    }

    showWeatherDetails() {
        alert('🌤️ Today: 24°C, Partly Cloudy\n\nPerfect weather for reading outdoors! Why not take a book to the park? 📚');
    }

    setupScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBars = entry.target.querySelectorAll('.goal-fill');
                    progressBars.forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0%';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                }
            });
        });

        const readingGoals = document.querySelector('.reading-goals');
        if (readingGoals) {
            observer.observe(readingGoals);
        }
    }

    findBook(title) {
        // Navigate to gallery with search for this book
        window.location.href = `/gallery?search=${encodeURIComponent(title)}`;
    }

    viewBook(title) {
        this.findBook(title);
    }

    viewUser(name) {
        // Navigate to user profile (if available)
        alert(`👤 Viewing profile for ${name} - Feature coming soon!`);
    }
}

// Notification system enhancement
function showNotifications() {
    const notifications = [
        { type: 'swap', message: 'New swap request from Sarah', time: '5 min ago', icon: '🔄' },
        { type: 'message', message: 'Message from book owner', time: '1 hour ago', icon: '💬' },
        { type: 'achievement', message: 'You earned "Bookworm" badge!', time: '2 hours ago', icon: '🏆' }
    ];

    const notificationHTML = notifications.map(notif => `
        <div class="notification-item">
            <span class="notification-icon">${notif.icon}</span>
            <div class="notification-content">
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${notif.time}</div>
            </div>
        </div>
    `).join('');

    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔔 Notifications</h3>
                <button onclick="this.closest('.notification-modal').remove()">×</button>
            </div>
            <div class="modal-body">
                ${notificationHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Add CSS for enhanced features
const enhancedStyles = `
    .search-results-container {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        margin-top: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        max-height: 300px;
        overflow-y: auto;
    }

    .search-result-item, .suggestion-item {
        padding: 12px 15px;
        border-bottom: 1px solid #f8f9fa;
        cursor: pointer;
        transition: background 0.2s;
    }

    .search-result-item:hover, .suggestion-item:hover {
        background: #f8f9fa;
    }

    .search-result-item:last-child {
        border-bottom: none;
    }

    .search-loading, .search-error, .no-results {
        padding: 15px;
        text-align: center;
        color: #666;
    }

    .search-suggestions {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 10px;
        margin-top: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .suggestion-category {
        padding: 15px;
    }

    .recommendation-item {
        padding: 15px;
        background: #f8f9fa;
        border-radius: 10px;
        margin-bottom: 10px;
        transition: transform 0.2s;
        cursor: pointer;
    }

    .recommendation-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .timeline-animate .timeline-item {
        animation: slideInLeft 0.6s ease-out;
    }

    .notification-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .notification-item {
        display: flex;
        align-items: center;
        padding: 12px 15px;
        border-bottom: 1px solid #f0f0f0;
    }

    .notification-icon {
        margin-right: 10px;
        font-size: 1.2rem;
    }

    .notification-content {
        flex: 1;
    }

    .notification-message {
        font-weight: 500;
    }

    .notification-time {
        font-size: 0.8rem;
        color: #666;
        margin-top: 2px;
    }

    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.textContent = enhancedStyles;
document.head.appendChild(styleElement);

// Initialize enhanced dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedDashboard = new EnhancedDashboard();
});
