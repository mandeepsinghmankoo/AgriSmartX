# Agri Project Documentation

## 1. Executive Summary

This project is a frontend-only React + Vite application for an agriculture marketplace called `AgriSmartX`.

It uses:
- `React 19`
- `React Router`
- `Supabase` for authentication, database access, and file storage
- direct client-side calls to Supabase from the frontend

There is no custom backend server in this repository. The app logic lives in the frontend and the persistent data appears to live in Supabase.

## 2. Direct Answers To Your Main Questions

### How many services are there?
If we group the implemented platform by business/service modules, there are **9 core services**:

1. Authentication service
2. User profile service
3. Agri listings service
4. Booking service
5. Notification service
6. Agri product marketplace service
7. Crop sales service
8. Reviews service
9. File/image storage service

If you mean deployable microservices, the answer is different:
- **1 frontend app** in this repo
- **0 custom backend services** in this repo
- **1 external backend platform**: Supabase

### How many user types are there?
There are **5 active user roles exposed in signup UI**:
1. `farmer`
2. `labor`
3. `asset_owner`
4. `dealer`
5. `buyer`

There are also **2 legacy role aliases still referenced in code**:
1. `equipment_owner`
2. `livestock_owner`

So for AI support, you should model:
- **5 current supported roles**
- **2 legacy/compatibility roles**

### How many users are there in the project?
From the source code alone, the exact live user count **cannot be determined**.

What we can confirm:
- user data is stored in a Supabase `users` table
- auth users are managed by Supabase Auth
- the app reads profile rows from `users`

To know the real number of users, you would need database access or analytics access.

## 3. High-Level Product Purpose

The platform is a multi-role agriculture ecosystem that supports:
- renting or selling equipment
- leasing land
- hiring labor
- buying or selling livestock
- shopping agricultural products
- posting crop harvests for bulk sale
- managing bookings and requests
- receiving notifications
- maintaining role-based dashboards

## 4. Tech Architecture

### Frontend
- Framework: React
- Bundler: Vite
- Routing: React Router
- Styling: mostly inline styles plus app CSS

### Backend/Data Layer
- Supabase Auth for login/signup/session handling
- Supabase Postgres tables for application data
- Supabase Storage for uploaded images

### Important architecture note
This is a client-heavy app. Most business operations are executed directly in frontend helper files under `src/lib/`.

That means your AI support assistant should understand that many failures will likely be caused by:
- role mismatch in frontend logic
- missing or inconsistent Supabase rows
- storage bucket issues
- RLS / permission problems in Supabase
- table schema mismatch against what the frontend expects

## 5. Project Structure

```text
frontend/
  src/
    components/common/
      Navbar.jsx
      Footer.jsx
    contexts/
      AuthContext.jsx
    lib/
      auth.js
      supabase.js
      roles.js
      listings.js
      bookings.js
      notifications.js
      marketplace.js
      cropSales.js
      reviews.js
      storage.js
      utils.js
    pages/
      Home.jsx
      Login.jsx
      Signup.jsx
      Listings.jsx
      ListingDetail.jsx
      CreateListing.jsx
      MyBookings.jsx
      Marketplace.jsx
      CropSales.jsx
      PostCrop.jsx
      Profile.jsx
      Dashboard.jsx
      dashboards/
        FarmerDashboard.jsx
        LaborDashboard.jsx
        AssetOwnerDashboard.jsx
        DealerDashboard.jsx
        BuyerDashboard.jsx
        EquipmentOwnerDashboard.jsx
        LivestockOwnerDashboard.jsx
```

## 6. Routes Implemented

### Public routes
- `/`
- `/login`
- `/signup`

### Auth-required routes
- `/listings`
- `/listings/:id`
- `/marketplace`
- `/marketplace/:id`
- `/profile`
- `/crop-sales`

### Role-protected routes
- `/create-listing`
- `/my-bookings`
- `/dashboard`
- `/post-crop`

## 7. Core Business Modules

### 7.1 Authentication Service
Responsibilities:
- email/password signup
- email/password login
- phone OTP login
- session persistence
- logout
- profile fetch after auth
- offline auto logout after 30 minutes without internet

Main files:
- `src/lib/auth.js`
- `src/contexts/AuthContext.jsx`
- `src/lib/supabase.js`

### 7.2 User Profile Service
Responsibilities:
- user profile read from `users`
- profile edit
- avatar upload to storage bucket `profiles`
- work profile updates for labor users

Main files:
- `src/pages/Profile.jsx`
- `src/pages/dashboards/LaborDashboard.jsx`
- `src/contexts/AuthContext.jsx`

### 7.3 Agri Listings Service
Responsibilities:
- create listing
- browse listings
- listing detail page
- owner listing management
- soft delete listing by setting `status = deleted`
- view count increment

Supported listing domains in code:
- `equipment`
- `land`
- `labor`
- `livestock`
- `product` (partially mixed with marketplace logic)

