// Book Image Service - Fetch real book cover images from online APIs
const https = require('https');
const http = require('http');

class BookImageService {
    constructor() {
        this.cache = new Map(); // Simple in-memory cache
        this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
    }

    /**
     * Get book cover image URL based on title and author
     * @param {string} title - Book title
     * @param {string} author - Book author (optional)
     * @returns {Promise<string>} - Image URL or fallback
     */
    async getBookCoverImage(title, author = '') {
        if (!title) {
            return this.createFallbackImage('Book', '#6c757d');
        }

        console.log(`📖 Getting book cover for: "${title}" by "${author}"`);
        
        const cacheKey = `${title}-${author}`.toLowerCase();
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`💾 Using cached image for: ${title}`);
                return cached.imageUrl;
            } else {
                this.cache.delete(cacheKey);
            }
        }

        // For now, always return themed fallback for immediate display
        // TODO: Add real API integration later
        const fallbackUrl = this.createThemedFallback(title, author);
        
        // Cache the result
        this.cache.set(cacheKey, {
            imageUrl: fallbackUrl,
            timestamp: Date.now()
        });
        
        console.log(`🎨 Created themed fallback for: ${title}`);
        return fallbackUrl;
        
        // Commented out for now - uncomment when ready to use real APIs
        /*
        try {
            // Try multiple sources in order of preference
            let imageUrl = await this.fetchFromGoogleBooks(title, author);
            
            if (!imageUrl) {
                imageUrl = await this.fetchFromOpenLibrary(title, author);
            }
            
            if (!imageUrl) {
                imageUrl = await this.fetchFromGoodreads(title, author);
            }
            
            // If no image found, create a themed fallback
            if (!imageUrl) {
                imageUrl = this.createThemedFallback(title, author);
            }
            
            // Cache the result
            this.cache.set(cacheKey, {
                imageUrl,
                timestamp: Date.now()
            });
            
            return imageUrl;
            
        } catch (error) {
            console.error('Error fetching book image:', error.message);
            return this.createThemedFallback(title, author);
        }
        */
    }

    /**
     * Fetch book cover from Google Books API
     */
    async fetchFromGoogleBooks(title, author) {
        try {
            const query = encodeURIComponent(`${title} ${author}`.trim());
            const simpleUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
            
            console.log(`📚 Trying Google Books API for: "${title}" by "${author}"`);
            console.log(`🔗 URL: ${simpleUrl}`);
            
            const response = await this.httpGet(simpleUrl);
            const data = JSON.parse(response);
            
            console.log(`📚 Google Books response:`, JSON.stringify(data, null, 2));
            
            if (data.items && data.items.length > 0) {
                const book = data.items[0];
                const imageLinks = book.volumeInfo.imageLinks;
                
                if (imageLinks) {
                    // Prefer higher resolution images
                    const imageUrl = imageLinks.thumbnail || 
                                   imageLinks.smallThumbnail || 
                                   imageLinks.medium ||
                                   imageLinks.large ||
                                   imageLinks.extraLarge;
                    console.log(`✅ Found Google Books image: ${imageUrl}`);
                    return imageUrl;
                }
            }
            
            console.log('❌ No image found in Google Books response');
            return null;
        } catch (error) {
            console.error('❌ Google Books API error:', error.message);
            return null;
        }
    }

    /**
     * Fetch book cover from Open Library API
     */
    async fetchFromOpenLibrary(title, author) {
        try {
            const query = encodeURIComponent(`${title} ${author}`.trim());
            const searchUrl = `https://openlibrary.org/search.json?q=${query}&limit=1`;
            
            const response = await this.httpGet(searchUrl);
            const data = JSON.parse(response);
            
            if (data.docs && data.docs.length > 0) {
                const book = data.docs[0];
                if (book.isbn && book.isbn[0]) {
                    return `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-M.jpg`;
                }
                if (book.cover_i) {
                    return `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Open Library API error:', error.message);
            return null;
        }
    }

    /**
     * Alternative approach using Goodreads-like service (placeholder)
     */
    async fetchFromGoodreads(title, author) {
        // This is a placeholder for future integration with other book APIs
        // You could integrate with services like:
        // - LibraryThing
        // - WorldCat
        // - BookCrossing
        return null;
    }

    /**
     * Create a themed fallback image based on book details
     */
    createThemedFallback(title, author) {
        const themes = {
            // Fiction themes
            'fiction': { color: '#4a90e2', emoji: '📖', pattern: 'fiction' },
            'novel': { color: '#4a90e2', emoji: '📚', pattern: 'fiction' },
            'story': { color: '#4a90e2', emoji: '📖', pattern: 'fiction' },
            'romance': { color: '#e74c3c', emoji: '💕', pattern: 'romance' },
            'mystery': { color: '#8e44ad', emoji: '🔍', pattern: 'mystery' },
            'thriller': { color: '#2c3e50', emoji: '⚡', pattern: 'thriller' },
            'fantasy': { color: '#9b59b6', emoji: '🧙‍♂️', pattern: 'fantasy' },
            'sci-fi': { color: '#3498db', emoji: '🚀', pattern: 'sci-fi' },
            'science fiction': { color: '#3498db', emoji: '🚀', pattern: 'sci-fi' },
            
            // Non-fiction themes
            'biography': { color: '#f39c12', emoji: '👤', pattern: 'biography' },
            'history': { color: '#d35400', emoji: '🏛️', pattern: 'history' },
            'science': { color: '#27ae60', emoji: '🔬', pattern: 'science' },
            'self-help': { color: '#16a085', emoji: '🎯', pattern: 'self-help' },
            'business': { color: '#34495e', emoji: '💼', pattern: 'business' },
            'cooking': { color: '#e67e22', emoji: '👨‍🍳', pattern: 'cooking' },
            'travel': { color: '#3498db', emoji: '✈️', pattern: 'travel' },
            'art': { color: '#e74c3c', emoji: '🎨', pattern: 'art' },
            'poetry': { color: '#f1c40f', emoji: '✍️', pattern: 'poetry' },
            'philosophy': { color: '#9b59b6', emoji: '🤔', pattern: 'philosophy' }
        };

        // Determine theme based on title and genre
        let theme = { color: '#6c757d', emoji: '📚', pattern: 'default' };
        
        const searchText = `${title} ${author}`.toLowerCase();
        
        for (const [key, value] of Object.entries(themes)) {
            if (searchText.includes(key)) {
                theme = value;
                break;
            }
        }

        return this.createSVGImage(title, author, theme);
    }

    /**
     * Create a beautiful SVG image with book details
     */
    createSVGImage(title, author, theme) {
        const width = 300;
        const height = 450;
        const cleanTitle = this.truncateText(title, 25);
        const cleanAuthor = this.truncateText(author, 20);
        
        // Create gradient colors
        const baseColor = theme.color;
        const lightColor = this.lightenColor(baseColor, 20);
        const darkColor = this.darkenColor(baseColor, 20);
        
        const svg = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${lightColor};stop-opacity:1" />
                        <stop offset="50%" style="stop-color:${baseColor};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${darkColor};stop-opacity:1" />
                    </linearGradient>
                    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="3" dy="3" stdDeviation="3" flood-opacity="0.3"/>
                    </filter>
                </defs>
                
                <!-- Book cover background -->
                <rect width="${width}" height="${height}" fill="url(#bookGradient)" rx="8" ry="8" filter="url(#shadow)"/>
                
                <!-- Decorative border -->
                <rect x="15" y="15" width="${width-30}" height="${height-30}" 
                      fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="5" ry="5"/>
                
                <!-- Top emoji/icon -->
                <text x="50%" y="80" font-family="Arial, sans-serif" font-size="48" 
                      text-anchor="middle" fill="white">${theme.emoji}</text>
                
                <!-- Title -->
                <text x="50%" y="${height/2 - 30}" font-family="Georgia, serif" font-size="24" 
                      font-weight="bold" text-anchor="middle" fill="white">
                    <tspan x="50%" dy="0">${this.splitTitle(cleanTitle)[0]}</tspan>
                    ${this.splitTitle(cleanTitle)[1] ? `<tspan x="50%" dy="28">${this.splitTitle(cleanTitle)[1]}</tspan>` : ''}
                </text>
                
                <!-- Author -->
                ${author ? `<text x="50%" y="${height/2 + 40}" font-family="Arial, sans-serif" font-size="16" 
                           text-anchor="middle" fill="rgba(255,255,255,0.9)" font-style="italic">by ${cleanAuthor}</text>` : ''}
                
                <!-- Bottom decoration -->
                <rect x="50" y="${height-60}" width="${width-100}" height="2" fill="rgba(255,255,255,0.5)"/>
                <text x="50%" y="${height-35}" font-family="Arial, sans-serif" font-size="12" 
                      text-anchor="middle" fill="rgba(255,255,255,0.7)">BookSwap Collection</text>
                      
                <!-- Subtle pattern overlay -->
                <rect width="${width}" height="${height}" fill="url(#patternOverlay)" opacity="0.1" rx="8" ry="8"/>
            </svg>
        `;
        
        return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    }

    /**
     * Split long titles into two lines
     */
    splitTitle(title) {
        if (title.length <= 15) return [title, ''];
        
        const words = title.split(' ');
        if (words.length === 1) return [title, ''];
        
        const mid = Math.ceil(words.length / 2);
        return [
            words.slice(0, mid).join(' '),
            words.slice(mid).join(' ')
        ];
    }

    /**
     * Utility functions
     */
    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    /**
     * HTTP GET helper function
     */
    httpGet(url) {
        return new Promise((resolve, reject) => {
            const lib = url.startsWith('https') ? https : http;
            const request = lib.get(url, (response) => {
                let data = '';
                response.on('data', (chunk) => data += chunk);
                response.on('end', () => resolve(data));
            });
            request.on('error', (error) => reject(error));
            request.setTimeout(5000, () => {
                request.abort();
                reject(new Error('Request timeout'));
            });
        });
    }

    /**
     * Create simple fallback image
     */
    createFallbackImage(text, color) {
        const svg = `
            <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="450" fill="${color}"/>
                <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
                      text-anchor="middle" fill="white">${text}</text>
                <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="16" 
                      text-anchor="middle" fill="white">No Image</text>
            </svg>
        `;
        return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
    }

    /**
     * Clear cache (useful for development)
     */
    clearCache() {
        this.cache.clear();
        console.log('📸 Book image cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

module.exports = new BookImageService();
