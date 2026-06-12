# Raith Sethu — Application Flow & Documentation

---

## 1. Overview

**Raith Sethu** is a full-stack Farmer-to-Customer (F2C) platform that lets farmers post their crops, buyers purchase them with real online payment, and tracks the entire order lifecycle from listing to delivery.

```
Farmer posts crop → Buyer browses & pays → Order created in Firebase
     ↓                                              ↓
Farmer sees order in dashboard          Buyer tracks order status
     ↓
Farmer updates status (confirmed → in-transit → delivered)
     ↓
Buyer rates the farmer
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Routing | React Router DOM v7 |
| Database | Firebase Realtime Database |
| Authentication | Firebase Auth |
| Payment | Razorpay (test mode) |
| Backend API | Express.js (Node) on port 5000 |
| Icons | Lucide React |
| Charts | Recharts |

**Run the project:**
```bash
npm run dev:fullstack   # starts both Vite (5173) + Express (5000)
```

---

## 3. User Roles

| Role | Lands on | What they can do |
|---|---|---|
| `farmer` | `/farmer-dashboard` | Post crops, manage listings, view incoming orders, track revenue |
| `buyer` | `/buyer-dashboard` | Browse crops, buy with Razorpay, track their orders, join group buys |
| `customer` | `/customer-dashboard` | Similar to buyer |
| `admin` | `/admin` | Manage all users, listings, orders, verify users, resolve disputes |

Role is stored in Firebase under `users/{uid}/role` and set at registration.

---

## 4. Authentication Flow

```
User visits / → HomeRoute checks auth
  ├── Not logged in → show Home page with "Get Started" → /login
  └── Logged in → redirect to role-specific dashboard

/login → Firebase Auth (email + password)
  → On success: user profile fetched from Firebase users/{uid}
  → role read → getDashboardPath(role) called
  → redirected to correct dashboard
