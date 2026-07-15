function restaurantById(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function requireCustomerSession() {
  const session = API.getSession();

  if (!session.key || !session.userId || !session.role) {
    window.location.replace("login.html");
    return null;
  }

  if (session.role.toLowerCase() !== "customer") {
    window.location.replace("login.html");
    return null;
  }

  return session;
}

function showRestaurantMessage(element, text) {
  if (!element) return;
  element.textContent = text;
  element.className = "message error";
}

function formatAddress(address = {}) {
  const firstLine = [address.streetNo, address.buildingName]
    .filter(Boolean)
    .join(", ");

  const secondLine = [address.area, address.city]
    .filter(Boolean)
    .join(", ");

  const thirdLine = [
    address.state,
    address.pincode ? `- ${address.pincode}` : ""
  ].filter(Boolean).join(" ");

  return [firstLine, secondLine, thirdLine, address.country]
    .filter(Boolean);
}

function contactValue(restaurant) {
  // The current API documentation spells this property "contactNunber".
  // Supporting both names makes the frontend survive a later backend typo fix.
  return restaurant.contactNunber ?? restaurant.contactNumber ?? "Not available";
}

async function logoutCustomer() {
  const session = API.getSession();
  const button = restaurantById("logoutButton");

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "Logging out...";
    }

    await API.logout(session.role, session.key);
  } catch (error) {
    console.error("Logout request failed:", error);
  } finally {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
}

const logoutButton = restaurantById("logoutButton");
if (logoutButton) logoutButton.addEventListener("click", logoutCustomer);

const navToggle = restaurantById("navToggle");
const navLinks = restaurantById("navLinks");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
}

const restaurantContainer = restaurantById("restaurantContainer");

if (restaurantContainer && requireCustomerSession()) {
  const searchInput = restaurantById("restaurantSearch");
  const loading = restaurantById("restaurantLoading");
  const empty = restaurantById("restaurantEmpty");
  const message = restaurantById("restaurantMessage");
  const count = restaurantById("restaurantCount");

  let restaurants = [];

  function renderRestaurants(list) {
    restaurantContainer.innerHTML = "";
    empty.classList.toggle("hidden", list.length !== 0);
    count.textContent = `${list.length} restaurant${list.length === 1 ? "" : "s"}`;

    list.forEach((restaurant) => {
      const address = restaurant.address || {};
      const card = document.createElement("article");
      card.className = "restaurant-card";

      card.innerHTML = `
        <div class="card-icon" aria-hidden="true">🍽️</div>
        <h3>${escapeHtml(restaurant.restaurantName || "Unnamed Restaurant")}</h3>
        <p><strong>Manager:</strong> ${escapeHtml(restaurant.managerName || "Not available")}</p>
        <p><strong>Location:</strong> ${escapeHtml(address.city || "Not available")}${address.state ? `, ${escapeHtml(address.state)}` : ""}</p>
        <p><strong>Contact:</strong> ${escapeHtml(contactValue(restaurant))}</p>
        <button class="btn btn-block view-restaurant-button" type="button">
          View Restaurant
        </button>
      `;

      card.querySelector(".view-restaurant-button").addEventListener("click", () => {
        // ID is kept internally. The customer never types it.
        sessionStorage.setItem("selectedRestaurantId", String(restaurant.restaurantId));
        window.location.href = "restaurant-details.html";
      });

      restaurantContainer.appendChild(card);
    });
  }

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = restaurants.filter((restaurant) => {
      const name = restaurant.restaurantName?.toLowerCase() || "";
      const city = restaurant.address?.city?.toLowerCase() || "";
      return name.includes(query) || city.includes(query);
    });

    renderRestaurants(filtered);
  });

  (async () => {
    try {
      restaurants = await API.getAllRestaurants();

      if (!Array.isArray(restaurants)) {
        throw new Error("Restaurant API did not return a list.");
      }

      renderRestaurants(restaurants);
    } catch (error) {
      showRestaurantMessage(message, error.message || "Unable to load restaurants.");
    } finally {
      loading.classList.add("hidden");
    }
  })();
}

const restaurantDetails = restaurantById("restaurantDetails");

if (restaurantDetails && requireCustomerSession()) {
  const loading = restaurantById("restaurantDetailsLoading");
  const message = restaurantById("restaurantDetailsMessage");
  const restaurantId = sessionStorage.getItem("selectedRestaurantId");

  if (!restaurantId) {
    loading.classList.add("hidden");
    showRestaurantMessage(
      message,
      "No restaurant was selected. Please return to the restaurant list."
    );
  } else {
    (async () => {
      try {
        const restaurant = await API.getRestaurant(restaurantId);

        restaurantById("restaurantName").textContent =
          restaurant.restaurantName || "Unnamed Restaurant";
        restaurantById("managerName").textContent =
          restaurant.managerName || "Not available";
        restaurantById("contactNumber").textContent =
          contactValue(restaurant);

        const addressLines = formatAddress(restaurant.address);
        const addressElement = restaurantById("restaurantAddress");
        addressElement.innerHTML = "";

        if (addressLines.length === 0) {
          addressElement.textContent = "Address not available";
        } else {
          addressLines.forEach((line) => {
            const div = document.createElement("div");
            div.textContent = line;
            addressElement.appendChild(div);
          });
        }

        restaurantById("browseFoodButton").addEventListener("click", () => {
          // Step 3 will use selectedRestaurantId while building the food flow.
          window.location.href = "menu.html";
        });

        restaurantDetails.classList.remove("hidden");
      } catch (error) {
        showRestaurantMessage(
          message,
          error.message || "Unable to load restaurant details."
        );
      } finally {
        loading.classList.add("hidden");
      }
    })();
  }
}
