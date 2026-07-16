
const container = document.getElementById("restaurantContainer");

async function loadRestaurants() {
  try {
    const response = await fetch(
      "http://localhost:8088/restaurants/view",
    );

    if (!response.ok) {
      throw new Error("Failed to fetch restaurants");
    }

    const restaurants = await response.json();

    container.innerHTML = "";

    restaurants.forEach((r) => {
      container.innerHTML += `
                <article class="restaurant-card">
                    <div class="card-icon">🍽️</div>
                    <h3>${r.restaurantName}</h3>
                    <p><strong>Manager:</strong> ${r.managerName}</p>
                    <p><strong>Location:</strong> ${r.address.area}</p>
                    <p><strong>Contact:</strong> ${r.contactNunber}</p>
                    <a class="btn btn-block" href="restaurant.html?id=${r.id}">
                        View Restaurant
                    </a>
                </article>
            `;
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Unable to load restaurants.</p>";
  }
}

loadRestaurants();
