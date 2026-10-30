# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


# AgriSmartX Project Overview

This is an agriculture marketplace with a React web app, a Django equipment-recognition app, and Supabase for most user accounts and marketplace data. It is more than the frontend-only app described in `PROJECT_DOCUMENTATION.md`: the repository also includes a Django backend and a TensorFlow Lite model.

## What’s Implemented

The main web experience is a React 19 + Vite single-page app. It uses React Router for navigation and Supabase directly from the browser for authentication, database access, realtime updates, and image storage.

The main workflows are:

- **Accounts:** Sign up by selecting a role; sign in with email/password or phone OTP; persist sessions and sign out. Profile editing includes contact/location details and an avatar.
- **Agricultural listings:** Browse and filter equipment, land, labor, and livestock. Owners can create, view, and soft-delete listings. Listing detail pages show photos, type-specific details, owner information, and reviews.
- **Booking requests:** Request a rental or purchase, set dates and quantity, and see an estimated total with a calculated 5% service charge. Owners can approve, reject, or complete requests; buyers can cancel pending requests.
- **Bulk crop sales:** Farmers can post crop type, quantity, unit price, quality, harvest date, location, description, and photos. Buyers can express interest; farmers can accept one buyer, which marks the post sold and rejects other interests.
- **Agricultural products:** Browse products by category, search by title, and filter by price. Product details support cash-on-delivery orders, quantity and stock checks, delivery details, seller approval/fulfillment, buyer order tracking, and verified purchase reviews.
- **Messaging and alerts:** Chat is backed by Supabase messages and realtime subscriptions. Booking and crop-interest events create notifications; the app includes notification toasts and read/unread handling.
- **Role dashboards:** Separate dashboards for farmers, laborers, asset owners, dealers, and buyers. They provide role-specific views for listings, work profiles, requests, bookings, crop sales, purchases, earnings, and alerts.
- **Equipment recognition:** Django serves a camera page at `/farm/detect/`. It can capture a still or run repeated live detection, classify images with the TFLite model, save captures/results, and return recent detections from `/farm/history/`.

The main frontend routes and access rules are in `App.jsx`. Shared Supabase operations are in `lib`; the classifier is implemented in `views.py`, with its detection-history model in `models.py`.

## User Roles

The signup flow offers five roles:

- **Farmer:** Browse and book resources, create permitted listings, and sell crops in bulk.
- **Labor:** Create a labor listing, maintain skills and availability, and respond to job requests.
- **Asset Owner:** List equipment or livestock, manage incoming requests, and view earnings.
- **Dealer / Seller:** Manage inventory and sales requests.
- **Buyer:** Browse listings and products, express interest in crop posts, and manage requests.

There are legacy role names in the code too: `equipment_owner` and `livestock_owner`.

## Architecture and Data

- **Frontend:** React, Vite, React Router, Supabase JavaScript client.
- **Marketplace backend/data:** Supabase Auth, Postgres, Realtime, and Storage. The frontend expects tables such as `users`, `listings`, `bookings`, `notifications`, `marketplace`, `crop_posts`, `crop_interests`, and `reviews`.
- **Detection backend:** Django, SQLite locally by default (or PostgreSQL if `DATABASE_URL` is configured), OpenCV, and TensorFlow Lite.
- **Deployment configuration:** Vercel config for the frontend and Render config for Django.

The Supabase schema, Row Level Security policies, and Storage buckets are not defined in the repository. They need to be configured in the Supabase project for the marketplace workflows to work.

Product orders and reviews require the SQL migration at `../supabase/migrations/20261025180000_marketplace_orders.sql`. Apply it to the Supabase project before using checkout (for example, in the Supabase SQL Editor). Checkout currently supports cash on delivery; no online payment provider is configured.

## How to Run Locally

You need Node.js/npm and Python installed. Configure Supabase first, then create `.env` from `.env.example` and add your project values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://127.0.0.1:8000
```

**Start the React frontend** in one terminal:

```powershell
cd "F:\VS Code Languages\My Tutorials\Projects\Agri\frontend"
npm install
npm run dev
```

Vite is configured for port `5173`; open `http://localhost:5173`.

**Start the Django backend** in a second terminal:

```powershell
cd "F:\VS Code Languages\My Tutorials\Projects\Agri"
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd agri
py manage.py migrate
py manage.py runserver 8000
```

The local detection interface is at `http://127.0.0.1:8000/farm/detect/`; the recent-history endpoint is at `/farm/history/`. Django is configured to serve uploaded media locally when `DEBUG=True`. The frontend embeds the detection page in an iframe, using `VITE_BACKEND_URL`.

**Windows note:** `tflite-runtime` may not install from the pinned requirements on Windows because compatible wheels are platform-dependent. If installation fails, the detection backend needs a compatible TensorFlow/TFLite installation or a Linux environment. The React app can still be run separately, but the camera detection feature requires the Django backend and a loadable model.

## What’s Incomplete or Worth Knowing

- **Camera captures aren’t attached to listings:** The camera opens the Django detection page, but its captured image is not automatically returned to the listing form’s selected photos.
- **Payments are not implemented in the visible booking flow:** It creates a request and calculates a service charge, but does not process payment.
- **Testing is sparse:** `tests.py` is only a Django test stub. Build and lint checks were not run because the terminal actions were declined.
- **Security/configuration needs attention before public deployment:** Django has a development fallback `SECRET_KEY`; configure real secrets and review the unauthenticated, CSRF-exempt detection endpoint before exposing it publicly.

Deployment settings are in `render.yaml`, `build.sh`, and `vercel.json`.