# Example Usage

## Testing the uploadImagesFromUrls Function

### Using cURL

```bash
curl -X POST \
  https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": [
      "https://example.com/receipt1.jpg",
      "https://example.com/receipt2.png"
    ]
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch('https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrls: [
      'https://example.com/receipt1.jpg',
      'https://example.com/receipt2.png'
    ]
  })
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   uploaded: 2,
//   failed: 0,
//   photos: [...],
//   errors: undefined
// }
```

### Using Python

```python
import requests
import json

url = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls'
payload = {
    'imageUrls': [
        'https://example.com/receipt1.jpg',
        'https://example.com/receipt2.png'
    ]
}

response = requests.post(url, json=payload)
result = response.json()
print(result)
```

### Testing Locally with Firebase Emulator

1. Start the emulator:
```bash
cd functions
npm run serve
```

2. Call the local function:
```bash
curl -X POST \
  http://localhost:5001/YOUR_PROJECT_ID/us-central1/uploadImagesFromUrls \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": [
      "https://picsum.photos/800/600",
      "https://picsum.photos/600/800"
    ]
  }'
```

## Response Format

### Success Response

```json
{
  "success": true,
  "uploaded": 2,
  "failed": 0,
  "photos": [
    {
      "url": "https://storage.googleapis.com/YOUR_BUCKET/receipts/SMS/1234567890_0.jpg",
      "path": "receipts/SMS/1234567890_0.jpg",
      "uploadedAt": "2024-01-01T12:00:00.000Z"
    },
    {
      "url": "https://storage.googleapis.com/YOUR_BUCKET/receipts/SMS/1234567890_1.png",
      "path": "receipts/SMS/1234567890_1.png",
      "uploadedAt": "2024-01-01T12:00:01.000Z"
    }
  ]
}
```

### Partial Success (Some Failed)

```json
{
  "success": true,
  "uploaded": 1,
  "failed": 1,
  "photos": [
    {
      "url": "https://storage.googleapis.com/YOUR_BUCKET/receipts/SMS/1234567890_0.jpg",
      "path": "receipts/SMS/1234567890_0.jpg",
      "uploadedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "errors": [
    {
      "url": "https://invalid-url.com/image.jpg",
      "error": "Failed to fetch image: Not Found"
    }
  ]
}
```

### Error Response

```json
{
  "error": "Invalid request body. Expected { imageUrls: string[] }"
}
```

## Notes

- All uploaded images are added to the SMS receipt group
- The SMS group is automatically created if it doesn't exist
- Images are stored in Firebase Storage at: `receipts/SMS/{timestamp}_{index}.{extension}`
- Each image URL is processed independently; partial failures are reported
- CORS is enabled for all origins
