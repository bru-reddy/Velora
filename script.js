/* =========================================================
   script.js — Velora main application logic
   -----------------------------------------------------------
   Responsibilities:
   - Render the dish catalog (with search + cuisine filters)
   - Handle the preference form and call ai.js for recommendations
   - Render recommendation cards with health-score rings
   - Manage Favorites using Local Storage
   - Manage the "About AI" info modal
   - Handle loading / error / empty states
   - Small UI niceties: mobile nav toggle, toast messages, smooth scroll
   ========================================================= */

/* -------------------- Local Storage Keys -------------------- */
const STORAGE_KEYS = {
  FAVORITES: "velora_favorites",
};

/* -------------------- App State -------------------- */
const state = {
  activeCuisine: "All",
  searchQuery: "",
  favorites: loadFavorites(),
};

/* =========================================================
   INITIALIZATION
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderCuisineOptions();
  renderCategoryChips();
  renderDishGrid();
  renderFavorites();
  setupNavbar();
  setupSearch();
  setupPreferenceForm();
  setupAiInfoModal();
  setupErrorRetry();
});

/* =========================================================
   LOCAL STORAGE HELPERS
   ========================================================= */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Could not read favorites from Local Storage:", err);
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
}

function isFavorite(name) {
  return state.favorites.some((f) => f.name === name);
}

function toggleFavorite(dish) {
  if (isFavorite(dish.name)) {
    state.favorites = state.favorites.filter((f) => f.name !== dish.name);
    showToast(`Removed "${dish.name}" from favorites`);
  } else {
    state.favorites.push(dish);
    showToast(`Saved "${dish.name}" to favorites`);
  }
  saveFavorites();
  renderFavorites();
  // Re-render visible grids so heart icons stay in sync
  renderDishGrid();
  renderExistingRecommendationHearts();
}

/* =========================================================
   NAVBAR (mobile toggle + smooth scroll)
   ========================================================= */
function setupNavbar() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  toggle.addEventListener("click", () => {
    links.classList.toggle("is-open");
  });

  // Close mobile menu after clicking a link (smooth scroll is native via CSS)
  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => links.classList.remove("is-open"));
  });
}

/* =========================================================
   CATEGORY CHIPS + CUISINE DROPDOWN
   ========================================================= */
function renderCuisineOptions() {
  const select = document.getElementById("cuisine");
  CUISINE_LIST.forEach((cuisine) => {
    const opt = document.createElement("option");
    opt.value = cuisine;
    opt.textContent = cuisine;
    select.appendChild(opt);
  });
}

function renderCategoryChips() {
  const container = document.getElementById("categoryGrid");
  const allCuisines = ["All", ...CUISINE_LIST];

  container.innerHTML = allCuisines
    .map(
      (cuisine) => `
      <button class="category-chip ${cuisine === state.activeCuisine ? "is-active" : ""}" data-cuisine="${cuisine}">
        ${cuisine}
      </button>`
    )
    .join("");

  container.querySelectorAll(".category-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.activeCuisine = chip.dataset.cuisine;
      renderCategoryChips();
      renderDishGrid();
    });
  });
}

/* =========================================================
   SEARCH BAR
   ========================================================= */
function setupSearch() {
  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.searchQuery = input.value.trim().toLowerCase();
    renderDishGrid();
    document.getElementById("categories").scrollIntoView({ behavior: "smooth" });
  });

  // Live search as the user types
  input.addEventListener("input", () => {
    state.searchQuery = input.value.trim().toLowerCase();
    renderDishGrid();
  });
}

/* =========================================================
   DISH CATALOG RENDERING
   ========================================================= */
function getFilteredDishes() {
  return DISH_DATA.filter((dish) => {
    const matchesCuisine = state.activeCuisine === "All" || dish.cuisine === state.activeCuisine;
    const matchesSearch =
      state.searchQuery === "" ||
      dish.name.toLowerCase().includes(state.searchQuery) ||
      dish.cuisine.toLowerCase().includes(state.searchQuery) ||
      dish.desc.toLowerCase().includes(state.searchQuery);
    return matchesCuisine && matchesSearch;
  });
}

function renderDishGrid() {
  const grid = document.getElementById("dishGrid");
  const emptyState = document.getElementById("dishEmptyState");
  const dishes = getFilteredDishes();

  if (dishes.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = dishes.map((dish) => buildDishCardHTML(dish)).join("");

  // Attach favorite button listeners
  grid.querySelectorAll(".dish-card__favorite").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dish = dishes.find((d) => String(d.id) === btn.dataset.id);
      toggleFavorite({
        name: dish.name,
        cuisine: dish.cuisine,
        desc: dish.desc,
        price: dish.price,
        calories: dish.calories,
        emoji: dish.emoji,
        type: dish.type,
      });
    });
  });
}

