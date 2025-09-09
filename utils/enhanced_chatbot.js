const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Enhanced Chatbot Engine with ML Integration
class EnhancedChatbot {
  constructor() {
    this.conversationMemory = new Map(); // Store conversation context
    this.userPreferences = new Map();    // Store user preferences
    this.analyticsData = [];             // Store interaction analytics
    this.trainingData = this.loadTrainingData();
    this.intentClassifier = new IntentClassifier(this.trainingData);
    this.responseGenerator = new ResponseGenerator();
    this.contextManager = new ContextManager();
  }

  // Load training data from JSON file
  loadTrainingData() {
    try {
      const dataPath = path.join(__dirname, '../training_data/comprehensive_dataset.json');
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const data = JSON.parse(rawData);
        return data.training_dataset.data;
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
    return [];
  }

  // Main processing method
  async processMessage(userId, message, sessionData = {}) {
    const startTime = Date.now();
    
    try {
      // Normalize input
      const normalizedMessage = this.preprocessMessage(message);
      
      // Get conversation context
      const context = this.contextManager.getContext(userId);
      
      // Classify intent
      const intentResult = this.intentClassifier.classify(normalizedMessage, context);
      
      // Extract entities
      const entities = this.extractEntities(normalizedMessage, intentResult.intent);
      
      // Generate response
      const response = await this.responseGenerator.generate(
        intentResult.intent,
        entities,
        context,
        normalizedMessage
      );
      
      // Update context
      this.contextManager.updateContext(userId, {
        lastIntent: intentResult.intent,
        lastEntities: entities,
        lastQuery: normalizedMessage,
        timestamp: Date.now()
      });
      
      // Log analytics
      this.logInteraction(userId, message, intentResult, response, Date.now() - startTime);
      
      return {
        reply: response.text,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities: entities,
        suggestions: response.suggestions || [],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Chatbot processing error:', error);
      return {
        reply: "I apologize, but I encountered an error. Please try rephrasing your question! 🤖",
        intent: "error",
        confidence: 0,
        entities: {},
        timestamp: new Date().toISOString()
      };
    }
  }

  // Preprocess user message
  preprocessMessage(message) {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, ' ')  // Remove punctuation
      .replace(/\s+/g, ' ')       // Normalize whitespace
      .trim();
  }

  // Extract entities from message
  extractEntities(message, intent) {
    const entities = {};
    
    // Genre extraction
    const genres = ['fiction', 'romance', 'mystery', 'fantasy', 'science', 'business', 'self-help', 'biography'];
    for (const genre of genres) {
      if (message.includes(genre)) {
        entities.genre = genre;
        break;
      }
    }
    
    // Book condition
    const conditions = ['new', 'good', 'fair', 'damaged', 'excellent'];
    for (const condition of conditions) {
      if (message.includes(condition)) {
        entities.book_condition = condition;
        break;
      }
    }
    
    // Time expressions
    const timeKeywords = ['today', 'tomorrow', 'next week', 'asap', 'urgent'];
    for (const time of timeKeywords) {
      if (message.includes(time)) {
        entities.date_time = time;
        break;
      }
    }
    
    // Platform features
    const features = ['pickup', 'swap', 'donate', 'gallery', 'profile', 'search'];
    for (const feature of features) {
      if (message.includes(feature)) {
        entities.platform_feature = feature;
        break;
      }
    }
    
    return entities;
  }

  // Log interaction for analytics
  logInteraction(userId, message, intentResult, response, processingTime) {
    const interaction = {
      userId,
      message,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      responseLength: response.text ? response.text.length : 0,
      processingTime,
      timestamp: new Date().toISOString()
    };
    
    this.analyticsData.push(interaction);
    
    // Keep only last 1000 interactions to prevent memory issues
    if (this.analyticsData.length > 1000) {
      this.analyticsData = this.analyticsData.slice(-1000);
    }
  }

  // Get analytics data
  getAnalytics() {
    const totalInteractions = this.analyticsData.length;
    const avgProcessingTime = this.analyticsData.reduce((sum, int) => sum + int.processingTime, 0) / totalInteractions;
    const intentDistribution = {};
    
    this.analyticsData.forEach(int => {
      intentDistribution[int.intent] = (intentDistribution[int.intent] || 0) + 1;
    });
    
    return {
      totalInteractions,
      avgProcessingTime: Math.round(avgProcessingTime),
      intentDistribution,
      topIntents: Object.entries(intentDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    };
  }
}

// Intent Classification System
class IntentClassifier {
  constructor(trainingData) {
    this.trainingData = trainingData;
    this.intentKeywords = this.buildKeywordMap();
  }

  buildKeywordMap() {
    const keywordMap = {};
    
    this.trainingData.forEach(data => {
      if (!keywordMap[data.intent]) {
        keywordMap[data.intent] = new Set();
      }
      
      // Extract keywords from query
      const words = data.query.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) { // Only consider words longer than 2 characters
          keywordMap[data.intent].add(word);
        }
      });
    });
    
