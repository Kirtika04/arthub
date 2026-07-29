# ArtHub

ArtHub is a full-stack, multi-vendor marketplace for art materials. Buyers can browse products, maintain a cart and wishlist, place orders, pay online or choose cash on delivery, and manage post-purchase returns and reviews. Sellers can publish and manage their catalogue, while administrators can manage marketplace data and approve sellers and pending orders.

## Technology stack

- Frontend: React 18, React Router, Axios, Bootstrap, and Vite
- Backend: Node.js, Express, and JWT authentication
- Database: MySQL 8 with `mysql2`
- Payments: Razorpay Checkout and Cash on Delivery
- Uploads: Multer and local file storage

## Features

### Buyers

- Account registration and JWT login
- Product catalogue, product details, cart, and wishlist
- Saved shipping addresses
- Online checkout through Razorpay or Cash on Delivery
- Order history, order details, shipment tracking, and return requests
- Refund status tracking
- Verified-purchase ratings and reviews

### Sellers

- Seller registration and administrator approval
- Product creation with inventory and up to five images
- Catalogue and stock overview
- Product deletion

### Administrators

- Marketplace statistics
- User, seller, category, and order management
- Seller approval and revocation
- Pending-order approval
- Category creation and removal when no products use the category

## Project structure

```text
arthub/
├── backend/                 Express API
│   ├── config/              Database and Razorpay configuration
│   ├── controllers/         Request handlers
│   ├── middlewares/         Authentication, roles, errors, and uploads
│   ├── models/              Database models
│   ├── routes/              API routes
│   ├── services/            Backend services
│   ├── uploads/             Uploaded product images
│   └── server.js            API entry point
├── database/
│   ├── arthub.sql           Database schema and initial records
│   └── seed_catalogue.sql   Optional catalogue data
└── frontend/                React application
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   └── services/
    └── vite.config.js
```

## Prerequisites

- Node.js 18 or newer
- npm
- MySQL 8 or newer
- A Razorpay test account for online-payment testing

## Installation

Clone the repository, then install the backend and frontend dependencies:

```bash
git clone <repository-url>
cd arthub/backend
npm install

cd ../frontend
npm install
```

## Database setup

From the project root, create the schema and optionally load the sample catalogue:

```bash
mysql -u root -p < database/arthub.sql
mysql -u root -p arthub < database/seed_catalogue.sql
```

The main schema creates and selects a database named `arthub`.

> The sample administrator in `arthub.sql` uses a placeholder password hash and cannot log in. Replace it with a valid bcrypt hash before testing administrator-only features. Never use sample credentials in production.

## Backend configuration

Create `backend/.env`:

```dotenv
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=arthub

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Keep `.env` private. Do not commit database passwords, JWT secrets, or Razorpay secrets.

## Running locally

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000`. During development, Vite proxies `/api` and `/uploads` requests to the backend at `http://localhost:5000`.

If `nodemon` is unavailable, run `npm start` in `backend`.

## Production frontend build

```bash
cd frontend
npm run build
```

The generated static application is written to `frontend/dist`. The frontend sends API requests to `/api/v1` and loads uploaded images from `/uploads`, so a production web server should proxy both paths to the Express backend.

## Checkout flow

1. A buyer adds a stocked catalogue item to the cart.
2. The buyer chooses or creates a shipping address.
3. The buyer selects online payment or Cash on Delivery.
4. Razorpay payments are confirmed after server-side signature verification.
5. Cash on Delivery records COD as the payment method.

Only products linked to an inventory row can be checked out. Preview-only products without an `inventory_id` remain visible but cannot be ordered.

## Main API groups

All API endpoints use the `/api/v1` prefix.

| Group | Path | Purpose |
|---|---|---|
| Authentication | `/auth` | Registration, login, and current user |
| Products | `/products` | Catalogue, product details, categories, and reviews |
| Cart | `/cart` | Buyer cart management |
| Wishlist | `/wishlist` | Buyer wishlist management |
| Orders | `/orders` | Checkout, history, details, and returns |
| Payments | `/payments` | Razorpay creation and verification, and COD |
| Users | `/users` | Profiles and saved addresses |
| Sellers | `/seller` | Seller catalogue management |
| Administration | `/admin` | Statistics, users, sellers, categories, and orders |

Protected routes require an authorization header:

```http
Authorization: Bearer <jwt-token>
```

## Troubleshooting

- **Database connection fails:** Confirm MySQL is running and check the `DB_*` values in `backend/.env`.
- **API request returns 404:** Confirm the backend is running on port `5000` and restart it after adding routes.
- **Online checkout does not open:** Check internet access and the Razorpay test credentials.
- **Product cannot be checked out:** Load the catalogue seed or ensure the product has inventory with positive stock.
- **Uploaded images do not load in production:** Proxy `/uploads` to the backend and make sure the upload directory is available.

## Security notes

- Use long, unique secrets outside development.
- Use Razorpay test credentials during development.
- Serve production traffic over HTTPS.
- Use managed object storage for uploaded assets in production.
- Validate and back up the database before applying schema changes.

