
    let allBooks = []; // Store all books for filtering

    // Hamburger Menu Toggle
    const hamburger = document.getElementById("hamburger");
    const sideMenu = document.getElementById("sideMenu");

    hamburger.addEventListener("click", () => {
      sideMenu.classList.toggle("show");
    });

    window.addEventListener("click", (e) => {
      if (!sideMenu.contains(e.target) && !hamburger.contains(e.target)) {
        sideMenu.classList.remove("show");
      }
    });

    // Load books from database
    async function loadBooks(filters = {}) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/books?${queryParams}`);
        const data = await response.json();
        
        if (data.success) {
          allBooks = data.books;
          displayBooks(data.books);
        } else {
          console.error('Error loading books:', data.message);
          showNoBooks('Error loading books from database.');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
        showNoBooks('Unable to load books. Please try again later.');
      }
    }

    // Display books in the gallery
    function displayBooks(books) {
      const gallery = document.getElementById('bookGallery');
      const noBooksMsg = document.getElementById('noBooksMessage');
      
      if (books.length === 0) {
        gallery.innerHTML = '';
        noBooksMsg.style.display = 'block';
        return;
      }
      
      noBooksMsg.style.display = 'none';
      
      gallery.innerHTML = books.map(book => {
        // Use placeholder image if no image is provided
        const imageUrl = book.image || 'https://via.placeholder.com/200x300/3f51b5/ffffff?text=No+Image';
        const bookId = book._id ? book._id.slice(-6) : 'N/A';
        const ownerInfo = book.userId ? ` | Owner: ${book.userId.username}` : '';
        
        return `
          <div class="book-card" 
               data-genre="${book.genre || ''}" 
               data-condition="${book.condition || ''}" 
               data-type="${book.type || ''}">
            <img src="${imageUrl}" alt="${book.title || 'Book'}" 
                 onerror="this.src='https://via.placeholder.com/200x300/3f51b5/ffffff?text=No+Image'">
            <h3>${book.title || 'Untitled'}</h3>
            <p><strong>Author:</strong> ${book.author || 'Unknown'}</p>
            <p><strong>Genre:</strong> ${book.genre || 'N/A'}</p>
            <p><strong>Condition:</strong> ${book.condition || 'N/A'}</p>
            <p><strong>Type:</strong> ${book.type || 'N/A'}</p>
            <p><strong>Location:</strong> ${book.location || 'N/A'}${ownerInfo}</p>
            <p><strong>ID:</strong> BOOK-${bookId}</p>
          </div>
        `;
      }).join('');
    }

    // Show no books message
    function showNoBooks(message = 'No books found matching your filters.') {
      const gallery = document.getElementById('bookGallery');
      const noBooksMsg = document.getElementById('noBooksMessage');
      
      gallery.innerHTML = '';
      noBooksMsg.textContent = message;
      noBooksMsg.style.display = 'block';
    }

    // Filter books locally (client-side filtering)
    function filterBooks() {
      const genre = document.getElementById('filterGenre').value;
      const condition = document.getElementById('filterCondition').value;
      const type = document.getElementById('filterType').value;
      
      let filteredBooks = allBooks;
      
      if (genre) {
        filteredBooks = filteredBooks.filter(book => 
          book.genre && book.genre.toLowerCase().includes(genre.toLowerCase())
        );
      }
      
      if (condition) {
        filteredBooks = filteredBooks.filter(book => 
          book.condition && book.condition.toLowerCase().includes(condition.toLowerCase())
        );
      }
      
      if (type) {
        filteredBooks = filteredBooks.filter(book => 
          book.type && book.type.toLowerCase().includes(type.toLowerCase())
        );
      }
      
      displayBooks(filteredBooks);
    }

    // Add event listeners to filters
    document.getElementById('filterGenre').addEventListener('change', filterBooks);
    document.getElementById('filterCondition').addEventListener('change', filterBooks);
    document.getElementById('filterType').addEventListener('change', filterBooks);

    // Back Button
    const backBtn = document.getElementById("backBtn");
    backBtn.addEventListener("click", () => {
      if (document.referrer && document.referrer !== window.location.href) {
        history.back();
      } else {
        window.location.href = "/index"; // fallback if no referrer
      }
    });

    // Load books when page loads
    document.addEventListener('DOMContentLoaded', () => {
      loadBooks();
    });