    return keywordMap;
  }

  classify(message, context = {}) {
    const words = message.split(/\s+/);
    const intentScores = {};
    
    // Calculate scores for each intent based on keyword matches
    Object.keys(this.intentKeywords).forEach(intent => {
      let score = 0;
      const keywords = this.intentKeywords[intent];
      
      words.forEach(word => {
        if (keywords.has(word)) {
          score += 1;
        }
      });
      
      // Normalize by keyword count
      intentScores[intent] = keywords.size > 0 ? score / keywords.size : 0;
    });
    
    // Find best matching intent
    const bestIntent = Object.keys(intentScores).reduce((a, b) => 
      intentScores[a] > intentScores[b] ? a : b
    );
    
    const confidence = intentScores[bestIntent] || 0;
    
    // Apply context boost if available
    if (context.lastIntent && confidence < 0.7) {
      // Consider conversation flow
      const contextualIntents = this.getContextualIntents(context.lastIntent);
      if (contextualIntents.includes(bestIntent)) {
        return { intent: bestIntent, confidence: Math.min(confidence + 0.2, 0.9) };
      }
    }
    
    return { 
      intent: confidence > 0.1 ? bestIntent : 'general_inquiry', 
      confidence: Math.max(confidence, 0.1)
    };
  }

  getContextualIntents(lastIntent) {
    // Define likely follow-up intents based on conversation flow
    const contextMap = {
      'greeting': ['book_recommendation', 'how_to_donate', 'general_inquiry'],
      'book_recommendation': ['book_search', 'how_to_swap', 'pickup_request'],
      'how_to_donate': ['pickup_request', 'technical_support'],
      'pickup_request': ['thanks', 'troubleshooting']
    };
    
    return contextMap[lastIntent] || [];
  }
}

// Response Generation System
class ResponseGenerator {
  constructor() {
    this.templates = this.loadResponseTemplates();
  }

  loadResponseTemplates() {
    return {
      greeting: [
        "Hello! I'm Elina, your BookSwap assistant! 📚 How can I help you today?",
        "Hi there! Welcome to BookSwap! What would you like to explore?",
        "Hey! Ready to discover some amazing books? What can I help you with?"
      ],
      book_recommendation: {
        template: "Here are some {genre} books I recommend:\n{book_list}\nCheck our Gallery to see what's available!",
        fallback: "I'd love to recommend books! What genre interests you most? Fiction, non-fiction, or something specific?"
      },
      how_to_donate: {
        template: "To donate books:\n1. Click 'Add Book'\n2. Enter book details\n3. Select 'Donate' type\n4. Upload photos\n5. Submit!\n{personalized_tip}",
        fallback: "Donating is easy! Go to 'Add Book', fill in details, select 'Donate', and you're helping the community!"
      },
      technical_support: {
        template: "For {issue} issues:\n{troubleshooting_steps}\nStill having problems? Try refreshing or contact support!",
        fallback: "Technical issues can be frustrating! Try refreshing the page, clearing cache, or checking your internet connection."
      },
      thanks: [
        "You're very welcome! Happy reading! 📚✨",
        "Glad I could help! Enjoy exploring BookSwap!",
        "My pleasure! Feel free to ask anytime! 🤗"
      ]
    };
  }

  async generate(intent, entities, context, originalMessage) {
    const template = this.templates[intent];
    
    if (!template) {
      return { text: this.getGenericResponse(intent, entities) };
    }

    if (Array.isArray(template)) {
      // Random selection from array
      const randomIndex = Math.floor(Math.random() * template.length);
      return { text: template[randomIndex] };
    }

    if (template.template) {
      // Template with variables
      return { text: this.fillTemplate(template.template, entities, context) };
    }

    return { text: template.fallback || "I'm here to help! What would you like to know about BookSwap?" };
  }

