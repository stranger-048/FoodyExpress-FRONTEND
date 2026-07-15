const $ = (id) => document.getElementById(id);

function requireCustomer() {
  const session = API.getSession();
  if (!session.key || !session.userId || session.role?.toLowerCase() !== "customer") {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

function escapeCart(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR"
  }).format(amount);
}

function loadStoredCart() {
  try { return JSON.parse(sessionStorage.getItem("currentCart") || "null"); }
  catch { return null; }
}

function saveCart(cart) {
  currentCart = cart && typeof cart === "object" ? cart : { itemList: [] };
  sessionStorage.setItem("currentCart", JSON.stringify(currentCart));
  sessionStorage.setItem("cartItemCount", String(currentCart.itemList?.length || 0));
}

let toastTimer;
function toast(text, type = "success") {
  const element = $("cartToast");
  clearTimeout(toastTimer);
  element.textContent = text;
  element.className = `toast ${type}`;
  toastTimer = setTimeout(() => element.classList.add("hidden"), 2600);
}

async function logout() {
  const session = API.getSession();
  try { await API.logout(session.role, session.key); }
  catch (error) { console.error(error); }
  finally {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
}

const navToggle = $("navToggle");
if (navToggle) navToggle.onclick = () => $("navLinks").classList.toggle("open");
$("logoutButton").onclick = logout;

let currentCart = loadStoredCart();

function renderCart() {
  const items = Array.isArray(currentCart?.itemList) ? currentCart.itemList : [];
  const empty = items.length === 0;

  $("cartEmpty").classList.toggle("hidden", !empty);
  $("cartLayout").classList.toggle("hidden", empty);
  $("cartBadge").textContent = items.length;
  $("cartBadge").classList.toggle("hidden", empty);

  if (empty) return;

  $("cartItems").innerHTML = "";
  let subtotal = 0;
  let totalQuantity = 0;

  items.forEach((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const cost = Number(item.cost) || 0;
    subtotal += cost * quantity;
    totalQuantity += quantity;

    const row = document.createElement("article");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="cart-item-icon" aria-hidden="true">🍲</div>
      <div class="cart-item-info">
        <span class="category-pill">${escapeCart(item.category?.categoryName || "Food")}</span>
        <h2>${escapeCart(item.itemName || "Unnamed Item")}</h2>
        <p>${money(cost)} each</p>
        <button class="remove-item" type="button">Remove</button>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-control" aria-label="Quantity controls">
          <button class="decrease-button" type="button" aria-label="Decrease quantity">−</button>
          <strong>${quantity}</strong>
          <button class="increase-button" type="button" aria-label="Increase quantity">+</button>
        </div>
        <strong class="line-total">${money(cost * quantity)}</strong>
      </div>
    `;

    async function mutate(action, requestedQuantity) {
      const buttons = row.querySelectorAll("button");
      buttons.forEach(button => button.disabled = true);
      try {
        const cart = await action(currentCart.cartId, requestedQuantity, item.itemId);
        saveCart(cart);
        renderCart();
      } catch (error) {
        toast(error.message || "Unable to update cart.", "error");
        buttons.forEach(button => button.disabled = false);
      }
    }

    row.querySelector(".increase-button").onclick =
      () => mutate(API.increaseCartQuantity, quantity + 1);

    row.querySelector(".decrease-button").onclick = () => {
      if (quantity <= 1) return removeItem(item);
      mutate(API.decreaseCartQuantity, quantity - 1);
    };

    row.querySelector(".remove-item").onclick = () => removeItem(item);
    $("cartItems").appendChild(row);
  });

  $("summaryItems").textContent = totalQuantity;
  $("summaryTotal").textContent = money(subtotal);
}

async function removeItem(item) {
  try {
    const cart = await API.removeCartItem(currentCart.cartId, item.itemId);
    saveCart(cart);
    renderCart();
    toast(`${item.itemName || "Item"} removed.`);
  } catch (error) {
    toast(error.message || "Unable to remove item.", "error");
  }
}

$("clearCartButton").onclick = async () => {
  if (!currentCart?.cartId) return;
  try {
    const result = await API.clearCart(currentCart.cartId);
    saveCart(result && typeof result === "object" ? result : { itemList: [] });
    renderCart();
    toast("Cart cleared.");
  } catch (error) {
    toast(error.message || "Unable to clear cart.", "error");
  }
};

$("checkoutButton").onclick = () => {
  window.location.href = "checkout.html";
};

if (requireCustomer()) {
  if (!currentCart) {
    $("cartMessage").textContent =
      "No cart data is available in this browser session yet. Add an item from the Food page first.";
    $("cartMessage").className = "message error";
    currentCart = { itemList: [] };
  }
  renderCart();
}
