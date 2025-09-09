const Book = require('../models/book');
const User = require('../models/user');

/**
 * Advanced Query Handlers for Different Types of Queries
 * Handles informational, transactional, and conversational queries
 */

class QueryHandlers {
  constructor() {
    this.bookDatabase = this.initializeBookDatabase();
    this.userSessions = new Map();
  }

  // Initialize book knowledge database
  initializeBookDatabase() {
    return {
      genres: {
        fiction: {
          subgenres: ['romance', 'mystery', 'fantasy', 'sci-fi', 'literary', 'historical'],
          popular: ['The Great Gatsby', '1984', 'Pride and Prejudice', 'Harry Potter']
        },
        nonfiction: {
          subgenres: ['biography', 'self-help', 'business', 'science', 'history'],
          popular: ['Sapiens', 'Atomic Habits', 'Steve Jobs', 'Thinking Fast and Slow']
        },
        academic: {
          subgenres: ['textbooks', 'reference', 'research'],
          popular: ['Engineering Mathematics', 'Principles of Economics']
        }
      },
      authors: {
        'j.k. rowling': ['Harry Potter series', 'The Casual Vacancy'],
        'stephen king': ['The Shining', 'It', 'The Stand'],
        'agatha christie': ['Murder on the Orient Express', 'And Then There Were None']
      },
      bookConditions: ['new', 'excellent', 'good', 'fair', 'poor'],
      locations: [] // Will be populated from database
    };
  }

  /**
   * INFORMATIONAL QUERY HANDLERS
   * Handle queries seeking information about books, platform, or general knowledge
   */

  async handleBookRecommendationQuery(entities, context, userId) {
    const genre = entities.genre || 'general';
    const mood = entities.mood || null;
    const author = entities.author_name || null;

    try {
      // Get user's reading history if available
      const userHistory = await this.getUserReadingHistory(userId);
      
      let recommendations = [];

      if (author) {
        recommendations = await this.getBooksByAuthor(author);
      } else if (genre !== 'general') {
        recommendations = await this.getBooksByGenre(genre);
      } else {
        recommendations = await this.getPopularBooks();
      }

      // Personalize based on user history
      if (userHistory && userHistory.length > 0) {
        recommendations = this.personalizeRecommendations(recommendations, userHistory);
      }

      // Format response
      const response = this.formatBookRecommendations(recommendations, genre, mood);
      
      return {
        type: 'informational',
        category: 'book_recommendation',
        response: response,
        suggestions: ['Tell me more about these books', 'Show me different genre', 'Check availability'],
        followUp: true
      };

    } catch (error) {
      console.error('Error handling book recommendation:', error);
      return this.getErrorResponse('book_recommendation');
    }
  }

  async handlePlatformInformationQuery(entities, context) {
    const feature = entities.platform_feature || 'general';
    
    const platformInfo = {
      general: {
        title: "About BookSwap",
        content: `BookSwap is a community-driven platform where readers can:
        📚 Donate books to help others
        🔄 Swap books to discover new reads  
        🚚 Use convenient pickup services
        🤝 Connect with fellow book lovers
        
        Our mission is to keep books in circulation and build a reading community!`,
        actions: ['Browse Gallery', 'Add a Book', 'Request Pickup']
      },
      pickup: {
        title: "Pickup Service",
        content: `Our pickup service offers:
        • Schedule collection from your location
        • Choose convenient time slots
        • Track requests with unique IDs
        • SMS and email updates
        • Perfect for donations and swaps!`,
        actions: ['Request Pickup', 'Track Pickup', 'Pickup FAQs']
      },
      swap: {
        title: "Book Swapping",
        content: `Book swapping lets you:
        • Exchange books with other users
        • Browse books marked as 'Swap'
        • Connect directly with owners
        • Arrange meetups or use pickup
        • Build your collection for free!`,
        actions: ['Browse Swaps', 'Add Swap Book', 'My Swaps']
      },
      gallery: {
        title: "Book Gallery",
        content: `The gallery features:
        • All available books in one place
        • Filter by genre, condition, type
        • Search for specific titles/authors
        • View detailed book information
        • Direct contact with owners`,
        actions: ['Visit Gallery', 'Search Books', 'Filter Options']
      }
    };

    const info = platformInfo[feature] || platformInfo.general;

    return {
      type: 'informational',
      category: 'platform_info',
      response: `## ${info.title}\n\n${info.content}`,
      suggestions: info.actions,
      followUp: false
    };
  }

