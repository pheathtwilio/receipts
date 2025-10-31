import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import fetch from "node-fetch";

initializeApp();

const db = getFirestore();
const storage = getStorage();

// SMS Receipt Group ID (constant)
const SMS_GROUP_ID = "SMS";

/**
 * Cloud Function to upload images from URLs to Firebase Storage
 * and add them to the SMS receipt group
 * 
 * Expected request body:
 * {
 *   "imageUrls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 * }
 */
export const uploadImagesFromUrls = onRequest(
  { cors: true },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).send({ error: "Method not allowed" });
      return;
    }

    try {
      const { imageUrls } = req.body;

      // Validate input
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        res.status(400).send({
          error: "Invalid request body. Expected { imageUrls: string[] }",
        });
        return;
      }

      // Ensure SMS group exists
      const smsGroupRef = db.collection("receiptGroups").doc(SMS_GROUP_ID);
      const smsGroupDoc = await smsGroupRef.get();

      if (!smsGroupDoc.exists) {
        // Create the SMS group if it doesn't exist
        await smsGroupRef.set({
          name: "sms",
          friendlyName: "SMS Receipts",
          photos: [],
          createdAt: new Date().toISOString(),
          isDefault: true,
        });
      }

      // Process each image URL
      const uploadedPhotos = [];
      const errors = [];

      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];

        try {
          // Download the image
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
          }

          const buffer = await response.buffer();
          const contentType = response.headers.get("content-type") || "image/jpeg";

          // Generate unique filename
          const timestamp = Date.now();
          const extension = contentType.split("/")[1] || "jpg";
          const filename = `${timestamp}_${i}.${extension}`;
          const storagePath = `receipts/${SMS_GROUP_ID}/${filename}`;

          // Upload to Firebase Storage
          const bucket = storage.bucket();
          const file = bucket.file(storagePath);

          await file.save(buffer, {
            metadata: {
              contentType: contentType,
            },
          });

          // Make the file publicly accessible
          await file.makePublic();

          // Get the public URL
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

          // Create photo object
          const photoData = {
            url: publicUrl,
            path: storagePath,
            uploadedAt: new Date().toISOString(),
          };

          uploadedPhotos.push(photoData);
        } catch (error) {
          console.error(`Error processing image ${imageUrl}:`, error);
          errors.push({
            url: imageUrl,
            error: error.message,
          });
        }
      }

      // Update Firestore with new photos
      if (uploadedPhotos.length > 0) {
        const currentData = (await smsGroupRef.get()).data();
        const currentPhotos = currentData?.photos || [];

        await smsGroupRef.update({
          photos: [...currentPhotos, ...uploadedPhotos],
        });
      }

      // Send response
      res.status(200).send({
        success: true,
        uploaded: uploadedPhotos.length,
        failed: errors.length,
        photos: uploadedPhotos,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Error in uploadImagesFromUrls:", error);
      res.status(500).send({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);
