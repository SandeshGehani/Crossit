# Crossit 

Crossit is a modern, offline-first Progressive Web Application (PWA) designed to simplify expense tracking and group bill splitting. 

## Features

* **Expense Tracking:** Log your daily expenses with ease. Choose from a variety of categories and payment methods.
* **Group Splits (IOUs):** Easily track who owes who. Split bills equally or set custom amounts for each person.
* **Auto-Expense Logging:** When you create an IOU where others owe you, Crossit can automatically log the total amount as a personal expense.
* **Real-time Synchronization:** Your data is securely stored and synchronized across all your devices using Firebase Firestore.
* **Offline Support:**  Crossit works even when you're offline. Changes are saved locally and synced automatically when your connection is restored.
* **Recurring Expenses:** Set up recurring expenses (daily, weekly, monthly, yearly) and Crossit will automatically log them for you.
* **Insightful Reports:** Visualize your spending habits with intuitive charts and graphs. Track your monthly spend, category breakdowns, and running balances with friends.
* **True Dark Mode:** Switch to dark mode for a comfortable viewing experience in low-light environments.
* **Secure Access:** Protect your financial data with Google Authentication.

## Technology Stack

* **Frontend:** React, Vite
* **Styling:** Tailwind CSS (Vanilla CSS for core variables)
* **Charts:** Recharts
* **Backend/Database:** Firebase (Firestore, Authentication, Hosting)

## Getting Started

### Prerequisites

* Node.js
* npm or yarn
* Firebase CLI (`npm install -g firebase-tools`)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd crossledger
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Firebase:**
   * Create a new Firebase project in the Firebase Console.
   * Enable Firestore Database and Google Authentication.
   * Get your Firebase configuration object from the project settings.
   * Create a `.env` file in the root directory and add your Firebase credentials:
     ```env
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

4. **Deploy Firestore Rules and Indexes:**
   ```bash
   firebase deploy --only firestore
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Build for production:**
   ```bash
   npm run build
   ```

7. **Deploy to Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```
