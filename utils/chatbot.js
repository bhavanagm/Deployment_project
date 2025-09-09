const express = require('express');
const router = express.Router();

// Enhanced Book Knowledge Base
const bookKnowledge = {
  fiction: {
    classics: ['Pride and Prejudice', 'Jane Eyre', 'Great Expectations', '1984', 'To Kill a Mockingbird'],
    modern: ['The Alchemist', 'The Kite Runner', 'Life of Pi', 'The Book Thief', 'Eleanor Oliphant Is Completely Fine'],
    fantasy: ['Harry Potter series', 'Lord of the Rings', 'Game of Thrones', 'The Hobbit', 'Chronicles of Narnia'],
    mystery: ['Gone Girl', 'The Girl with the Dragon Tattoo', 'Sherlock Holmes', 'Agatha Christie novels', 'Big Little Lies']
  },
  nonFiction: {
    selfHelp: ['Atomic Habits', 'The 7 Habits of Highly Effective People', 'How to Win Friends and Influence People', 'The Power of Now', 'You Can Win'],
    business: ['Rich Dad Poor Dad', 'The Lean Startup', 'Good to Great', 'Think and Grow Rich', 'The 4-Hour Workweek'],
    science: ['A Brief History of Time', 'The Selfish Gene', 'Sapiens', 'Cosmos', 'The Origin of Species'],
    biography: ['Steve Jobs', 'Long Walk to Freedom', 'The Diary of a Young Girl', 'Becoming', 'Wings of Fire']
  },
  academic: {
    textbooks: ['Engineering Mathematics', 'Principles of Economics', 'Gray\'s Anatomy', 'Organic Chemistry', 'Computer Networks'],
    reference: ['Oxford Dictionary', 'Encyclopedia Britannica', 'Atlas of World History', 'Medical Dictionary']
  }
};

// Common questions and responses
const responses = {
  greetings: [
    "Hello! I'm Elina, your friendly BookSwap assistant! 📚 How can I help you find your next great read?",
    "Hi there! Welcome to BookSwap! I'm here to help you with books, donations, swaps, and more! 🌟",
    "Hey! I'm Elina, ready to assist you with all things books! What would you like to know? 📖"
  ],
  
  howToUse: {
    donate: "📚 To donate a book:\n1. Click 'Add Book' in the menu\n2. Fill in book details (title, author, genre, condition)\n3. Select 'Donate' as type\n4. Add your location and contact info\n5. Upload a photo (optional)\n6. Submit! Your book will appear in the gallery for others to request.",
    
    swap: "🔄 To swap books:\n1. Browse the Gallery to find books marked 'Swap'\n2. Click on a book you're interested in\n3. Contact the owner through the platform\n4. Arrange to meet or use our pickup service\n5. Don't forget to add your own books for swapping!",
    
    pickup: "🚚 To request pickup:\n1. Go to 'Pickup Request' page\n2. Fill in your details (name, email, phone)\n3. Enter the book title you want\n4. Provide your complete address\n5. Choose preferred date and time slot\n6. Submit and get a tracking ID!",
    
    search: "🔍 To find books:\n1. Visit the Gallery page\n2. Use filters: Genre, Condition, Type\n3. Use the search bar for specific titles or authors\n4. Click on any book for more details\n5. Contact the owner if interested!"
  }
};

// Enhanced chatbot with better natural language processing
router.post('/', (req, res) => {
  const msg = req.body.message.toLowerCase().trim();
  let reply = "I'm still learning! Could you rephrase your question? I can help with book recommendations, donations, swaps, pickups, and general BookSwap guidance! 📚";

  try {
    // Greetings
    if (isGreeting(msg)) {
      reply = getRandomResponse(responses.greetings);
    }
    
    // Book recommendations
    else if (isAskingForRecommendation(msg)) {
      reply = getBookRecommendation(msg);
    }
    
    // How-to questions
    else if (isAskingHowTo(msg)) {
      reply = getHowToResponse(msg);
    }
    
    // Platform features
    else if (isAskingAboutFeatures(msg)) {
      reply = getFeatureExplanation(msg);
    }
    
    // Troubleshooting
    else if (isAskingForHelp(msg)) {
      reply = getTroubleshootingHelp(msg);
    }
    
    // Book-specific questions
    else if (isAskingAboutSpecificBook(msg)) {
      reply = getBookInformation(msg);
    }
    
    // General BookSwap questions
    else if (isGeneralQuestion(msg)) {
      reply = getGeneralAnswer(msg);
    }
    
    // Thank you responses
    else if (isSayingThanks(msg)) {
      reply = "You're very welcome! Happy reading! 📚✨ Feel free to ask if you need anything else!";
    }
    
    // Default helpful response
    else {
      reply = getHelpfulDefault();
    }
    
  } catch (error) {
    console.error('Chatbot error:', error);
    reply = "Oops! I encountered a small hiccup. Please try asking your question again! 🤖";
  }

  res.json({ reply, timestamp: new Date().toISOString() });
});