  /**
   * TRANSACTIONAL QUERY HANDLERS
   * Handle queries that perform actions or transactions
   */

  async handleDonationQuery(entities, context, userId) {
    const bookType = entities.book_type || 'book';
    const genre = entities.genre || null;
    const condition = entities.book_condition || 'good';

    // Check if user is logged in
    const user = await this.getUser(userId);
    if (!user) {
      return {
        type: 'transactional',
        category: 'donation_auth_required',
        response: "To donate books, you'll need to log in first. Would you like me to guide you to the login page?",
        suggestions: ['Login', 'Register', 'Learn More'],
        requiresAuth: true
      };
    }

    // Provide donation guidance
    const donationSteps = this.getDonationSteps(bookType, condition);
    
    return {
      type: 'transactional',
      category: 'donation_guide',
      response: donationSteps,
      suggestions: ['Start Donating', 'Upload Photos', 'Need Help'],
      followUp: true,
      actionUrl: '/add-book'
    };
  }

  async handlePickupRequestQuery(entities, context, userId) {
    const urgency = entities.date_time || 'flexible';
    const location = entities.location || null;

    try {
      // Check for existing pickup requests
      const existingRequests = await this.getUserPickupRequests(userId);

      if (existingRequests && existingRequests.length > 0) {
        return {
          type: 'transactional',
          category: 'pickup_existing',
          response: `You have ${existingRequests.length} active pickup request(s). Would you like to:`,
          suggestions: ['Track Existing', 'New Request', 'Modify Request'],
          data: { requests: existingRequests }
        };
      }

      // Guide new pickup request
      const pickupGuide = this.getPickupRequestSteps(urgency);

      return {
        type: 'transactional',
        category: 'pickup_new',
        response: pickupGuide,
        suggestions: ['Start Request', 'Check Availability', 'Pickup FAQs'],
        actionUrl: '/pickup-request'
      };

    } catch (error) {
      console.error('Error handling pickup request:', error);
      return this.getErrorResponse('pickup_request');
    }
  }

  async handleBookSearchQuery(entities, context, userId) {
    const title = entities.book_title || null;
    const author = entities.author_name || null;
    const genre = entities.genre || null;

    try {
      let searchResults = [];

      if (title) {
        searchResults = await this.searchBooksByTitle(title);
      } else if (author) {
        searchResults = await this.searchBooksByAuthor(author);
      } else if (genre) {
        searchResults = await this.searchBooksByGenre(genre);
      } else {
        return {
          type: 'transactional',
          category: 'search_clarification',
          response: "I'd be happy to help you search for books! What are you looking for?",
          suggestions: ['Search by Title', 'Search by Author', 'Browse Genres'],
          followUp: true
        };
      }

      if (searchResults.length === 0) {
        return {
          type: 'transactional',
          category: 'search_no_results',
          response: `No books found matching your search. Try:
          • Different spelling or keywords
          • Browse similar genres
          • Post a "Looking for" request`,
          suggestions: ['Browse Similar', 'Post Request', 'Try Different Search']
        };
      }

      return {
        type: 'transactional',
        category: 'search_results',
        response: this.formatSearchResults(searchResults),
        suggestions: ['Contact Owner', 'Save Search', 'Refine Search'],
        data: { results: searchResults }
      };

    } catch (error) {
      console.error('Error handling book search:', error);
      return this.getErrorResponse('book_search');
    }
  }

