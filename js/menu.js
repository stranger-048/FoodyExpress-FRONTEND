const $ = (id) => document.getElementById(id);

function requireCustomer() {
  const session = API.getSession();
  if (!session.key || !session.userId || session.role?.toLowerCase() !== "customer") {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

function escapeFood(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)
    : "Price unavailable";
}

function updateCartBadge(cart) {
  const badge = $("cartBadge");
  const count = Array.isArray(cart?.itemList) ? cart.itemList.length : 0;
  if (cart && typeof cart === "object") {
    sessionStorage.setItem("currentCart", JSON.stringify(cart));
  }
  sessionStorage.setItem("cartItemCount", String(count));
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
}

function restoreCartBadge() {
  const badge = $("cartBadge");
  const count = Number(sessionStorage.getItem("cartItemCount") || 0);
  if (badge && count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  }
}

let toastTimer;
function toast(text, type = "success") {
  const element = $("cartToast");
  clearTimeout(toastTimer);
  element.textContent = text;
  element.className = `toast ${type}`;
  toastTimer = setTimeout(() => element.classList.add("hidden"), 2800);
}

async function logout() {
  const session = API.getSession();
  try {
    await API.logout(session.role, session.key);
  } catch (error) {
    console.error(error);
  } finally {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
}

const navToggle = $("navToggle");
const navLinks = $("navLinks");
if (navToggle && navLinks) navToggle.onclick = () => navLinks.classList.toggle("open");
if ($("logoutButton")) $("logoutButton").onclick = logout;

if (requireCustomer()) {
  restoreCartBadge();

  const selectedRestaurantId = sessionStorage.getItem("selectedRestaurantId");
  if (selectedRestaurantId) {
    $("menuContext").textContent =
      "Browse available food items. Your selected restaurant is remembered internally while you continue ordering.";
  }

  let allItems = [];

  function render() {
    const query = $("itemSearch").value.trim().toLowerCase();
    const category = $("categoryFilter").value;

    const items = allItems.filter((item) => {
      const matchesName = (item.itemName || "").toLowerCase().includes(query);
      const matchesCategory = !category || item.category?.categoryName === category;
      return matchesName && matchesCategory;
    });

    $("itemContainer").innerHTML = "";
    $("menuEmpty").classList.toggle("hidden", items.length !== 0);

    items.forEach((item) => {
      const card = document.createElement("article");
      card.className = "food-card";
      const stock = Number(item.quantity);
      const unavailable = Number.isFinite(stock) && stock <= 0;

      card.innerHTML = `
        <div class="food-card-top">
          <span class="food-icon" aria-hidden="true">🍲</span>
          <span class="category-pill">${escapeFood(item.category?.categoryName || "Uncategorized")}</span>
        </div>
        <h2>${escapeFood(item.itemName || "Unnamed Item")}</h2>
        <p class="food-price">${money(item.cost)}</p>
        <p class="stock-text">${unavailable ? "Currently unavailable" : "Available to order"}</p>
        <button class="btn btn-block add-cart-button" type="button" ${unavailable ? "disabled" : ""}>
          ${unavailable ? "Unavailable" : "Add to Cart"}
        </button>
      `;

      const button = card.querySelector(".add-cart-button");
      if (!unavailable) {
        button.onclick = async () => {
          const normal = button.textContent;
          try {
            button.disabled = true;
            button.textContent = "Adding...";
            const cart = await API.addItemToCart(item.itemId);
            updateCartBadge(cart);
            toast(`${item.itemName || "Item"} added to cart.`);
            button.textContent = "Added ✓";
            setTimeout(() => {
              button.disabled = false;
              button.textContent = normal;
            }, 800);
          } catch (error) {
            toast(error.message || "Unable to add item to cart.", "error");
            button.disabled = false;
            button.textContent = normal;
          }
        };
      }

      $("itemContainer").appendChild(card);
    });
  }

  (async () => {
    try {
      allItems = await API.getAllItems();
      if (!Array.isArray(allItems)) throw new Error("Item API did not return a list.");

      const categories = [...new Set(
        allItems.map(item => item.category?.categoryName).filter(Boolean)
      )].sort();

      categories.forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        $("categoryFilter").appendChild(option);
      });

      render();
    } catch (error) {
      $("menuMessage").textContent = error.message || "Unable to load food items.";
      $("menuMessage").className = "message error";
    } finally {
      $("menuLoading").classList.add("hidden");
    }
  })();

  $("itemSearch").addEventListener("input", render);
  $("categoryFilter").addEventListener("change", render);
}