function buildDishCardHTML(dish) {
  const favActive = isFavorite(dish.name) ? "is-active" : "";
  const vegDotClass = dish.type === "veg" ? "veg-dot--veg" : "veg-dot--non-veg";

  return `
    <article class="dish-card">
      <button class="btn btn--icon dish-card__favorite ${favActive}" data-id="${dish.id}" aria-label="Toggle favorite">
        ${isFavorite(dish.name) ? "❤️" : "🤍"}
      </button>
      <div class="dish-card__top">
        <span class="dish-card__emoji">${dish.emoji}</span>
        <span class="dish-card__cuisine">${dish.cuisine}</span>
      </div>
      <h3 class="dish-card__name"><span class="veg-dot ${vegDotClass}"></span>${dish.name}</h3>
      <p class="dish-card__desc">${dish.desc}</p>
      <div class="dish-card__meta">
        <span>${dish.meal}</span>
        <span>${dish.calories} kcal</span>
        <span>spice ${dish.spice}/3</span>
      </div>
      <div class="dish-card__footer">
        <span class="dish-card__price">₹${dish.price}</span>
      </div>
    </article>
  `;
}

/* =========================================================
   FAVORITES SECTION
   ========================================================= */
function renderFavorites() {
  const grid = document.getElementById("favoritesGrid");
  const emptyState = document.getElementById("favoritesEmptyState");

  if (state.favorites.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = state.favorites
    .map(
      (dish) => `
      <article class="dish-card">
        <button class="btn btn--icon dish-card__favorite is-active" data-name="${dish.name}" aria-label="Remove favorite">❤️</button>
        <div class="dish-card__top">
          <span class="dish-card__emoji">${dish.emoji || "🍽️"}</span>
          <span class="dish-card__cuisine">${dish.cuisine || ""}</span>
        </div>
        <h3 class="dish-card__name">${dish.name}</h3>
        <p class="dish-card__desc">${dish.desc || ""}</p>
        <div class="dish-card__meta">
          ${dish.calories ? `<span>${dish.calories} kcal</span>` : ""}
        </div>
        <div class="dish-card__footer">
          <span class="dish-card__price">${dish.price ? "₹" + dish.price : ""}</span>
        </div>
      </article>`
    )
    .join("");

  grid.querySelectorAll(".dish-card__favorite").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dish = state.favorites.find((f) => f.name === btn.dataset.name);
      toggleFavorite(dish);
    });
  });
}

/* Keep heart icons in sync on already-rendered recommendation cards */
function renderExistingRecommendationHearts() {
  document.querySelectorAll(".rec-card__favorite").forEach((btn) => {
    const name = btn.dataset.name;
    btn.textContent = isFavorite(name) ? "❤️" : "🤍";
    btn.classList.toggle("is-active", isFavorite(name));
  });
}

/* =========================================================
   PREFERENCE FORM + RANGE LABELS
   ========================================================= */
function setupPreferenceForm() {
  const budgetInput = document.getElementById("budget");
  const budgetValue = document.getElementById("budgetValue");
  budgetInput.addEventListener("input", () => {
    budgetValue.textContent = budgetInput.value;
  });

  const spiceInput = document.getElementById("spiceLevel");
  const spiceValue = document.getElementById("spiceValue");
  const spiceLabels = ["Mild", "Low", "Medium", "High"];
  spiceInput.addEventListener("input", () => {
    spiceValue.textContent = spiceLabels[spiceInput.value];
  });

  const form = document.getElementById("preferenceForm");
  form.addEventListener("submit", handlePreferenceSubmit);
}

/* =========================================================
   HANDLE AI RECOMMENDATION REQUEST
   ========================================================= */
async function handlePreferenceSubmit(e) {
  e.preventDefault();

  const prefs = {
    dietType: document.getElementById("dietType").value,
    cuisine: document.getElementById("cuisine").value,
    budget: document.getElementById("budget").value,
    spiceLevel: document.getElementById("spiceLevel").value,
    mealType: document.getElementById("mealType").value,
    calories: document.getElementById("calories").value,
    allergies: document.getElementById("allergies").value.trim(),
    mood: document.getElementById("mood").value,
  };

  document.getElementById("recommendations").scrollIntoView({ behavior: "smooth" });
  showLoading();

  try {
    const recommendations = await window.getAIRecommendations(prefs);
    renderRecommendations(recommendations);
  } catch (err) {
    console.error(err);
    showError(err.message || "Something went wrong while generating recommendations.");
  }
}