  /**
   * CONVERSATIONAL QUERY HANDLERS
   * Handle social interactions and conversation flow
   */

  handleGreetingQuery(entities, context, userId) {
    const timeOfDay = this.getTimeOfDay();
    const userStatus = entities.user_status || 'returning';
    
    let greeting;
    if (userStatus === 'new') {
      greeting = `Good ${timeOfDay}! Welcome to BookSwap! 🌟 I'm Elina, your friendly assistant. I'm excited to help you discover the wonderful world of book sharing!`;
    } else {
      greeting = `Good ${timeOfDay}! Great to see you back on BookSwap! 📚 How can I help you today?`;
    }

    return {
      type: 'conversational',
      category: 'greeting',
      response: greeting,
      suggestions: ['Find Books', 'Donate Books', 'How It Works'],
      followUp: true,
      tone: 'friendly'
    };
  }

  handleThanksQuery(entities, context, userId) {
    const responses = [
      "You're absolutely welcome! It's my pleasure to help fellow book lovers! 📚✨",
      "Happy to help! That's what the BookSwap community is all about! 🤗",
      "My pleasure! Feel free to reach out anytime you need assistance with books! 🌟"
    ];

    return {
      type: 'conversational',
      category: 'thanks',
      response: responses[Math.floor(Math.random() * responses.length)],
      suggestions: ['Browse Books', 'Share Feedback', 'Ask Another Question'],
      followUp: false,
      tone: 'warm'
    };
  }

  handleGoodbyeQuery(entities, context, userId) {
    const farewells = [
      "Goodbye! Thanks for being part of our reading community! 📚👋",
      "See you soon! Happy reading and book sharing! 🌟",
      "Until next time! May you find your next great read! 📖✨"
    ];

    return {
      type: 'conversational',
      category: 'goodbye',
      response: farewells[Math.floor(Math.random() * farewells.length)],
      suggestions: [],
      followUp: false,
      tone: 'warm'
    };
  }

  /**
   * TECHNICAL SUPPORT HANDLERS
   */

  handleTechnicalSupportQuery(entities, context) {
    const issue = entities.issue || 'general';
    
    const troubleshooting = {
      login: {
        steps: [
          "Check email/password spelling",
          "Ensure caps lock is off", 
          "Try password reset",
          "Clear browser cache",
          "Check if registered"
        ],
        additionalHelp: "Still can't log in? Try creating a new account or contact support."
      },
      upload: {
        steps: [
          "File should be under 5MB",
          "Use JPG, PNG, or GIF format",
          "Ensure stable internet connection",
          "Try refreshing the page",
          "Images are optional for listings"
        ],
        additionalHelp: "If problems persist, try a different image or skip the photo step."
      },
      slow: {
        steps: [
          "Check internet connection",
          "Clear browser cache and cookies",
          "Close other browser tabs",
          "Try a different browser",
          "Restart your browser"
        ],
        additionalHelp: "High traffic periods may cause slowdowns. Please be patient!"
      }
    };

    const support = troubleshooting[issue] || troubleshooting.slow;

    return {
      type: 'support',
      category: 'troubleshooting',
      response: `Here's how to resolve ${issue} issues:\n\n` +
        support.steps.map((step, i) => `${i + 1}. ${step}`).join('\n') +
        `\n\n${support.additionalHelp}`,
      suggestions: ['Try Solutions', 'Contact Support', 'Different Issue'],
      followUp: true
    };
  }

  /**
   * UTILITY METHODS
   */

  async getUserReadingHistory(userId) {
    try {
      // This would integrate with actual database
      // For now, return mock data or empty array
      return [];
    } catch (error) {
      return [];
    }
  }

  async getUser(userId) {
    try {
      if (!userId || userId === 'anonymous') return null;
      // Check if user exists in database
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      return null;
    }
  }

