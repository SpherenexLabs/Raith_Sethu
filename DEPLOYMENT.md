# Farmer Management System - Vercel Deployment Guide

## 🚀 Serverless Architecture

This application uses **Vercel Serverless Functions** for API endpoints, making it perfect for deployment without managing servers.

## 📁 Structure

```
/api                    # Vercel Serverless Functions
  ├── market-prices.js  # Fetch real market prices
  ├── price-trends.js   # Fetch historical trends
  └── health.js         # Health check endpoint

/src                    # React application
vercel.json            # Vercel configuration
```

## 🔧 Local Development

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI globally
npm install -g vercel

# Run development with serverless functions
vercel dev
```

### Option 2: Standard Vite
```bash
npm run dev
```

## 🌐 Deploy to Vercel

### Method 1: Vercel CLI
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Vercel will auto-detect Vite and deploy

**No environment variables needed** - API endpoints work automatically!

## 📊 API Endpoints

When deployed on Vercel:
- `https://your-app.vercel.app/api/market-prices?commodity=Rice&state=Karnataka`
- `https://your-app.vercel.app/api/price-trends?commodity=Rice&days=30`
- `https://your-app.vercel.app/api/health`

## ✅ Features

- ✅ **Serverless**: No server maintenance
- ✅ **Auto-scaling**: Handles any traffic
- ✅ **Real data**: Government AGMARKNET API
- ✅ **Fallback**: Sample data when API rate limited
- ✅ **CORS handled**: Works from any origin
- ✅ **Zero config**: Just deploy

## 🎯 What Happens

1. Frontend calls `/api/market-prices`
2. Vercel routes to serverless function
3. Function fetches from government API
4. Returns real data or falls back gracefully

## 💡 Cost

**FREE** for:
- 100GB bandwidth/month
- 100 serverless function invocations/day
- Perfect for this use case!
