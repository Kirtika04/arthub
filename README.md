# ArtHub

ArtHub is a full-stack, multi-vendor marketplace for art materials. Buyers can browse products, maintain a cart and wishlist, place orders, pay online or choose cash on delivery, and manage post-purchase returns and reviews. Sellers can publish and manage their catalogue, while administrators can manage marketplace data and approve pending orders.

## Technology stack

- Frontend: React 18, React Router, Axios, Bootstrap, Vite
- Backend: Node.js, Express, JWT authentication
- Database: MySQL 8 with `mysql2`
- Payments: Razorpay Checkout and Cash on Delivery
- Uploads: Multer and local file storage

## Features

### Buyers

- Account registration and JWT login
- Product catalogue, details, cart, and wishlist
- Saved shipping addresses
- Online checkout through Razorpay
- Cash on delivery
- Order history and order details
- Order progress, shipment, courier, and tracking-number details
- Return requests for delivered items
- Refund status tracking
- Verified-purchase ratings and reviews

### Sellers

- Seller registration
- Product creation with inventory and images
- Catalogue and stock overview
- Seller approval requirement before listing products
- Seller-specific navigation with product creation hidden until approval

### Administrators

- Marketplace statistics
- User, seller, and category management
- Pending-order listing and approval
- Seller approval and revocation
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

Clone the repository (or extract the project archive), then install both applications:

```bash
git clone https://github.com/YOUR_USERNAME/arthub.git
cd arthub/backend
npm install

cd ../frontend
npm install
```

If you downloaded and extracted the ZIP archive instead, skip the `git clone` command
and run the remaining commands from the extracted `arthub` directory.

## Database setup

Create the schema and optionally load the sample catalogue:

```bash
mysql -u root -p < database/arthub.sql
mysql -u root -p arthub < database/seed_catalogue.sql
```

Run these commands from the project root. The main schema creates and selects a database named `arthub`.

> Note: the sample administrator in `arthub.sql` uses a placeholder password hash and cannot be used for a real login. Create an administrator with a valid bcrypt password hash before testing admin-only features. Never use sample credentials in production.

## Backend configuration

Create `backend/.env` with the following values:

```dotenv
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=arthub

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
```

Keep `.env` private. Do not commit database passwords, JWT secrets, or Razorpay secrets.
You may copy these placeholder settings into `backend/.env.example` for documentation,
but never place real credentials in that file.Replace these credentials with your own.

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

Open `http://localhost:3000`. Vite proxies both `/api` and `/uploads` requests to the backend at `http://localhost:5000`.

In development, Vite forwards `/api` and `/uploads` to the backend. The current API
client sends requests to `/api/v1`, so a production deployment should serve the
frontend and API through the same origin and configure the web server to proxy
`/api` and `/uploads` to the backend.

`VITE_BACKEND_URL` currently controls uploaded-image URLs only. Set it when images
are served from a different origin:

```dotenv
VITE_BACKEND_URL=https://api.example.com
```

Setting this variable alone does not change the API request URL. To host the API on
a different origin, also update `frontend/src/services/api.js` to build its
`baseURL` from `VITE_BACKEND_URL`, and configure CORS appropriately on the backend.

If `nodemon` is unavailable, use `npm start` in `backend`.

## Production frontend build

```bash
cd frontend
npm run build
```

The generated static application is written to `frontend/dist`.

## Checkout flow

1. A buyer adds a stocked catalogue item to the cart.
2. The buyer chooses or creates a shipping address.
3. The buyer selects **Pay online** or **Cash on delivery**.
4. Online payment opens Razorpay Checkout and confirms the order after server-side signature verification.
5. Cash on delivery records COD as the payment method and confirms the order immediately.

Only products linked to an inventory row can be checked out. Preview-only products without an `inventory_id` remain available for display but cannot be ordered.

## Returns, refunds, and reviews

- Return and review actions appear on delivered order items.
- A buyer may have only one active return request per order item.
- Return and refund statuses are shown in the order details.
- Reviews require a delivered purchase and support ratings from 1 to 5.
- Submitting another review for the same product updates the buyer's existing review.

## Main API groups

All endpoints use the `/api/v1` prefix.

| Group | Path | Purpose |
|---|---|---|
| Authentication | `/auth` | Register, login, and current user |
| Products | `/products` | Catalogue, product details, and reviews |
| Cart | `/cart` | Buyer cart management |
| Wishlist | `/wishlist` | Buyer wishlist management |
| Orders | `/orders` | Checkout, history, details, and returns |
| Payments | `/payments` | Razorpay, verification, and COD |
| Users | `/users` | Profiles and saved addresses |
| Sellers | `/seller` | Seller catalogue management |
| Administration | `/admin` | Stats, users, sellers, categories, and orders |

Protected routes require an authorization header:

```http
Authorization: Bearer <jwt-token>
```

## Troubleshooting

- **Blank page after ordering:** rebuild the frontend and ensure the current `OrderDetails` bundle is being served.
- **New API returns 404:** restart the backend so newly added routes are loaded.
- **Database connection fails:** verify MySQL is running and confirm all `DB_*` values.
- **Online checkout does not open:** verify internet access and Razorpay test credentials.
- **Product cannot be checked out:** load the catalogue seed or ensure the product has inventory and positive stock.
- **COD or payment action is missing:** the order may already be paid, have COD selected, or no longer be eligible for payment.

## Security notes

- Use long, unique secrets outside development.
- Add `.env`, `node_modules`, generated builds, logs, and uploaded files to the root `.gitignore` before committing the project.
- Never commit `backend/.env`; commit only a placeholder `.env.example` if needed.
- Use Razorpay test credentials during development.
- Serve the production application through HTTPS.
- Store uploaded assets in managed object storage for production deployments.
- Validate and back up the database before applying schema changes.
