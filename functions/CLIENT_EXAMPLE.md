# Calling the Firebase Function from Node.js

## Using Native Fetch (Node.js 18+)

```javascript
// No additional dependencies needed in Node.js 18+
async function uploadImagesToReceipts(imageUrls) {
  const functionUrl = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls';
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrls: imageUrls
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    return result;
  } catch (error) {
    console.error('Error uploading images:', error);
    throw error;
  }
}

// Usage
const imageUrls = [
  'https://example.com/receipt1.jpg',
  'https://example.com/receipt2.png'
];

const result = await uploadImagesToReceipts(imageUrls);
```

## Using axios (if you prefer)

```javascript
import axios from 'axios';

async function uploadImagesToReceipts(imageUrls) {
  const functionUrl = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls';
  
  try {
    const response = await axios.post(functionUrl, {
      imageUrls: imageUrls
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading images:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
const imageUrls = [
  'https://example.com/receipt1.jpg',
  'https://example.com/receipt2.png'
];

const result = await uploadImagesToReceipts(imageUrls);
```

## Example Serverless Function (Vercel, Netlify, AWS Lambda)

### Vercel Edge Function

```javascript
// api/upload-receipts.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { imageUrls } = await req.json();
  
  const functionUrl = process.env.FIREBASE_FUNCTION_URL;
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrls })
  });

  const result = await response.json();
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
```

### AWS Lambda Function

```javascript
// handler.js
export const handler = async (event) => {
  const { imageUrls } = JSON.parse(event.body);
  
  const functionUrl = process.env.FIREBASE_FUNCTION_URL;
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls })
    });

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Content-Type': 'application/json',
      }
    };
  }
};
```

### Netlify Function

```javascript
// netlify/functions/upload-receipts.js
exports.handler = async (event, context) => {
  const { imageUrls } = JSON.parse(event.body);
  
  const functionUrl = process.env.FIREBASE_FUNCTION_URL;
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls })
    });

    const result = await response.json();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result),
      headers: {
        'Content-Type': 'application/json',
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: {
        'Content-Type': 'application/json',
      }
    };
  }
};
```

## With Error Handling and Retry Logic

```javascript
async function uploadImagesToReceipts(imageUrls, maxRetries = 3) {
  const functionUrl = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrls }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const result = await response.json();
      
      // Log results
      console.log(`Successfully uploaded ${result.uploaded} images`);
      if (result.failed > 0) {
        console.warn(`Failed to upload ${result.failed} images:`, result.errors);
      }
      
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Environment Variables

Set the Firebase Function URL as an environment variable:

```bash
# .env or in your serverless provider
FIREBASE_FUNCTION_URL=https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadImagesFromUrls
```

Then use it in your code:

```javascript
const functionUrl = process.env.FIREBASE_FUNCTION_URL;
```

## Complete Example with Validation

```javascript
async function uploadReceiptImages(imageUrls) {
  // Validate input
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('imageUrls must be a non-empty array');
  }

  // Validate URLs
  const urlPattern = /^https?:\/\/.+/;
  const invalidUrls = imageUrls.filter(url => !urlPattern.test(url));
  if (invalidUrls.length > 0) {
    throw new Error(`Invalid URLs: ${invalidUrls.join(', ')}`);
  }

  const functionUrl = process.env.FIREBASE_FUNCTION_URL;
  
  if (!functionUrl) {
    throw new Error('FIREBASE_FUNCTION_URL environment variable not set');
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrls })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      uploaded: result.uploaded,
      failed: result.failed,
      photos: result.photos,
      errors: result.errors
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Usage
const result = await uploadReceiptImages([
  'https://example.com/receipt1.jpg',
  'https://example.com/receipt2.png'
]);

if (result.success) {
  console.log(`Uploaded ${result.uploaded} images successfully`);
} else {
  console.error(`Upload failed: ${result.error}`);
}
```

## Response Handling

The Firebase function returns:

```javascript
{
  success: true,
  uploaded: 2,        // Number of successfully uploaded images
  failed: 0,          // Number of failed uploads
  photos: [           // Array of uploaded photo objects
    {
      url: "https://storage.googleapis.com/.../image.jpg",
      path: "receipts/SMS/timestamp_0.jpg",
      uploadedAt: "2024-01-01T12:00:00.000Z"
    }
  ],
  errors: []          // Array of errors (only present if failed > 0)
}
```