```

**Route protection:**
- `ProtectedRoute` — any logged-in user
- `RoleProtectedRoute(['farmer'])` — only farmers; others redirected to their own dashboard
- `RoleProtectedRoute(['buyer'])` — only buyers
- `RoleProtectedRoute(['admin'])` — only admin

---

## 5. Farmer Flow (End-to-End)

### Step 1 — Login
- Farmer logs in → lands on `/farmer-dashboard`
- Dashboard fetches:
  - `getUserListings(uid)` — all listings where `userId === uid`
  - `getFarmerOrders(uid)` — all orders where `farmerId === uid`

### Step 2 — Post a Crop
- Farmer goes to `/marketplace` → clicks "Post New Crop"
- Fills form: crop name, variety, quantity, unit, price, quality, harvest date, location
- On submit → `createListing(uid, data)` → saved to Firebase `listings/` node with `status: 'active'`

**Listing data structure:**
```json
{
  "id": "-NxABC123",
  "userId": "farmerUid",
  "crop": "Tomato",
  "variety": "Cherry",
  "quantity": 500,
  "unit": "kg",
  "price": 40,
  "quality": "Grade A",
  "harvestDate": "2026-05-20",
  "location": "Tumkur, Karnataka",
  "status": "active",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

### Step 3 — Manage Listings
- In Marketplace → "My Listings" tab → farmer sees all their own listings
- Can edit price, quantity, or mark as sold/inactive
- `updateListing(listingId, { status: 'inactive' })` removes it from buyer's browse view

### Step 4 — Receive an Order
- When a buyer purchases, an order is created in Firebase `orders/` with `farmerId` set
- `getFarmerOrders(uid)` query (indexed by `farmerId`) streams this in real-time
- Farmer sees it immediately in Farmer Dashboard → "Recent Incoming Orders" table
- Also visible in Marketplace → "Incoming Orders" tab

### Step 5 — Update Order Status
- Farmer clicks status buttons: Confirm → In Transit → Delivered
- `updateOrderStatus(orderId, status)` updates Firebase
- Buyer sees the updated status in real-time in their dashboard

### Step 6 — Track Revenue
- Farmer Dashboard stats card shows:
  - Total Revenue = sum of `totalAmount` across all orders
  - Pending Orders = orders with `status === 'pending'`
  - Delivered = orders with `status === 'delivered'` or `'completed'`

---

## 6. Buyer Flow (End-to-End)

### Step 1 — Login
- Buyer logs in → lands on `/buyer-dashboard`
- Sees stats: total orders, total spend, group buying opportunities, avg farmer rating

### Step 2 — Browse Crops
- Clicks "Browse & Buy Crops" button → goes to `/marketplace`
- `getListings()` fetches ALL listings from Firebase; filtered client-side to `status === 'active'`
- Can search by crop name, filter by quality, sort by price

### Step 3 — Buy a Crop (Razorpay Payment)

```
Buyer clicks "Buy Now" on a listing
  → Quantity selector modal opens
  → Buyer sets quantity → price breakdown shown
  → Buyer clicks "Pay ₹X"
  → Razorpay checkout opens
```

**Payment sequence:**

```
1. loadRazorpayCheckout()          — injects Razorpay script tag
2. createRazorpayOrder({ amount }) — POST /api/razorpay-create-order
                                     → Express calls Razorpay API with Key + Secret
                                     → returns { order_id, amount, currency }
3. new window.Razorpay(options)    — opens checkout UI with payment methods
4. User pays (UPI / card / netbanking)
5. handler(response) fires         — razorpay_payment_id received
6. verifyRazorpayPayment(...)      — POST /api/razorpay-verify-payment
                                     → Express verifies HMAC signature
7. createOrder(orderData)          — saved to Firebase orders/
8. updateListing(listingId, ...)   — quantity reduced; if 0 → status = 'sold'
9. Success screen shown            — Order ID + Payment ID displayed
```

**Order data structure saved to Firebase:**
```json
{
  "id": "-NxORD456",
  "buyerId": "buyerUid",
  "buyerName": "Ravi Kumar",
  "buyerPhone": "9876543210",
  "farmerId": "farmerUid",
  "farmerName": "Shiva Reddy",
  "crop": "Tomato",
  "variety": "Cherry",
  "quantity": 50,
  "unit": "kg",
  "pricePerUnit": 40,
  "totalAmount": 2000,
  "quality": "Grade A",
  "paymentId": "pay_NxPAY789",
  "orderDate": 1747224000000,
  "status": "pending",
  "createdAt": "2026-05-14T10:00:00.000Z"
}
```

### Step 4 — Track Order
- Buyer goes to `/buyer-dashboard` → "My Orders" tab
- `getUserOrders(uid)` query (indexed by `buyerId`) fetches only their orders
- Shows status badge: Pending → Confirmed → In Transit → Delivered
- After delivery: buyer can rate the farmer (1–5 stars)

---

## 7. Payment Flow Detail (Razorpay)

```
Browser (React)                 Express Server              Razorpay API
     │                               │                           │
     │── POST /api/razorpay-create-order ──────────────────────>│
     │       { amount, currency, receipt }                       │
     │                               │<── order object ─────────│
     │<── { order_id, keyId } ───────│
     │                               │
     │ opens Razorpay UI with order_id
     │
     │ [user pays]
     │
     │── POST /api/razorpay-verify-payment ────────────────────>│
     │    { order_id, payment_id, signature }      verify HMAC  │
     │<── { success: true } ─────────│                           │
     │
     │ createOrder() in Firebase
     │ updateListing() quantity--
```

**Environment variables required:**
```
# server/.env
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisissupersecretkey

# .env (frontend)
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
```

---

## 8. Firebase Database Structure

```
Firebase Realtime Database
├── users/
│   └── {uid}/           role, name, email, phone, location, verified
│
├── listings/
│   └── {listingId}/     userId(=farmerId), crop, variety, price, quantity,
│                        unit, quality, status, harvestDate, location
│
├── orders/
│   └── {orderId}/       buyerId, farmerId, crop, quantity, totalAmount,
│                        paymentId, status, orderDate
│
├── activities/
│   └── {uid}/           farming activity logs per farmer
│
├── inputProducts/       seeds, fertilizers, pesticides, tools (for InputMarketplace)
│
├── equipment/           tractors, harvesters etc. for rental
│
├── equipmentBookings/   bookings made via EquipmentRental page
│
├── transporters/        logistics providers with rates
│
├── transportBookings/   transport bookings linked to orders
│
├── groupBuyingOpportunities/   bulk-buy deals, participant tracking
│
├── buyerVerifications/  {uid} → verification status & business details
│
├── cropInsuranceApplications/  per-farmer insurance applications
│
├── disputes/            buyer-farmer dispute records
│
└── systemLogs/          admin audit trail
```

---

## 9. Route Map

| Path | Component | Access |
|---|---|---|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/dashboard` | DashboardRedirect | Any logged-in |
| `/farmer-dashboard` | FarmerDashboard | farmer only |
| `/buyer-dashboard` | BuyerDashboard | buyer only |
| `/customer-dashboard` | CustomerDashboard | customer only |
| `/admin` | AdminDashboard | admin only |
| `/marketplace` | Marketplace | Any logged-in |
| `/crop-planning` | CropPlanning | farmer, admin |
| `/analytics` | Analytics | farmer, admin |
| `/farming-activity` | FarmingActivity | farmer, admin |
| `/input-marketplace` | InputMarketplace | Any logged-in |
| `/equipment-rental` | EquipmentRental | Any logged-in |
| `/market-intelligence` | MarketIntelligence | Any logged-in |
| `/crop-insurance` | CropInsurance | farmer, admin |
| `/farmer-mapping` | FarmerMapping | buyer, customer, admin |
| `/government-schemes` | GovernmentSchemes | Any logged-in |
| `/profile` | Profile | Any logged-in |

---

## 10. Service Layer (firebaseService.js)

| Function | What it does |
|---|---|
| `createListing(uid, data)` | Farmer posts a new crop |
| `getUserListings(uid, cb)` | Real-time stream of farmer's own listings |
| `getListings(cb)` | All listings (used by buyer browse) |
| `updateListing(id, updates)` | Edit price / reduce quantity / mark sold |
| `deleteListing(id)` | Remove a listing |
| `createOrder(data)` | Save order after payment |
| `getUserOrders(uid, cb)` | Buyer's own orders (indexed by buyerId) |
| `getFarmerOrders(uid, cb)` | Farmer's incoming orders (indexed by farmerId) |
| `updateOrderStatus(id, status)` | Farmer moves order through lifecycle |
| `updateOrderRating(id, rating)` | Buyer rates the farmer |
| `getTransporters(cb)` | List available transporters |
| `createTransportBooking(data)` | Book a transporter for an order |
| `getInputProducts(cb)` | Seeds/fertilizers for InputMarketplace |
| `createEquipmentBooking(data)` | Book equipment for rental |
| `submitBuyerVerification(uid, data)` | Buyer submits verification request |
| `verifyUser(uid, true)` | Admin verifies a user (syncs to listings too) |
| `joinGroupBuying(oppId, uid)` | Buyer joins a group buying deal |

---

## 11. Key Data Flows (Summary Diagram)

```
FARMER                      FIREBASE                      BUYER
  │                             │                            │
  │── createListing() ─────────>│                            │
  │                             │<── getListings() ──────────│
  │                             │── all active listings ────>│
  │                             │                            │
  │                             │      [buyer pays Razorpay] │
  │                             │<── createOrder() ──────────│
  │                             │<── updateListing(qty--) ───│
  │<── getFarmerOrders() ───────│                            │
  │  (real-time push)           │── getUserOrders() ────────>│
  │                             │  (real-time push)          │
  │── updateOrderStatus() ─────>│                            │
  │   (confirmed/in-transit/    │── status update ──────────>│
  │    delivered)               │                            │
  │                             │<── updateOrderRating() ────│
```

---

## 12. Running Locally

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Set environment variables
# .env (root)
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag

# server/.env
RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET=thisissupersecretkey

# 3. Start both servers
npm run dev:fullstack

# Frontend: http://localhost:5173
# API:      http://localhost:5000
```

---

*Raith Sethu — Empowering farmers with data-driven insights.*