Main files:
- `src/lib/listings.js`
- `src/pages/Listings.jsx`
- `src/pages/ListingDetail.jsx`
- `src/pages/CreateListing.jsx`

### 7.4 Booking Service
Responsibilities:
- create booking/request
- buyer and owner views of bookings
- approve/reject/cancel/complete booking
- booking notifications
- price breakdown with 5% service charge

Main file:
- `src/lib/bookings.js`

Booking statuses used:
- `pending`
- `approved`
- `completed`
- `cancelled`
- `rejected`

### 7.5 Notification Service
Responsibilities:
- fetch user notifications
- mark one notification as read
- mark all notifications as read
- auto-create notifications for booking events

Main file:
- `src/lib/notifications.js`

### 7.6 Product Marketplace Service
Responsibilities:
- browse agri products
- filter by category and price
- product detail fetch
- create product rows in `marketplace`
- increment product views

Categories used in UI/code include:
- `seed`
- `fertilizer`
- `pesticide`
- `vet_medicine`
- `tool`
- `feed`
- `other`

Main file:
- `src/lib/marketplace.js`

### 7.7 Crop Sales Service
Responsibilities:
- farmers post crop lots for sale
- buyers express interest
- farmers review interested buyers
- farmers accept one buyer and reject the others
- crop post becomes `sold` after acceptance

Main file:
- `src/lib/cropSales.js`

Crop post statuses:
- `open`
- `sold`

Crop interest statuses:
- `pending`
- `accepted`
- `rejected`

### 7.8 Reviews Service
Responsibilities:
- add review for listing/booking
- fetch reviews for listing

Main file:
- `src/lib/reviews.js`

### 7.9 File Storage Service
Responsibilities:
- upload single image
- upload multiple images
- get public file URLs

Buckets implied by code:
- `listings`
- `profiles`

Main file:
- `src/lib/storage.js`

## 8. User Roles And Capabilities

### Farmer
Main intent:
- browse equipment, land, labor, livestock
- create some listings
- make bookings
- post crops for sale

Visible dashboard areas:
- overview
- my listings
- crop sales
- bookings
- requests
- alerts

### Labor
Main intent:
- post self as labor
- manage work profile
- receive job requests
- toggle availability

Visible dashboard areas:
- overview
- work profile
- find work
- job requests
- alerts

### Asset Owner
Main intent:
- manage equipment/livestock assets
- receive asset booking requests
- track earnings

Visible dashboard areas:
- overview
- my assets
- requests
- earnings
- alerts

### Dealer
Main intent:
- list products/items for sale
- manage inventory
- process sales requests
- review purchases

Visible dashboard areas:
- overview
- inventory
- sales
- purchases
- alerts

### Buyer
Main intent:
- browse agri marketplace
- browse crop feed
- receive alerts

Visible dashboard areas:
- overview
- crop feed
- shop
- alerts

## 9. Database Tables Used By Frontend

The frontend directly references these Supabase tables:

1. `users`
2. `listings`
3. `bookings`
4. `notifications`
5. `marketplace`
6. `crop_posts`
7. `crop_interests`
8. `reviews`

### Likely meaning of each table

#### `users`
Stores profile-style application data such as:
- `id`
- `user_id`
- `name`
- `phone`
- `role`
- `location`
- `state`
- `pincode`
- `profile_image`
- `rating`
- `total_listings`
- `total_bookings`
- `is_verified`
- labor-specific fields like availability/skills

#### `listings`
Stores agri listings with mixed schemas depending on type:
- common listing metadata
- equipment fields
- land fields
- livestock fields
- labor fields
- product fields

#### `bookings`
Stores booking/sale requests between buyer and owner.

#### `notifications`
Stores app notifications per user.

#### `marketplace`
Stores agri product catalog entries.

#### `crop_posts`
Stores farmer crop-sale posts.

#### `crop_interests`
Stores buyer interest messages for crop posts.

#### `reviews`
Stores ratings/comments for listings and bookings.

## 10. Key Frontend Workflows

### Signup flow
1. user chooses a role
2. user fills name, email, phone, password
3. Supabase Auth signup is triggered
4. role/name/phone are stored in auth metadata
5. user is asked to confirm email

### Login flow
Two login methods exist:
1. email + password
2. phone OTP

### Listing creation flow
1. user opens create listing page
2. user enters type-specific fields
3. images are uploaded to storage
4. listing row is inserted into `listings`
5. user is redirected to listing detail page

### Booking flow
1. user opens a listing
2. user chooses dates/quantity
3. app calculates cost + 5% service charge
4. booking row is inserted into `bookings`
5. notification is inserted for the owner
6. owner can approve/reject/complete

### Crop sale flow
1. farmer posts crop lot
2. buyer expresses interest
3. interest row is saved in `crop_interests`
4. farmer reviews requests
5. farmer accepts one buyer
6. post becomes sold and other interests are rejected

## 11. Dashboard Coverage

There are **5 active dashboard implementations** used by `Dashboard.jsx`:
1. FarmerDashboard
2. LaborDashboard
3. AssetOwnerDashboard
4. DealerDashboard
5. BuyerDashboard