// Helper functions for better natural language understanding
function isGreeting(msg) {
  const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
  return greetings.some(greeting => msg.includes(greeting));
}

function isAskingForRecommendation(msg) {
  const keywords = ['recommend', 'suggest', 'what should i read', 'good book', 'book recommendation', 'what to read'];
  return keywords.some(keyword => msg.includes(keyword));
}

function isAskingHowTo(msg) {
  return msg.includes('how to') || msg.includes('how do i') || msg.includes('how can i');
}

function isAskingAboutFeatures(msg) {
  const features = ['pickup', 'swap', 'donate', 'gallery', 'dashboard', 'profile', 'search'];
  return features.some(feature => msg.includes(feature));
}

function isAskingForHelp(msg) {
  const helpKeywords = ['help', 'problem', 'issue', 'error', 'not working', 'broken', 'trouble'];
  return helpKeywords.some(keyword => msg.includes(keyword));
}

function isAskingAboutSpecificBook(msg) {
  return msg.includes('book about') || msg.includes('tell me about') || msg.includes('author of');
}

function isGeneralQuestion(msg) {
  const generalKeywords = ['what is', 'what are', 'tell me', 'explain', 'bookswap', 'platform'];
  return generalKeywords.some(keyword => msg.includes(keyword));
}

function isSayingThanks(msg) {
  const thanks = ['thank', 'thanks', 'appreciate', 'grateful'];
  return thanks.some(word => msg.includes(word));
}

function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

function getBookRecommendation(msg) {
  let category = '';
  let books = [];
  
  if (msg.includes('fiction') || msg.includes('novel') || msg.includes('story')) {
    if (msg.includes('classic')) {
      books = bookKnowledge.fiction.classics;
      category = 'classic fiction';
    } else if (msg.includes('fantasy') || msg.includes('magic')) {
      books = bookKnowledge.fiction.fantasy;
      category = 'fantasy';
    } else if (msg.includes('mystery') || msg.includes('thriller')) {
      books = bookKnowledge.fiction.mystery;
      category = 'mystery/thriller';
    } else {
      books = bookKnowledge.fiction.modern;
      category = 'modern fiction';
    }
  } else if (msg.includes('self-help') || msg.includes('personal development') || msg.includes('motivation')) {
    books = bookKnowledge.nonFiction.selfHelp;
    category = 'self-help';
  } else if (msg.includes('business') || msg.includes('entrepreneur') || msg.includes('success')) {
    books = bookKnowledge.nonFiction.business;
    category = 'business';
  } else if (msg.includes('science') || msg.includes('physics') || msg.includes('biology')) {
    books = bookKnowledge.nonFiction.science;
    category = 'science';
  } else if (msg.includes('biography') || msg.includes('life story') || msg.includes('memoir')) {
    books = bookKnowledge.nonFiction.biography;
    category = 'biography';
  } else {
    // General recommendation
    const allBooks = [
      ...bookKnowledge.fiction.modern,
      ...bookKnowledge.nonFiction.selfHelp,
      ...bookKnowledge.nonFiction.business.slice(0, 2)
    ];
    books = allBooks.slice(0, 5);
    category = 'popular';
  }
  
  const selectedBooks = books.slice(0, 3);
  return `📚 Here are some great ${category} books I recommend:\n\n${selectedBooks.map((book, i) => `${i + 1}. ${book}`).join('\n')}\n\nYou can check our Gallery to see if any of these are available for swap or donation! 🌟`;
}

function getHowToResponse(msg) {
  if (msg.includes('donate')) {
    return responses.howToUse.donate;
  } else if (msg.includes('swap')) {
    return responses.howToUse.swap;
  } else if (msg.includes('pickup')) {
    return responses.howToUse.pickup;
  } else if (msg.includes('search') || msg.includes('find')) {
    return responses.howToUse.search;
  } else {
    return "🤔 I can help you with:\n\n📚 How to donate books\n🔄 How to swap books\n🚚 How to request pickup\n🔍 How to search for books\n\nWhich would you like to know about?";
  }
}

