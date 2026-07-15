# Foodie Frontend — Final Build

Plain HTML, CSS, and JavaScript frontend for the Spring Boot online food ordering backend.

## Run

1. Start the Spring Boot backend.
2. Open `js/api.js`.
3. Confirm `BASE_URL` matches the backend URL. The current value is:
   `http://localhost:8088`
4. Serve this frontend through a local HTTP server. Do not rely on opening HTML files with `file://`.

Examples:
- VS Code Live Server
- `python -m http.server 5500`

Then open the frontend URL shown by the local server.

## Backend requirement: login response

`POST /app/login` must return JSON containing:
- generated session key: `key` or `privateKey`
- logged-in user ID: `userId`, `customerId`, `adminId`, or `id`
- role is recommended; if absent, the selected login role is used

Example customer response:

    {
      "message": "Login successful",
      "key": "ABC123",
      "userId": 12,
      "role": "customer"
    }

Example admin response:

    {
      "message": "Login successful",
      "key": "XYZ789",
      "userId": 1,
      "role": "admin"
    }

The frontend stores these values in sessionStorage and passes IDs/keys internally.
There are no ID input fields in customer or admin forms.

## Customer pages

- `index.html` — landing page
- `register.html` — customer registration
- `login.html` — customer/admin login
- `restaurants.html` — restaurant browsing
- `restaurant-details.html` — selected restaurant
- `menu.html` — food browsing and add to cart
- `cart.html` — cart management
- `checkout.html` — place order and generate bill
- `order-confirmation.html` — order/bill confirmation
- `order-history.html` — customer order history
- `order-details.html` — full historical order details

## Admin pages

- `admin/dashboard.html`
- `admin/restaurants.html`
- `admin/categories.html`
- `admin/items.html`
- `admin/orders.html`

Admin pages require an admin session and redirect unauthorized users to login.

## Important backend spelling

The documented food item DTO uses `catergoryId` rather than `categoryId`.
The frontend intentionally sends `catergoryId` for item create/update/delete operations.

The documented restaurant DTO uses `contactNunber`.
The frontend intentionally preserves that backend field spelling.

## CORS

If the browser reports a CORS error, configure Spring Boot to allow the frontend origin.
For example, if Live Server runs on port 5500, allow `http://127.0.0.1:5500` and/or
`http://localhost:5500` as appropriate.

## Final architecture

Customer:
Register -> Login -> Restaurants -> Menu -> Cart -> Checkout -> Order -> Bill -> History

Admin:
Login -> Dashboard -> Restaurant CRUD -> Category CRUD -> Food Item CRUD -> Order Management

Generated database IDs are never requested from users. Existing IDs returned by the backend
are retained internally only when an update, delete, detail, cart, order, or history endpoint needs them.