  async searchBooksByTitle(title) {
    try {
      const books = await Book.find({
        title: { $regex: title, $options: 'i' },
        isActive: true
      }).limit(10);
      return books;
    } catch (error) {
      return [];
    }
  }

  async searchBooksByAuthor(author) {
    try {
      const books = await Book.find({
        author: { $regex: author, $options: 'i' },
        isActive: true
      }).limit(10);
      return books;
    } catch (error) {
      return [];
    }
  }

  async searchBooksByGenre(genre) {
    try {
      const books = await Book.find({
        genre: { $regex: genre, $options: 'i' },
        isActive: true
      }).limit(10);
      return books;
    } catch (error) {
      return [];
    }
  }

  formatSearchResults(results) {
    if (results.length === 0) return "No books found.";
    
    const formatted = results.slice(0, 5).map((book, i) => 
      `${i + 1}. **${book.title}** by ${book.author}\n   Genre: ${book.genre} | Condition: ${book.condition}`
    ).join('\n\n');

    return `Found ${results.length} book(s):\n\n${formatted}${results.length > 5 ? '\n\n...and more! Visit the Gallery to see all results.' : ''}`;
  }

  getDonationSteps(bookType, condition) {
    return `Ready to donate your ${bookType}? Here's how:

1. **Click "Add Book"** from the main menu
2. **Enter book details** (title, author, genre)
3. **Set condition** as "${condition}" or adjust as needed
4. **Select "Donate"** as the book type
5. **Add your location** for pickup/contact
6. **Upload a photo** (optional but helpful!)
7. **Submit** and help someone discover a great read!

${bookType === 'textbook' ? 'Textbook donations are especially valuable for students! 📖' : 'Your donation makes a real difference in our reading community! 🌟'}`;
  }

  getPickupRequestSteps(urgency) {
    const timeAdvice = urgency === 'tomorrow' || urgency === 'urgent' 
      ? "For urgent requests, please call our pickup hotline after submitting."
      : "Standard pickups are scheduled 2-5 days in advance.";

    return `Ready to request a pickup? Here's the process:

1. **Go to Pickup Request** page
2. **Fill in your details** (name, email, phone)
3. **Enter book information** you want collected
4. **Provide complete address** with landmarks
5. **Choose your preferred date/time**
6. **Submit and get tracking ID**

${timeAdvice}

You'll receive SMS and email confirmations with your pickup details! 🚚`;
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  personalizeRecommendations(recommendations, userHistory) {
    // Simple personalization based on user's reading history
    // In a real implementation, this would use more sophisticated algorithms
    return recommendations;
  }

  formatBookRecommendations(books, genre, mood) {
    if (books.length === 0) {
      return `I don't have specific ${genre} recommendations right now, but check our Gallery - new books are added daily!`;
    }

    const prefix = mood 
      ? `Perfect ${mood} ${genre} books for you:`
      : `Great ${genre} recommendations:`;

    const bookList = books.slice(0, 4).map((book, i) => 
      `${i + 1}. **${book.title || book}** ${book.author ? `by ${book.author}` : ''}`
    ).join('\n');

    return `${prefix}\n\n${bookList}\n\nCheck our Gallery to see if any of these are available for swap or donation! 🌟`;
  }

  getErrorResponse(category) {
    const errors = {
      book_recommendation: "I'm having trouble finding recommendations right now. Try browsing our Gallery or asking about a specific genre!",
      pickup_request: "I can't access pickup information at the moment. Please visit the Pickup Request page directly.",
      book_search: "Search is temporarily unavailable. Please try browsing the Gallery instead!"
    };

    return {
      type: 'error',
      category: category,
      response: errors[category] || "Something went wrong, but I'm still here to help! What else can I assist you with?",
      suggestions: ['Try Again', 'Browse Gallery', 'Ask Different Question'],
      followUp: true
    };
  }
}

module.exports = new QueryHandlers();
