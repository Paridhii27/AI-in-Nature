// Get all category buttons
const educateButton = document.getElementById("option-educate");
const speculateButton = document.getElementById("option-speculate");
const mindfulButton = document.getElementById("option-mindful");
const funnyButton = document.getElementById("option-funny");

// Load saved category on page load
document.addEventListener("DOMContentLoaded", () => {
  const savedCategory = localStorage.getItem("selectedCategory") || "educate";
  setActiveCategory(savedCategory);
});

// Function to set active category
function setActiveCategory(category) {
  // Remove active class from all buttons
  [educateButton, speculateButton, mindfulButton, funnyButton].forEach(
    (button) => {
      button.classList.remove("active");
    }
  );

  // Add active class to selected button
  switch (category) {
    case "educate":
      educateButton.classList.add("active");
      break;
    case "speculate":
      speculateButton.classList.add("active");
      break;
    case "mindful":
      mindfulButton.classList.add("active");
      break;
    case "funny":
      funnyButton.classList.add("active");
      break;
  }

  // Save selection to localStorage
  localStorage.setItem("selectedCategory", category);
}

// Add click event listeners to buttons
educateButton.addEventListener("click", () => setActiveCategory("educate"));
speculateButton.addEventListener("click", () => setActiveCategory("speculate"));
mindfulButton.addEventListener("click", () => setActiveCategory("mindful"));
funnyButton.addEventListener("click", () => setActiveCategory("funny"));