  fillTemplate(template, entities, context) {
    let filled = template;
    
    // Replace placeholders based on entities
    if (entities.genre) {
      filled = filled.replace('{genre}', entities.genre);
      filled = filled.replace('{book_list}', this.getBookList(entities.genre));
    }
    
    if (entities.issue) {
      filled = filled.replace('{issue}', entities.issue);
      filled = filled.replace('{troubleshooting_steps}', this.getTroubleshootingSteps(entities.issue));
    }
    
    filled = filled.replace('{personalized_tip}', this.getPersonalizedTip(entities));
    
    return filled;
  }

  getBookList(genre) {
    const bookLists = {
      fiction: "1. The Alchemist\n2. To Kill a Mockingbird\n3. 1984",
      romance: "1. Pride and Prejudice\n2. The Notebook\n3. Jane Eyre",
      mystery: "1. Gone Girl\n2. Sherlock Holmes\n3. Agatha Christie novels",
      fantasy: "1. Harry Potter series\n2. Lord of the Rings\n3. Game of Thrones",
      business: "1. Rich Dad Poor Dad\n2. Good to Great\n3. The Lean Startup"
    };
    
    return bookLists[genre] || "1. The Alchemist\n2. Atomic Habits\n3. Sapiens";
  }

  getTroubleshootingSteps(issue) {
    const steps = {
      login: "• Check email/password spelling\n• Try password reset\n• Clear browser cache",
      upload: "• File should be under 5MB\n• Use JPG/PNG format\n• Check internet connection",
      slow: "• Check internet connection\n• Clear browser cache\n• Try different browser"
    };
    
    return steps[issue] || "• Refresh the page\n• Clear browser cache\n• Check internet connection";
  }

  getPersonalizedTip(entities) {
    if (entities.genre === 'textbook') {
      return "Textbook donations are especially valuable for students! 📖";
    }
    if (entities.book_condition === 'damaged') {
      return "Please describe the condition honestly - some readers don't mind wear!";
    }
    return "Your contribution makes a difference in the reading community! 🌟";
  }

  getGenericResponse(intent, entities) {
    const responses = [
      "I'd be happy to help! Could you be more specific about what you need?",
      "I'm here to assist with BookSwap! What would you like to know?",
      "Let me help you with that! Can you provide more details?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }
}

// Context Management System
class ContextManager {
  constructor() {
    this.contexts = new Map();
    this.maxContextAge = 30 * 60 * 1000; // 30 minutes
  }

  getContext(userId) {
    const context = this.contexts.get(userId);
    
    if (!context) {
      return { isNew: true };
    }
    
    // Check if context is expired
    if (Date.now() - context.timestamp > this.maxContextAge) {
      this.contexts.delete(userId);
      return { isNew: true };
    }
    
    return context;
  }

  updateContext(userId, newContext) {
    const existing = this.contexts.get(userId) || {};
    const updated = {
      ...existing,
      ...newContext,
      timestamp: Date.now()
    };
    
    this.contexts.set(userId, updated);
  }

  clearContext(userId) {
    this.contexts.delete(userId);
  }

  // Cleanup expired contexts periodically
  cleanup() {
    const now = Date.now();
    for (const [userId, context] of this.contexts.entries()) {
      if (now - context.timestamp > this.maxContextAge) {
        this.contexts.delete(userId);
      }
    }
  }
}

// Create chatbot instance
const chatbot = new EnhancedChatbot();

// Cleanup expired contexts every 10 minutes
setInterval(() => {
  chatbot.contextManager.cleanup();
}, 10 * 60 * 1000);

// API Routes
router.post('/', async (req, res) => {
  const { message, userId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  try {
    const response = await chatbot.processMessage(userId || 'anonymous', message);
    res.json(response);
  } catch (error) {
    console.error('Enhanced chatbot error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      reply: "I'm experiencing some difficulties. Please try again in a moment! 🤖"
    });
  }
});

// Analytics endpoint
router.get('/analytics', (req, res) => {
  const analytics = chatbot.getAnalytics();
  res.json(analytics);
});

// Training endpoint (for future ML integration)
router.post('/train', (req, res) => {
  const { feedback, query, intent, correct_response } = req.body;
  
  // Store feedback for future training
  // This would integrate with the ML training pipeline
  
  res.json({ message: 'Feedback received for training' });
});

module.exports = router;