function setupErrorRetry() {
  document.getElementById("errorRetryBtn").addEventListener("click", () => {
    document.getElementById("preferenceForm").requestSubmit();
  });
}

/* =========================================================
   UI STATE SWITCHING (loading / error / empty / results)
   ========================================================= */
function showLoading() {
  document.getElementById("loader").hidden = false;
  document.getElementById("errorState").hidden = true;
  document.getElementById("recsEmptyState").hidden = true;
  document.getElementById("recGrid").innerHTML = "";
}

function showError(message) {
  document.getElementById("loader").hidden = true;
  document.getElementById("errorState").hidden = false;
  document.getElementById("recsEmptyState").hidden = true;
  document.getElementById("errorMessage").textContent = message;
}

/* =========================================================
   RENDER AI RECOMMENDATION CARDS
   ========================================================= */
function renderRecommendations(recommendations) {
  document.getElementById("loader").hidden = true;
  document.getElementById("errorState").hidden = true;

  const grid = document.getElementById("recGrid");
  const emptyState = document.getElementById("recsEmptyState");

  if (!recommendations || recommendations.length === 0) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  grid.innerHTML = recommendations.map((rec, index) => buildRecCardHTML(rec, index)).join("");

  // Attach favorite listeners
  grid.querySelectorAll(".rec-card__favorite").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rec = recommendations[Number(btn.dataset.index)];
      toggleFavorite({
        name: rec.name,
        cuisine: rec.cuisine,
        desc: rec.description,
        price: rec.price,
        calories: rec.calories,
        emoji: "✨",
      });
      btn.textContent = isFavorite(rec.name) ? "❤️" : "🤍";
      btn.classList.toggle("is-active", isFavorite(rec.name));
    });
  });

  showToast("Your AI recommendations are ready!");
}

function buildRecCardHTML(rec, index) {
  const healthScore = clampScore(rec.healthScore);
  const circumference = 2 * Math.PI * 22; // radius = 22
  const offset = circumference - (healthScore / 10) * circumference;
  const favActive = isFavorite(rec.name) ? "is-active" : "";

  return `
    <article class="rec-card">
      <button class="btn btn--icon rec-card__favorite ${favActive}" data-index="${index}" data-name="${rec.name}" aria-label="Toggle favorite">
        ${isFavorite(rec.name) ? "❤️" : "🤍"}
      </button>
      <div class="rec-card__header">
        <div>
          <p class="rec-card__cuisine">${rec.cuisine || ""}</p>
          <h3 class="rec-card__name">${rec.name}</h3>
        </div>
      </div>
      <p class="rec-card__desc">${rec.description || ""}</p>
      <p class="rec-card__reason">"${rec.reason || "A great match for your preferences."}"</p>
      <div class="rec-card__stats">
        <div class="rec-card__price-cal">
          <strong>₹${rec.price ?? "—"}</strong>
          <span>${rec.calories ?? "—"} kcal</span>
        </div>
        <div class="health-score" title="Health Score: ${healthScore}/10">
          <svg viewBox="0 0 52 52">
            <defs>
              <linearGradient id="auroraGradient-${index}" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#6EE7B7" />
                <stop offset="50%" stop-color="#C084FC" />
                <stop offset="100%" stop-color="#F472B6" />
              </linearGradient>
            </defs>
            <circle class="track" cx="26" cy="26" r="22"></circle>
            <circle class="progress" cx="26" cy="26" r="22"
              style="stroke: url(#auroraGradient-${index})"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"></circle>
          </svg>
          <span class="health-score__value">${healthScore}</span>
        </div>
      </div>
    </article>
  `;
}

function clampScore(score) {
  const num = Number(score);
  if (isNaN(num)) return 5;
  return Math.min(10, Math.max(1, Math.round(num)));
}

/* =========================================================
   ABOUT AI MODAL
   -----------------------------------------------------------
   Gemini API access is handled securely by the server-side backend.
   This modal is just a short explainer, opened from the navbar.
   ========================================================= */
function setupAiInfoModal() {
  const modal = document.getElementById("aiInfoModal");
  const openBtn = document.getElementById("aiInfoBtn");
  const closeBtn = document.getElementById("modalCloseBtn");
  const backdrop = document.getElementById("modalBackdrop");
  const gotItBtn = document.getElementById("modalGotItBtn");

  const openModal = () => (modal.hidden = false);
  const closeModal = () => (modal.hidden = true);

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);
  gotItBtn.addEventListener("click", closeModal);
}

/* =========================================================
   TOAST NOTIFICATIONS
   ========================================================= */
let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}
