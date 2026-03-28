// Filter buttons
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".member-card");

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    cards.forEach((card) => {
      if (filter === "all" || card.dataset.depts.includes(filter)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });
});

// Wait for GSAP preloader to finish before observing cards
function initCardAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(cards).indexOf(entry.target);
          setTimeout(() => entry.target.classList.add("visible"), idx * 80);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05 },
  );

  cards.forEach((card) => observer.observe(card));

  // Force-trigger any cards already in view
  setTimeout(() => {
    cards.forEach((card, idx) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        setTimeout(() => card.classList.add("visible"), idx * 80);
      }
    });
  }, 100);
}

// Delay until after the preloader animation completes (~2.5s first visit, instant on return)
const alreadySeen = sessionStorage.getItem("preloaderShown") === "true";
setTimeout(initCardAnimations, alreadySeen ? 100 : 2600);