function getFeatureExplanation(msg) {
  if (msg.includes('pickup')) {
    return "🚚 Our Pickup Service:\n\n• Schedule book collection from your location\n• Choose convenient time slots\n• Track your request with a unique ID\n• Get SMS and email updates\n• Perfect for donations and swaps!\n\nWould you like to know how to request a pickup?";
  } else if (msg.includes('swap')) {
    return "🔄 Book Swapping:\n\n• Exchange books with other users\n• Browse books marked as 'Swap'\n• Connect directly with book owners\n• Arrange meetups or use pickup service\n• Build your reading collection for free!\n\nCheck out our Gallery to start swapping!";
  } else if (msg.includes('gallery')) {
    return "📖 Book Gallery:\n\n• Browse all available books\n• Filter by genre, condition, type\n• Search for specific titles or authors\n• View book details and photos\n• Contact owners directly\n\nVisit the Gallery to explore our collection!";
  } else {
    return "✨ BookSwap Features:\n\n📚 Donate books to the community\n🔄 Swap books with other readers\n🚚 Request home pickup service\n📖 Browse extensive book gallery\n👤 Manage your profile and books\n📊 Track your reading activities\n\nWhat would you like to explore first?";
  }
}

function getTroubleshootingHelp(msg) {
  if (msg.includes('pickup') || msg.includes('submit')) {
    return "🔧 Pickup Form Issues:\n\n• Make sure all required fields are filled\n• Use a valid email address\n• Phone number should be 10-15 digits\n• Address should be complete with landmark\n• Select a future date for pickup\n\nStill having trouble? Try refreshing the page!";
  } else if (msg.includes('login') || msg.includes('password')) {
    return "🔐 Login Issues:\n\n• Check your email and password spelling\n• Ensure caps lock is off\n• Try resetting your password\n• Clear your browser cache\n• Make sure you're registered\n\nNeed to create an account? Visit the registration page!";
  } else if (msg.includes('upload') || msg.includes('image')) {
    return "📸 Image Upload Issues:\n\n• File should be under 5MB\n• Use JPG, PNG, or GIF format\n• Ensure stable internet connection\n• Try a different image if problems persist\n• Images are optional for book listings";
  } else {
    return "🛠️ Common Solutions:\n\n• Refresh the page\n• Clear browser cache\n• Check internet connection\n• Try a different browser\n• Make sure JavaScript is enabled\n\nWhat specific issue are you facing?";
  }
}

function getBookInformation(msg) {
  // This could be expanded with a real book API in the future
  return "📚 For detailed book information, I recommend:\n\n• Checking our Gallery for user reviews\n• Searching online databases like Goodreads\n• Looking at the book details in our listings\n• Asking the book owner directly\n\nIs there a specific book you're curious about?";
}

function getGeneralAnswer(msg) {
  if (msg.includes('bookswap') || msg.includes('platform')) {
    return "🌟 BookSwap Platform:\n\nWe're a community-driven book sharing platform where readers can:\n\n📚 Donate books to help others\n🔄 Swap books to discover new reads\n🚚 Use convenient pickup services\n🤝 Connect with fellow book lovers\n\nOur mission is to keep books in circulation and build a reading community! What would you like to explore?";
  } else {
    return "📖 I'm here to help with all things BookSwap!\n\nI can assist with:\n• Book recommendations\n• Platform guidance\n• Feature explanations\n• Troubleshooting\n• General questions\n\nWhat would you like to know?";
  }
}

function getHelpfulDefault() {
  const defaults = [
    "🤔 I'm not sure about that, but I can help with:\n\n📚 Book recommendations\n🔄 How to swap books\n📦 Pickup requests\n🔍 Finding books\n\nWhat interests you most?",
    "💭 Could you rephrase that? I'm great at helping with:\n\n• Adding/donating books\n• Book swapping process\n• Using pickup service\n• Browsing the gallery\n\nTry asking about any of these!",
    "🌟 I'd love to help! I specialize in:\n\n📖 BookSwap platform guidance\n📚 Reading recommendations\n🚚 Pickup service info\n🔄 Book swapping tips\n\nWhat can I help you with?"
  ];
  
  return getRandomResponse(defaults);
}

module.exports = router;
