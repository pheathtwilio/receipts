# Quick Start - Deploy to Firebase Hosting

## Prerequisites
```bash
npm install -g firebase-tools
firebase login
```

## Deploy in 3 Steps

### 1. Build the App
```bash
npm run build
```

### 2. Deploy Everything (Hosting + Functions)
```bash
npm run deploy
```

OR deploy separately:

**Hosting only:**
```bash
npm run deploy:hosting
```

**Functions only:**
```bash
npm run deploy:functions
```

### 3. Set Up Custom Domain

1. Go to Firebase Console: https://console.firebase.google.com/project/receipts-476818/hosting
2. Click "Add custom domain"
3. Enter: `receipts.stoutfrog.com`
4. Add the DNS records Firebase provides to your DNS server

**Example DNS Configuration:**
```
Type: A
Name: receipts
Value: [IPs from Firebase - typically 2 IPs]
```

OR

```
Type: CNAME  
Name: receipts
Value: receipts-476818.web.app
```

## After Deployment

- **Default URL**: https://receipts-476818.web.app
- **Custom URL**: https://receipts.stoutfrog.com (after DNS propagation)

## Verify

1. Visit your deployed URL
2. Test Google login
3. Upload a photo
4. Test the Cloud Function with an API call

See `DEPLOYMENT.md` for detailed instructions.
