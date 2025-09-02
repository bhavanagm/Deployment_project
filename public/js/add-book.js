document.addEventListener("DOMContentLoaded", () => {
  // Generate Book ID
  const bookIdField = document.getElementById("bookId");
  if (bookIdField) {
    bookIdField.value = "BOOK-" + Date.now();
  }

  // Image preview
  const imageInput = document.getElementById("image");
  const previewImg = document.getElementById("previewImg");

  if (imageInput && previewImg) {
    imageInput.addEventListener("change", () => {
      const file = imageInput.files[0];
      if (file) {
        previewImg.src = URL.createObjectURL(file);
        previewImg.style.display = "block";
      } else {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
    });
  }

  // Hamburger menu toggle
  const hamburger = document.getElementById("hamburger");
  const sideMenu = document.getElementById("sideMenu");

  if (hamburger && sideMenu) {
    hamburger.addEventListener("click", () => {
      sideMenu.classList.toggle("show");
    });

    window.addEventListener("click", (e) => {
      if (!sideMenu.contains(e.target) && !hamburger.contains(e.target)) {
        sideMenu.classList.remove("show");
      }
    });
  }

  // Form validation
  const form = document.getElementById("addBookForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      const requiredFields = ["title", "author", "genre", "condition", "type", "location"];
      let valid = true;

      requiredFields.forEach((id) => {
        const field = document.getElementById(id);
        if (field && !field.value.trim()) {
          field.classList.add("invalid-field");
          valid = false;
        } else if (field) {
          field.classList.remove("invalid-field");
        }
      });

      if (!valid) {
        e.preventDefault();
        alert("❗ Please fill in all required fields.");
      }
    });
  }

  // Back button
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.history.length > 1 ? window.history.back() : window.location.href = "/index";
    });
  }
});
