/**
 * Book images utility functions
 * This script handles image loading, fallbacks, and error handling for book gallery
 */

// Utility function to properly handle book image URLs
function getBookImageUrl(book) {
  if (!book || !book.image) {
    return 'https://via.placeholder.com/300x400/3f51b5/ffffff?text=No+Image';
  }
  
  // If image is a URL starting with http, use it directly
  if (book.image.startsWith('http')) {
    return book.image;
  }
  
  // If image is a relative path starting with /uploads, make sure it's properly referenced
  if (book.image.startsWith('/uploads')) {
    return book.image; // The server will handle this path
  }
  
  // For any other format, default to placeholder
  return 'https://via.placeholder.com/300x400/3f51b5/ffffff?text=No+Image';
}

// Genre-based fallback images
function getGenreFallbackImage(genre) {
  const genreFallbacks = {
    'Fiction': 'https://via.placeholder.com/300x400/4a90e2/ffffff?text=FICTION',
    'Biography': 'https://via.placeholder.com/300x400/f5a623/ffffff?text=BIOGRAPHY',
    'Science': 'https://via.placeholder.com/300x400/9013fe/ffffff?text=SCIENCE',
    'Self-help': 'https://via.placeholder.com/300x400/4bd863/ffffff?text=SELF+HELP',
    'Art': 'https://via.placeholder.com/300x400/e74c3c/ffffff?text=ART',
    'Architecture': 'https://via.placeholder.com/300x400/34495e/ffffff?text=ARCHITECTURE',
    'Cooking': 'https://via.placeholder.com/300x400/e67e22/ffffff?text=COOKING',
    'Travel': 'https://via.placeholder.com/300x400/3498db/ffffff?text=TRAVEL',
    'Business': 'https://via.placeholder.com/300x400/2c3e50/ffffff?text=BUSINESS'
  };
  
  return genreFallbacks[genre] || 'https://via.placeholder.com/300x400/3f51b5/ffffff?text=BOOK';
}

// Handle image load errors with multiple fallbacks
function handleImageError(imgElement, fallbackSrc) {
  console.log(`Image failed to load: ${imgElement.src}`);
  
  // Try a different approach with the same URL (sometimes this works)
  if (!imgElement.dataset.retried) {
    imgElement.dataset.retried = 'true';
    
    // If it was using /uploads format, try prepending the domain
    if (imgElement.src.startsWith('/uploads')) {
      const fullUrl = window.location.origin + imgElement.src;
      console.log(`Retrying with full URL: ${fullUrl}`);
      imgElement.src = fullUrl;
      return;
    }
  }
  
  // If retry failed or not applicable, use the fallback
  console.log(`Using fallback image: ${fallbackSrc}`);
  imgElement.src = fallbackSrc;
  imgElement.dataset.fallback = 'true';
}

// Truncate text function for long titles or authors
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Add additional styles for book cards and images
document.addEventListener('DOMContentLoaded', function() {
  // Add CSS for improved book images
  const style = document.createElement('style');
  style.textContent = `
    .book-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .book-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
    
    .book-image-container {
      position: relative;
      height: 200px;
      overflow: hidden;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    
    .book-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 6px;
      transition: transform 0.5s ease;
    }
    
    .book-card:hover img {
      transform: scale(1.05);
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      right: 0;
      padding: 5px;
    }
    
    .book-type-badge {
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    
    .book-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .book-id {
      font-size: 10px;
      color: #666;
      margin-top: auto;
      text-align: right;
    }
    
    .pickup-btn {
      background: #28a745;
      color: white;
    }
  `;
  document.head.appendChild(style);
});
