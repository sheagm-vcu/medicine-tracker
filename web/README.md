# Medicine Tracker - Web App

This is the web version of the Medicine Tracker app, built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- ✅ Same Firebase backend as the React Native app
- ✅ Shared data models and business logic
- ✅ Email/Password authentication
- ✅ Google Sign-In
- ✅ Medication management (add, view, toggle status)
- ✅ Responsive design with Tailwind CSS

## Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Firebase Configuration

The Firebase config is already set up in `src/firebase.config.ts` using the same Firebase project as the React Native app.

**Note:** You may want to add a Web app in Firebase Console and update the config with the exact values from there for production use.

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if 5173 is in use).

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
web/
├── src/
│   ├── components/       # Reusable UI components (Button, Card, Input, Container)
│   ├── models/          # Data models (User, Medication)
│   ├── screens/         # Screen components (MedicationDetailsForm)
│   ├── services/        # Firebase services (AuthService, MedicationService, UserService)
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   ├── main.ts          # Entry point
│   ├── firebase.config.ts # Firebase configuration
│   └── style.css        # Tailwind CSS imports
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

## Firebase Setup

This web app uses the same Firebase project as the React Native app:
- **Project ID:** `medicine-tracker-6a017`
- **Authentication:** Email/Password and Google Sign-In
- **Database:** Firestore

Both apps share the same data, so medications added in the web app will appear in the mobile app and vice versa.

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Firebase Web SDK** - Backend services
- **Firebase Auth** - Authentication
- **Firestore** - Database
