# Deployment Guide

## Firebase Hosting Deployment

### Prerequisites

1. **Firebase CLI**: Install if not already installed
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

### Initial Setup

1. **Verify Firebase project**:
   ```bash
   firebase projects:list
   ```
   Ensure `receipts-476818` is listed.

2. **Set the project** (already configured in `.firebaserc`):
   ```bash
   firebase use receipts-476818
   ```

### Deploy Steps

#### 1. Build the Application

```bash
npm install
npm run build
```

This creates the `dist/` directory with optimized production files.

#### 2. Deploy to Firebase Hosting

Deploy both hosting and functions:
```bash
firebase deploy
```

Or deploy separately:

**Hosting only:**
```bash
firebase deploy --only hosting
```

**Functions only:**
```bash
firebase deploy --only functions
```

#### 3. Verify Deployment

After deployment, Firebase will provide a URL:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/receipts-476818/overview
Hosting URL: https://receipts-476818.web.app
```

### Custom Domain Setup (receipts.stoutfrog.com)

#### Step 1: Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/receipts-476818/hosting)
2. Navigate to **Hosting** → **Add custom domain**
3. Enter: `receipts.stoutfrog.com`
4. Firebase will provide DNS records to add

#### Step 2: Configure DNS

Firebase will give you one of these options:

**Option A: A Records (Recommended)**
```
Type: A
Name: receipts
Value: [IP addresses provided by Firebase]
```

Example IPs (Firebase will provide current ones):
```
receipts.stoutfrog.com  A  151.101.1.195
receipts.stoutfrog.com  A  151.101.65.195
```

**Option B: CNAME Record**
```
Type: CNAME
Name: receipts
Value: receipts-476818.web.app
```

#### Step 3: Add DNS Records

In your DNS provider (e.g., Cloudflare, Route53, etc.):

1. Create an A record:
   - **Type**: A
   - **Name**: receipts
   - **Value**: [IP from Firebase Console]
   - **TTL**: Auto or 3600

2. Repeat for all IPs provided by Firebase

#### Step 4: Verify Domain

1. Return to Firebase Console
2. Click **Verify** 
3. Wait for SSL certificate provisioning (can take up to 24 hours)
4. Status will change to **Connected**

### Environment Variables

**Important**: Build-time environment variables are baked into the production build.

Before building, ensure your `.env` file has production values:

```bash
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=receipts-476818.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=receipts-476818
VITE_FIREBASE_STORAGE_BUCKET=receipts-476818.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ALLOWED_USERS=user@stoutfrog.com
```

### Continuous Deployment (Optional)

#### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_ALLOWED_USERS: ${{ secrets.VITE_ALLOWED_USERS }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: receipts-476818
```

### Deployment Checklist

- [ ] Build completes without errors (`npm run build`)
- [ ] Environment variables are set correctly
- [ ] Firebase project is selected (`firebase use receipts-476818`)
- [ ] Firestore security rules are deployed
- [ ] Storage security rules are deployed
- [ ] CORS configuration is set on Storage bucket
- [ ] Cloud Functions are deployed
- [ ] Custom domain DNS records are configured
- [ ] SSL certificate is active
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Verify Cloud Function endpoints

### Rollback

To rollback to a previous deployment:

```bash
firebase hosting:clone receipts-476818:PREVIOUS_VERSION receipts-476818:live
```

View deployment history:
```bash
firebase hosting:channel:list
```

### Monitoring

- **Firebase Console**: [Hosting Dashboard](https://console.firebase.google.com/project/receipts-476818/hosting)
- **Usage Stats**: Monitor bandwidth, storage, and function invocations
- **Error Reporting**: Check Functions logs for API errors

### Common Issues

**Build fails:**
- Check Node.js version (should be 20+)
- Ensure all dependencies are installed: `npm install`
- Clear cache: `rm -rf node_modules dist && npm install`

**Deployment fails:**
- Verify Firebase login: `firebase login`
- Check project selection: `firebase use receipts-476818`
- Ensure billing is enabled for Functions

**Custom domain not working:**
- Wait 24-48 hours for SSL provisioning
- Verify DNS records with: `dig receipts.stoutfrog.com`
- Check Firebase Console for domain status

### Production URLs

After deployment:
- **Default**: https://receipts-476818.web.app
- **Custom**: https://receipts.stoutfrog.com (after DNS setup)
- **Functions**: https://YOUR_REGION-receipts-476818.cloudfunctions.net/uploadImagesFromUrls

### Security Notes

- Never commit `.env` file
- Rotate API keys if exposed
- Keep `VITE_ALLOWED_USERS` list up to date
- Review Firestore and Storage rules regularly
- Monitor Cloud Function usage for anomalies
