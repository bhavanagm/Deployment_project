// ⭐ Book Rating & Review System
class RatingSystem {
    constructor() {
        this.currentBookId = null;
        this.currentBookTitle = null;
        this.currentRating = 0;
        this.init();
    }

    init() {
        this.createRatingModal();
        this.attachEventListeners();
        this.addModalStyles();
        console.log('✅ Rating system initialized');
    }

    attachEventListeners() {
        // Star rating selection inside the modal
        const stars = document.querySelectorAll('#star-rating .star');
        if (stars.length) {
            stars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.currentRating = index + 1;
                    this.updateStarDisplay();
                });
                
                star.addEventListener('mouseenter', () => {
                    this.highlightStars(index + 1);
                });
            });
            
            document.getElementById('star-rating').addEventListener('mouseleave', () => {
                this.updateStarDisplay();
            });
        }
        
        // Character counter for review
        const reviewTextarea = document.getElementById('review-text');
        const charCount = document.getElementById('char-count');
        
        if (reviewTextarea && charCount) {
            reviewTextarea.addEventListener('input', () => {
                const count = reviewTextarea.value.length;
                charCount.textContent = count;
                
                if (count > 450) {
                    charCount.style.color = '#dc3545';
                } else if (count > 400) {
                    charCount.style.color = '#ffc107';
                } else {
                    charCount.style.color = '#666';
                }
            });
        }
        
        // Close modal on outside click
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('rating-modal');
            if (modal && e.target === modal) {
                this.closeRatingModal();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('rating-modal');
                if (modal && modal.style.display !== 'none') {
                    this.closeRatingModal();
                }
            }
        });
    }

    handleStarClick(e) {
        const rating = parseInt(e.target.dataset.rating);
        const container = e.target.closest('.star-container');
        
        // Update visual stars
        this.updateStarDisplay(container, rating);
        
        // Store rating value
        const hiddenInput = container.parentElement.querySelector('input[name="rating"]');
        if (hiddenInput) {
            hiddenInput.value = rating;
        }
    }

    updateStarDisplay(container, rating) {
        const stars = container.querySelectorAll('.star-rating');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('filled');
                star.innerHTML = '★';
            } else {
                star.classList.remove('filled');
                star.innerHTML = '☆';
            }
        });
    }

    async handleRatingSubmit(e) {
        const form = e.target;
        const formData = new FormData(form);
        const bookId = form.dataset.bookId;

        const ratingData = {
            rating: parseInt(formData.get('rating')),
            review: formData.get('review')
        };

        if (!ratingData.rating || ratingData.rating < 1 || ratingData.rating > 5) {
            this.showAlert('Please select a rating between 1-5 stars.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/books/${bookId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ratingData)
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Rating submitted successfully!', 'success');
                this.closeRatingModal();
                this.loadBookRatings(bookId); // Refresh ratings
            } else {
                this.showAlert(result.error || 'Error submitting rating.', 'error');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            this.showAlert('Network error. Please try again.', 'error');
        }
    }

    async loadBookRatings(bookId = null) {
        // If specific book ID provided, load just that book's ratings
        if (bookId) {
            await this.loadSingleBookRatings(bookId);
            return;
        }

        // Otherwise, load ratings for all books on the page
        const bookElements = document.querySelectorAll('.book-item[data-book-id]');
        
        for (const bookElement of bookElements) {
            const id = bookElement.dataset.bookId;
            await this.loadSingleBookRatings(id);
        }
    }

    async loadSingleBookRatings(bookId) {
        try {
            const response = await fetch(`/api/books/${bookId}/ratings`);
            const result = await response.json();

            if (result.success) {
                this.displayRatings(bookId, result.ratings);
            }
        } catch (error) {
            console.error(`Error loading ratings for book ${bookId}:`, error);
        }
    }

    displayRatings(bookId, ratings) {
        const bookElement = document.querySelector(`[data-book-id="${bookId}"]`);
        if (!bookElement) return;

        // Calculate average rating
        let avgRating = 0;
        if (ratings.length > 0) {
            const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
            avgRating = (totalRating / ratings.length).toFixed(1);
        }

        // Update rating display
        const ratingDisplay = bookElement.querySelector('.rating-display');
        if (ratingDisplay) {
            ratingDisplay.innerHTML = `
                <div class="average-rating">
                    <span class="stars">${this.generateStarHTML(avgRating)}</span>
                    <span class="rating-text">${avgRating}/5 (${ratings.length} reviews)</span>
                </div>
            `;
        }

        // Update reviews section
        const reviewsContainer = bookElement.querySelector('.reviews-container');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = this.generateReviewsHTML(ratings);
        }
    }

    generateStarHTML(rating) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = (rating % 1) >= 0.5;

        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHTML += '<span class="star filled">★</span>';
            } else if (i === fullStars && hasHalfStar) {
                starsHTML += '<span class="star half">⭐</span>';
            } else {
                starsHTML += '<span class="star empty">☆</span>';
            }
        }
        return starsHTML;
    }

    generateReviewsHTML(ratings) {
        if (ratings.length === 0) {
            return '<p class="no-reviews">No reviews yet.</p>';
        }

        let reviewsHTML = '<div class="reviews-list">';
        ratings.slice(0, 3).forEach(rating => {
            reviewsHTML += `
                <div class="review-item">
                    <div class="review-header">
                        <strong>${rating.userId.username}</strong>
                        <span class="review-stars">${this.generateStarHTML(rating.rating)}</span>
                    </div>
                    ${rating.review ? `<p class="review-text">${rating.review}</p>` : ''}
                    <div class="review-date">${new Date(rating.createdAt).toLocaleDateString()}</div>
                </div>
            `;
        });
        
        if (ratings.length > 3) {
            reviewsHTML += `<p class="more-reviews">+${ratings.length - 3} more reviews</p>`;
        }
        
        reviewsHTML += '</div>';
        return reviewsHTML;
    }

    async showRatingModal(bookId, bookTitle) {
        this.currentBookId = bookId;
        this.currentBookTitle = bookTitle || 'Book';
        
        // Create modal if it doesn't exist
        if (!document.getElementById('rating-modal')) {
            this.createRatingModal();
            this.addModalStyles();
            this.attachStarListeners();
        }
        
        // Update modal title
        document.getElementById('rating-book-title').textContent = this.currentBookTitle;
        
        // Reset form
        this.resetModal();
        
        // Show modal
        document.getElementById('rating-modal').style.display = 'flex';
        
        // Load existing ratings
        await this.loadExistingRatings(bookId);
        
        console.log(`📚 Rating modal opened for: ${this.currentBookTitle} (ID: ${bookId})`);
    }

    createRatingModal() {
        // Check if modal already exists
        if (document.getElementById('rating-modal')) {
            return;
        }

        const modalHTML = `
            <div id="rating-modal" class="rating-modal" style="display: none;">
                <div class="rating-modal-content">
                    <div class="rating-modal-header">
                        <h3>📚 Rate this Book</h3>
                        <button class="close-rating-modal" onclick="ratingSystem.closeRatingModal()">×</button>
                    </div>
                    
                    <div class="rating-modal-body">
                        <div class="book-info">
                            <h4 id="rating-book-title">Book Title</h4>
                        </div>
                        
                        <div class="rating-section">
                            <label>Your Rating:</label>
                            <div class="star-rating" id="star-rating">
                                <span class="star" data-rating="1">⭐</span>
                                <span class="star" data-rating="2">⭐</span>
                                <span class="star" data-rating="3">⭐</span>
                                <span class="star" data-rating="4">⭐</span>
                                <span class="star" data-rating="5">⭐</span>
                            </div>
                            <div class="rating-text" id="rating-text">Click to rate (1-5 stars)</div>
                        </div>
                        
                        <div class="review-section">
                            <label for="review-text">Review (optional):</label>
                            <textarea 
                                id="review-text" 
                                placeholder="Share your thoughts about this book..."
                                maxlength="500"
                                rows="4"
                            ></textarea>
                            <div class="char-count">
                                <span id="char-count">0</span>/500 characters
                            </div>
                        </div>
                        
                        <div class="rating-actions">
                            <button class="submit-rating-btn" onclick="ratingSystem.submitRating()">
                                ⭐ Submit Rating
                            </button>
                            <button class="cancel-rating-btn" onclick="ratingSystem.closeRatingModal()">
                                Cancel
                            </button>
                        </div>
                    </div>
                    
                    <div class="existing-ratings">
                        <h4>📖 Recent Reviews</h4>
                        <div id="existing-ratings-list">
                            <div class="loading">Loading reviews...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeRatingModal() {
        const modal = document.getElementById('rating-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetModal();
        }
    }
    
    resetModal() {
        this.currentRating = 0;
        const reviewText = document.getElementById('review-text');
        if (reviewText) {
            reviewText.value = '';
            document.getElementById('char-count').textContent = '0';
        }
        this.updateStarDisplay();
        this.clearMessages();
    }
    
    clearMessages() {
        const messages = document.querySelectorAll('.success-message, .error-message');
        messages.forEach(msg => msg.remove());
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        const body = document.querySelector('.rating-modal-body');
        body.insertBefore(successDiv, body.firstChild);
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const body = document.querySelector('.rating-modal-body');
        body.insertBefore(errorDiv, body.firstChild);
    }
    
    // Add helper methods
    addModalStyles() {
        // Only add styles if they don't exist
        if (document.getElementById('rating-modal-styles')) {
            return;
        }
        
        const styles = `
            <style id="rating-modal-styles">
                .rating-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                
                .rating-modal-content {
                    background: white;
                    border-radius: 15px;
                    padding: 0;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .rating-modal-header {
                    background: linear-gradient(45deg, #4b6cb7, #182848);
                    color: white;
                    padding: 20px;
                    border-radius: 15px 15px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .rating-modal-header h3 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                
                .close-rating-modal {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.3s;
                }
                
                .close-rating-modal:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .rating-modal-body {
                    padding: 25px;
                }
                
                .book-info h4 {
                    color: #4b6cb7;
                    margin: 0 0 20px 0;
                    font-size: 1.1rem;
                }
                
                .rating-section {
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .rating-section label {
                    display: block;
                    margin-bottom: 10px;
                    font-weight: 600;
                    color: #333;
                }
                
                .star-rating {
                    display: flex;
                    justify-content: center;
                    gap: 5px;
                    margin-bottom: 10px;
                }
                
                .star {
                    font-size: 2rem;
                    cursor: pointer;
                    transition: transform 0.2s, filter 0.2s;
                    filter: grayscale(100%);
                }
                
                .star:hover, .star.selected {
                    transform: scale(1.2);
                    filter: grayscale(0%);
                }
                
                .star.selected {
                    filter: drop-shadow(0 0 5px #ffc107);
                }
                
                .rating-text {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .review-section {
                    margin-bottom: 20px;
                }
                
                .review-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }
                
                .review-section textarea {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e6ed;
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 1rem;
                    resize: vertical;
                    min-height: 100px;
                    transition: border-color 0.3s;
                }
                
                .review-section textarea:focus {
                    outline: none;
                    border-color: #4b6cb7;
                    box-shadow: 0 0 0 3px rgba(75, 108, 183, 0.1);
                }
                
                .char-count {
                    text-align: right;
                    font-size: 0.8rem;
                    color: #666;
                    margin-top: 5px;
                }
                
                .rating-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                }
                
                .submit-rating-btn, .cancel-rating-btn {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 0.9rem;
                }
                
                .submit-rating-btn {
                    background: #4b6cb7;
                    color: white;
                }
                
                .submit-rating-btn:hover {
                    background: #3a5998;
                    transform: translateY(-2px);
                }
                
                .submit-rating-btn:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .cancel-rating-btn {
                    background: #6c757d;
                    color: white;
                }
                
                .cancel-rating-btn:hover {
                    background: #545b62;
                }
                
                .existing-ratings {
                    border-top: 1px solid #eee;
                    padding: 20px 25px;
                    background: #f8f9fa;
                    border-radius: 0 0 15px 15px;
                }
                
                .existing-ratings h4 {
                    margin: 0 0 15px 0;
                    color: #4b6cb7;
                }
                
                .rating-item {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                
                .rating-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .rating-user {
                    font-weight: 600;
                    color: #4b6cb7;
                }
                
                .rating-stars {
                    font-size: 0.9rem;
                }
                
                .rating-review {
                    color: #333;
                    line-height: 1.4;
                    font-size: 0.9rem;
                }
                
                .rating-date {
                    color: #666;
                    font-size: 0.8rem;
                    margin-top: 8px;
                }
                
                .loading, .no-ratings {
                    text-align: center;
                    color: #666;
                    font-style: italic;
                    padding: 20px;
                }
                
                .success-message {
                    background: #d4edda;
                    color: #155724;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid #c3e6cb;
                }
                
                .error-message {
                    background: #f8d7da;
                    color: #721c24;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border: 1px solid #f5c6cb;
                }

                @media (max-width: 768px) {
                    .rating-modal-content {
                        width: 95%;
                        margin: 10px;
                    }
                    
                    .rating-actions {
                        flex-direction: column;
                    }
                    
                    .star {
                        font-size: 1.5rem;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    // Star interaction methods
    attachStarListeners() {
        const stars = document.querySelectorAll('#star-rating .star');
        const ratingText = document.getElementById('rating-text');
        
        if (!stars.length) return;

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.currentRating = index + 1;
                this.updateStarDisplay();
                this.updateRatingText();
            });

            star.addEventListener('mouseenter', () => {
                this.highlightStars(index + 1);
            });
        });

        document.getElementById('star-rating').addEventListener('mouseleave', () => {
            this.updateStarDisplay();
        });
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('#star-rating .star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.filter = 'grayscale(0%)';
                star.style.transform = 'scale(1.1)';
            } else {
                star.style.filter = 'grayscale(100%)';
                star.style.transform = 'scale(1)';
            }
        });
    }

    updateStarDisplay() {
        const stars = document.querySelectorAll('#star-rating .star');
        stars.forEach((star, index) => {
            if (index < this.currentRating) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }

    updateRatingText() {
        const ratingText = document.getElementById('rating-text');
        const ratingLabels = {
            1: '⭐ Poor',
            2: '⭐⭐ Fair', 
            3: '⭐⭐⭐ Good',
            4: '⭐⭐⭐⭐ Very Good',
            5: '⭐⭐⭐⭐⭐ Excellent'
        };
        
        if (this.currentRating > 0) {
            ratingText.textContent = ratingLabels[this.currentRating];
            ratingText.style.color = '#4b6cb7';
            ratingText.style.fontWeight = '600';
        } else {
            ratingText.textContent = 'Click to rate (1-5 stars)';
            ratingText.style.color = '#666';
            ratingText.style.fontWeight = 'normal';
        }
    }
    
    async submitRating() {
        if (!this.currentBookId || this.currentRating === 0) {
            this.showError('Please select a rating before submitting.');
            return;
        }

        const reviewText = document.getElementById('review-text').value.trim();
        const submitBtn = document.querySelector('.submit-rating-btn');
        
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Submitting...';

        try {
            const response = await fetch(`/api/books/${this.currentBookId}/rate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: this.currentRating,
                    review: reviewText
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('✅ Rating submitted successfully!');
                
                // Reload the gallery to show updated ratings
                if (typeof loadBooks === 'function') {
                    setTimeout(() => {
                        loadBooks();
                        this.closeRatingModal();
                    }, 1500);
                } else {
                    setTimeout(() => this.closeRatingModal(), 1500);
                }
                
                // Reload existing ratings
                await this.loadExistingRatings(this.currentBookId);
                
            } else {
                this.showError(result.error || 'Failed to submit rating.');
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            this.showError('Network error. Please try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = '⭐ Submit Rating';
        }
    }

    async loadExistingRatings(bookId) {
        const container = document.getElementById('existing-ratings-list');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">Loading reviews...</div>';

        try {
            const response = await fetch(`/api/books/${bookId}/ratings`);
            const result = await response.json();

            if (result.success && result.ratings.length > 0) {
                container.innerHTML = result.ratings.slice(0, 3).map(rating => 
                    this.createRatingElement(rating)
                ).join('');
            } else {
                container.innerHTML = '<div class="no-ratings">No reviews yet. Be the first to review!</div>';
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            container.innerHTML = '<div class="no-ratings">Unable to load reviews.</div>';
        }
    }

    createRatingElement(rating) {
        const date = new Date(rating.createdAt).toLocaleDateString();
        const stars = '⭐'.repeat(rating.rating) + '☆'.repeat(5 - rating.rating);
        const username = rating.userId?.username || 'Anonymous';
        
        return `
            <div class="rating-item">
                <div class="rating-header">
                    <span class="rating-user">${username}</span>
                    <span class="rating-stars">${stars}</span>
                </div>
                ${rating.review ? `<div class="rating-review">${rating.review}</div>` : ''}
                <div class="rating-date">${date}</div>
            </div>
        `;
    }

    // Helper function for gallery.js to load ratings for all books
    async loadBookRatings(books) {
        if (!Array.isArray(books) || books.length === 0) return;
        
        console.log(`Loading ratings for ${books.length} books`);
        
        // The ratings are already loaded by the server and available in the book object
        // We just need to update the UI for each book if needed
        books.forEach(book => {
            const bookCard = document.querySelector(`.book-card[data-book-id="${book._id}"]`);
            if (!bookCard) return;
            
            const ratingDisplay = bookCard.querySelector('.rating-display');
            if (!ratingDisplay) return;
            
            const avgRating = book.averageRating || 0;
            const totalRatings = book.totalRatings || 0;
            
            // The stars should already be updated through the gallery.js displayBooks function
        });
    }
}

// Global function to show rating modal (called from gallery)
function showRatingModal(bookId, bookTitle) {
    if (window.ratingSystem) {
        window.ratingSystem.showRatingModal(bookId, bookTitle);
    } else {
        alert('Rating system not initialized. Please refresh the page.');
    }
}

// Initialize rating system when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    window.ratingSystem = new RatingSystem();
    console.log('📚 Rating system ready!');
});
