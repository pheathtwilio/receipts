# Firebase Functions

## Overview

Cloud Functions for the Receipts application that handle image uploads from external URLs.

## Functions

### `uploadImagesFromUrls`

Accepts an array of image URLs, downloads them, uploads to Firebase Storage, and adds them to the "SMS" receipt group.

**Endpoint**: `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls`

**Method**: POST

**Request Body**:
```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.png"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "uploaded": 2,
  "failed": 0,
  "photos": [
    {
      "url": "https://storage.googleapis.com/...",
      "path": "receipts/SMS/1234567890_0.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Deploy to Firebase:
```bash
npm run deploy
```

Or from root directory:
```bash
firebase deploy --only functions
```

## Local Development

Run functions locally with the Firebase emulator:
```bash
npm run serve
```

## SMS Default Group

- The SMS receipt group is automatically created with ID `SMS`
- It cannot be deleted from the UI
- It has all the same features as regular groups (view, upload, download, move photos)
- The `isDefault: true` flag is set on this group

## Environment

- Node.js 20
- Firebase Functions v2
- Firebase Admin SDK