There are also **legacy dashboard files** still present in the repo:
- `EquipmentOwnerDashboard.jsx`
- `LivestockOwnerDashboard.jsx`

These appear to be older role-model artifacts and are not part of the active role map.

## 12. AI Support Assistant Knowledge Map

Your AI assistant should know how to answer questions in these areas:

### Authentication support intents
- I cannot sign up
- I did not get OTP
- I did not get email confirmation
- I was logged out automatically
- I cannot log in with phone/email

### Profile support intents
- how to change profile picture
- how to update phone/location
- how to update labor skills or work availability

### Listing support intents
- how to create a listing
- what listing type to choose
- why my listing is not visible
- how to delete a listing
- why images are not uploading

### Booking support intents
- how booking price is calculated
- what pending/approved/completed means
- how to cancel a booking
- how owner approves a request

### Marketplace support intents
- how to search/filter products
- what categories are supported
- why product page shows out of stock

### Crop sale support intents
- how farmer posts crop
- how buyer expresses interest
- what happens after a farmer accepts a buyer
- why a crop post is marked sold

### Notifications support intents
- how to read alerts
- why I got a booking notification
- how to mark notifications as read

## 13. Important Implementation Gaps And Support Risks

These are very important for an AI assistant, because the current code has some inconsistencies.

### Role mismatch problem
The codebase has two role models mixed together:
- current signup roles use `asset_owner`
- some route guards still expect `equipment_owner` and `livestock_owner`

Impact:
- some `asset_owner` users may not get the access the UI suggests they should have
- some buyer/dashboard routes may behave unexpectedly because route access and dashboard role map are not fully aligned

### Listings vs marketplace split is not fully clean
There are two product-related systems:
- `listings` can include `product`
- separate `marketplace` table also exists

This can confuse support, reporting, and AI answers unless handled carefully.

### No live user count from source code
The AI assistant should never claim an exact number of real users unless connected to analytics/database.

### Client-side business logic risk
Because so much logic is in the frontend, many errors may be caused by:
- missing Supabase rows
- RLS policy issues
- schema mismatch
- auth metadata/profile mismatch

## 14. What The AI Assistant Should Ask Internally Before Answering

When a user asks for help, the assistant should first classify:
- what role is the user?
- is this auth, listing, booking, crop sale, marketplace, or profile issue?
- is the user acting as buyer or owner in this transaction?
- is the issue caused by UI flow, role permissions, or missing data?
- is the question about intended business flow or current implemented behavior?

## 15. Suggested AI Assistant Intents By Role

### Farmer intents
- browse equipment/land/labor/livestock
- create listing
- post crop
- manage incoming booking requests
- manage outgoing bookings

### Labor intents
- update work profile
- turn availability on/off
- receive/accept job requests
- post labor profile

### Asset owner intents
- add equipment/livestock
- manage requests
- track completed earnings

### Dealer intents
- add inventory
- manage sale requests
- review purchases

### Buyer intents
- browse product marketplace
- browse crop feed
- express interest in crops

## 16. Recommended Data The AI Assistant Should Be Given

For best support quality, your AI assistant should ideally have access to:
- current authenticated user role
- current route/page
- latest user profile row
- booking status definitions
- listing type definitions
- marketplace category definitions
- crop status definitions
- known role mismatch caveats
- latest notification summaries

## 17. Recommended Next Documentation To Create

If you want to build a serious AI support assistant for this app, the next documents should be:

1. FAQ by role
2. database schema reference with every column
3. support decision tree for each major error
4. route-permission matrix
5. known bugs and mismatches list
6. user journey map for each role
7. Supabase RLS and auth policy documentation

## 18. Short Operational Summary

### Current implemented user-role count
- **5 active roles**
- **2 legacy roles**

### Current implemented service/module count
- **9 core business services**

### Current deployable app count in repo
- **1 frontend app**
- **0 custom backend servers**
- **1 Supabase backend dependency**

### Current live user count
- **unknown from source code alone**

## 19. Source Reference Map

Primary files for understanding the system:
- `src/App.jsx`
- `src/contexts/AuthContext.jsx`
- `src/lib/supabase.js`
- `src/lib/auth.js`
- `src/lib/listings.js`
- `src/lib/bookings.js`
- `src/lib/marketplace.js`
- `src/lib/cropSales.js`
- `src/lib/notifications.js`
- `src/lib/reviews.js`
- `src/lib/storage.js`
- `src/pages/Dashboard.jsx`
- `src/pages/Signup.jsx`
- `src/components/common/Navbar.jsx`

## 20. Final Notes For Building Your AI Chat Assistant

Your assistant should answer based on:
- current code behavior
- user role
- current page context
- data source involved
- known mismatch between intended business model and actual frontend enforcement

The biggest truth the assistant must preserve is this:
- this is not a classic frontend + backend repo
- this is a frontend app directly talking to Supabase
- so support answers should often mention both UI behavior and Supabase data/auth dependencies
