# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a React-based receipts management application using Firebase for authentication, database, and storage. Users can sign in with Google, create receipt groups, upload photos to groups, and move photos between groups.

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Setup
Copy `.env.example` to `.env` and configure Firebase credentials:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Architecture

### Tech Stack
- **Build Tool**: Vite
- **Framework**: React 18 with React Router v6
- **UI**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **State**: React Context API for authentication

### Key Components

- **Login.jsx**: Google OAuth sign-in using Firebase Auth
- **Dashboard.jsx**: Main layout with navigation sidebar and content area (uses React Router Outlet)
- **ReceiptGroups.jsx**: Lists all receipt groups, handles group creation/deletion
- **ReceiptGroupDetail.jsx**: Displays photos in card layout, handles upload/delete/move operations
- **PrivateRoute.jsx**: Route guard that redirects unauthenticated users to login

### Data Flow

1. **Authentication**: AuthContext wraps the app, manages user state via Firebase onAuthStateChanged
2. **Receipt Groups**: Stored in Firestore collection `receiptGroups` with structure:
   ```js
   {
     id: "doc-id",          // Firestore document ID
     name: "string",        // Internal name
     friendlyName: "string", // Display name
     photos: [              // Array of photo objects
       {
         url: "string",      // Firebase Storage download URL
         path: "string",     // Storage path for deletion
         uploadedAt: "ISO"   // Upload timestamp
       }
     ],
     createdAt: "ISO"
   }
   ```
3. **Photo Storage**: Files stored in Firebase Storage at `receipts/{groupId}/{timestamp}_{filename}`
4. **Photo Movement**: Updates both source and target group documents, moving photo objects between arrays

### Routing

- `/` - Login page (public)
- `/dashboard` - Redirects to `/dashboard/receipts`
- `/dashboard/receipts` - Receipt groups list (protected)
- `/dashboard/receipts/:groupId` - Individual group detail view (protected)

### Firebase Configuration

All Firebase services are initialized in `src/config/firebase.js` and exported:
- `auth` - Firebase Authentication
- `googleProvider` - Google OAuth provider
- `db` - Firestore database
- `storage` - Firebase Storage

## Important Notes

- All routes except `/` require authentication
- Photo deletions remove files from Firebase Storage and update Firestore documents
- Group deletion only removes the Firestore document (photos remain in Storage unless manually cleaned)
- Moving photos transfers the storage URL references without re-uploading files
- The app uses Firebase client SDK (not Admin SDK) with security rules enforcing authentication
- The SMS receipt group (ID: `SMS`) is a default group that cannot be deleted from the UI
- SMS group has `isDefault: true` flag to prevent deletion

## Cloud Functions

Located in `functions/` directory:

- **uploadImagesFromUrls**: HTTP endpoint that accepts image URLs, downloads them, and uploads to Firebase Storage in the SMS group
- Uses Firebase Admin SDK and Node.js 20
- Deploy with: `firebase deploy --only functions`
- See `functions/README.md` for API documentation
