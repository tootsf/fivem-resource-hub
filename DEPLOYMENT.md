# FiveM Resource Hub - Production Deployment Guide

A comprehensive platform for discovering, reviewing, and managing FiveM server resources with an innovative recipe builder for server configurations.

## 🎯 Features

- **Resource Discovery**: Search and browse 240+ FiveM resources
- **Review System**: Community-driven ratings and detailed reviews
- **Recipe Builder**: Visual server configuration generator with YAML export
- **User Management**: GitHub OAuth integration
- **Professional UI**: Responsive design with modern interface

## 🚀 Quick Deploy

### Backend (Railway)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your GitHub account
3. **New Project**: Click "Deploy from GitHub repo"
4. **Select Repository**: Choose your backend folder
5. **Add Database**: Click "Add PostgreSQL"
6. **Environment Variables**: Add these in Railway dashboard:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-app.vercel.app
   JWT_SECRET=your-super-secure-secret
   SESSION_SECRET=your-session-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

### Frontend (Vercel)

1. **Create Vercel Account**: Go to [vercel.com](https://vercel.com)
2. **Connect GitHub**: Link your GitHub account
3. **Import Project**: Click "Add New Project"
4. **Select Repository**: Choose your frontend folder
5. **Environment Variables**: Add in Vercel dashboard:
   ```
   VITE_API_URL=https://your-backend.railway.app
   VITE_GITHUB_CLIENT_ID=your-github-client-id
   ```

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## 🗄️ Database Setup

The app will automatically create tables when deployed. Your Railway PostgreSQL instance will be configured automatically.

## 🔐 GitHub OAuth Setup

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: FiveM Resource Hub
   - **Homepage URL**: https://your-app.vercel.app
   - **Authorization callback URL**: https://your-backend.railway.app/api/auth/github/callback
4. Copy Client ID and Client Secret to your environment variables

## 📊 Production Monitoring

- **Backend Health**: `https://your-backend.railway.app/health`
- **Frontend**: `https://your-app.vercel.app`
- **Railway Logs**: Available in Railway dashboard
- **Vercel Analytics**: Available in Vercel dashboard

## 🎉 Post-Deployment

1. **Test Authentication**: Try GitHub login
2. **Test Recipe Builder**: Create and download a server config
3. **Test Reviews**: Write a review for a resource
4. **Check Performance**: Use Lighthouse for frontend analysis

## 🛠️ Tech Stack

- **Frontend**: React + Vite + Axios
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: GitHub OAuth + JWT
- **Deployment**: Vercel + Railway
- **Database**: PostgreSQL

---

**Built with ❤️ for the FiveM community**
