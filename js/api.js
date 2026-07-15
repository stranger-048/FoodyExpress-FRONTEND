const API = (() => {
  // Change this once to match the Spring Boot server.
  const BASE_URL = "http://localhost:8088";

  function getSession() {
    return {
      key: sessionStorage.getItem("key"),
      userId: sessionStorage.getItem("userId"),
      role: sessionStorage.getItem("role")
    };
  }

  async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });

    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (response.status !== 204) {
      data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    }

    if (!response.ok) {
      let message;
      if (typeof data === "string" && data.trim()) {
        message = data;
      } else if (data?.message) {
        message = data.message;
      } else if (data && typeof data === "object") {
        const validationMessages = Object.values(data)
          .filter(value => typeof value === "string")
          .join(" ");
        message = validationMessages || `Request failed with status ${response.status}`;
      } else {
        message = `Request failed with status ${response.status}`;
      }
      throw new Error(message);
    }

    return data;
  }

  return {
    BASE_URL,
    getSession,
    request,

    registerCustomer(customer) {
      return request("/customers/add", {
        method: "POST",
        body: JSON.stringify(customer)
      });
    },

    login(credentials) {
      return request("/app/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
    },

    logout(role, key) {
      const params = new URLSearchParams({ role, key });
      return request(`/app/logout?${params.toString()}`, {
        method: "POST"
      });
    },

    getAllRestaurants() {
      const { key } = getSession();
      const params = new URLSearchParams({ key });
      return request(`/restaurants/view?${params.toString()}`);
    },

    getRestaurant(restaurantId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key });
      return request(
        `/restaurants/view/${encodeURIComponent(restaurantId)}?${params.toString()}`
      );
    },

    getAllItems() {
      const { key } = getSession();
      return request(`/items/all?${new URLSearchParams({ key }).toString()}`);
    },

    getItemsByCategory(categoryName) {
      const { key } = getSession();
      return request(
        `/items/get/${encodeURIComponent(categoryName)}?${new URLSearchParams({ key }).toString()}`
      );
    },

    addItemToCart(itemId) {
      const { key, userId } = getSession();
      const params = new URLSearchParams({ key, itemId });
      return request(
        `/foodcart/addtocart/${encodeURIComponent(userId)}?${params.toString()}`,
        { method: "POST" }
      );
    },

    increaseCartQuantity(cartId, quantity, itemId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, cartId, quantity, itemId });
      return request(`/foodcart/increaseQuantity?${params.toString()}`, { method: "PUT" });
    },

    decreaseCartQuantity(cartId, quantity, itemId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, cartId, quantity, itemId });
      return request(`/foodcart/decreaseQuantity?${params.toString()}`, { method: "PUT" });
    },

    removeCartItem(cartId, itemId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, cartId, itemId });
      return request(`/foodcart/item?${params.toString()}`, { method: "DELETE" });
    },

    clearCart(cartId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, cartId });
      return request(`/foodcart/delete?${params.toString()}`, { method: "DELETE" });
    },

    placeOrder() {
      const { key, userId } = getSession();
      const params = new URLSearchParams({ key });
      return request(
        `/order/add/${encodeURIComponent(userId)}?${params.toString()}`,
        { method: "POST" }
      );
    },

    generateBill(orderId) {
      const { key, userId } = getSession();
      const params = new URLSearchParams({
        key,
        customerId: userId,
        orderId
      });
      return request(`/bill/add?${params.toString()}`, { method: "POST" });
    },

    getCustomerOrderHistory() {
      const { key, userId } = getSession();
      const params = new URLSearchParams({ key, customerId: userId });
      return request(`/order-history/customer-id?${params.toString()}`);
    },

    getOrderHistoryById(orderHistoryId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, orderHisId: orderHistoryId });
      return request(`/order-history/get?${params.toString()}`);
    },

    getAllOrderHistory() {
      const { key } = getSession();
      return request(`/order-history/all?${new URLSearchParams({ key }).toString()}`);
    },

    getOrderById(orderId) {
      const { key } = getSession();
      return request(`/order/view/${encodeURIComponent(orderId)}?${new URLSearchParams({ key }).toString()}`);
    },

    updateOrder(orderId, customerId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, orderId, customerId });
      return request(`/order/update?${params.toString()}`, { method: "PUT" });
    },

    removeOrder(orderId) {
      const { key } = getSession();
      return request(`/order/remove/${encodeURIComponent(orderId)}?${new URLSearchParams({ key }).toString()}`, {
        method: "DELETE"
      });
    },

    getAllCategories() {
      const { key } = getSession();
      return request(`/category/viewall?${new URLSearchParams({ key }).toString()}`);
    },

    addCategory(categoryName) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, categoryName });
      return request(`/category/add?${params.toString()}`, { method: "POST" });
    },

    updateCategory(category) {
      const { key } = getSession();
      return request(`/category/update?${new URLSearchParams({ key }).toString()}`, {
        method: "PUT",
        body: JSON.stringify(category)
      });
    },

    removeCategory(categoryName) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, categoryName });
      return request(`/category/remove?${params.toString()}`, { method: "DELETE" });
    },

    addItem(item) {
      const { key } = getSession();
      return request(`/items/add?${new URLSearchParams({ key }).toString()}`, {
        method: "POST",
        body: JSON.stringify(item)
      });
    },

    updateItem(item) {
      const { key } = getSession();
      return request(`/items/update?${new URLSearchParams({ key }).toString()}`, {
        method: "PUT",
        body: JSON.stringify(item)
      });
    },

    deleteItem(item) {
      const { key } = getSession();
      return request(`/items/delete?${new URLSearchParams({ key }).toString()}`, {
        method: "DELETE",
        body: JSON.stringify(item)
      });
    },

    addRestaurant(restaurant) {
      const { key } = getSession();
      return request(`/restaurants/add?${new URLSearchParams({ key }).toString()}`, {
        method: "POST",
        body: JSON.stringify(restaurant)
      });
    },

    updateRestaurant(restaurant) {
      const { key } = getSession();
      return request(`/restaurants/update?${new URLSearchParams({ key }).toString()}`, {
        method: "PUT",
        body: JSON.stringify(restaurant)
      });
    },

    deleteRestaurant(restaurantId) {
      const { key } = getSession();
      const params = new URLSearchParams({ key, restaurantId });
      return request(`/restaurants/delete?${params.toString()}`, { method: "DELETE" });
    }
  };
})();
