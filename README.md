# Receipts Frontend

A React-based web application for managing receipt photos organized into groups, with Firebase authentication and storage.

## Features

- **Google Authentication**: Sign in using Google OAuth via Firebase
- **Receipt Groups Management**: Create, view, and delete receipt groups
- **Photo Upload**: Upload multiple photos to groups via Firebase Storage
- **Photo Management**: View photos in card layout, delete individual photos
- **Photo Transfer**: Move photos between groups with automatic storage URL updates
- **Bootstrap UI**: Clean, responsive interface using React Bootstrap

## Tech Stack

- **Frontend**: React 18, Vite
- **UI Framework**: Tailwind CSS
- **Backend Services**: Firebase (Authentication, Firestore, Storage)
- **Routing**: React Router v6

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Google Authentication in Firebase Console → Authentication → Sign-in method
3. Enable Firestore Database
4. Enable Firebase Storage
5. Copy your Firebase configuration
6. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

7. Update `.env` with your Firebase credentials:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase Security Rules

#### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /receiptGroups/{groupId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### Storage CORS Configuration
To enable photo downloads, configure CORS for Firebase Storage:

```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

Replace `your-project-id` with your Firebase project ID. You may need to install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) if you don't have `gsutil` installed.

### 4. Run Development Server

```bash
npm run dev
```

The application will open at http://localhost:3000

## Project Structure

```
src/
├── components/
│   ├── Login.jsx              # Google authentication login page
│   ├── Dashboard.jsx          # Main layout with navigation
│   ├── ReceiptGroups.jsx      # List and manage receipt groups
│   ├── ReceiptGroupDetail.jsx # View/manage photos in a group
│   └── PrivateRoute.jsx       # Protected route wrapper
├── contexts/
│   └── AuthContext.jsx        # Authentication state management
├── config/
│   └── firebase.js            # Firebase initialization
├── App.jsx                    # Main app with routing
└── main.jsx                   # Application entry point
```

## Data Structure

### Receipt Group (Firestore Document)

```javascript
{
  id: "group-id",                    // Document ID
  name: "Group Name",                // Internal name
  friendlyName: "Display Name",      // User-friendly display name
  photos: [                          // Array of photo objects
    {
      url: "https://...",            // Firebase Storage download URL
      path: "receipts/group/file",   // Storage path for deletion
      uploadedAt: "2024-01-01T..."   // ISO timestamp
    }
  ],
  createdAt: "2024-01-01T..."        // ISO timestamp
}
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Usage

1. **Sign In**: Click "Sign in with Google" on the login page
2. **Create Group**: Click "Create New Group" and provide ID, name, and friendly name
3. **View Group**: Click "View" on any group to see its photos
4. **Upload Photos**: Click "Upload Photos" and select one or multiple images
5. **Delete Photo**: Click the trash icon on any photo card
6. **Move Photos**: Select photos using checkboxes, click "Move Selected", and choose target group
7. **Delete Group**: Click "Delete" in the groups list (confirms before deletion)

## License

See LICENSE file for details
