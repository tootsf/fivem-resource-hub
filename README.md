# 🎮 FiveM Resource Hub

**A comprehensive platform for discovering, reviewing, and organizing FiveM server resources with GitHub authentication.**

🌐 **Live Demo**: [fivem-resource-hub.vercel.app](https://fivem-resource-hub.vercel.app)  
🔗 **API**: [fivem-resource-hub-production.up.railway.app](https://fivem-resource-hub-production.up.railway.app)

---

## ✨ Current Features

### 🔍 **Resource Discovery**
- **2,786+ FiveM Resources** - Comprehensive database of curated resources
- **Fast Search** - Real-time text search across all resource data
- **GitHub Integration** - Direct links to resource repositories
- **Clean UI** - Modern, responsive React frontend

### 👤 **Authentication & Profiles** 
- **GitHub OAuth** - Secure login with GitHub accounts
- **User Dashboard** - Personalized dashboard for authenticated users
- **Cross-Domain Auth** - JWT authentication between Railway backend and Vercel frontend
- **Session Management** - Secure token-based authentication

---

## 🚀 Technology Stack

### **Frontend**
- **React 18** with Hooks and Context API
- **Vite** for fast development and building
- **Axios** for API communication
- **Modern CSS** with responsive design
- **Deployed on Vercel**

### **Backend**  
- **Node.js** with Express framework
- **PostgreSQL** database with connection pooling
- **Passport.js** for GitHub OAuth
- **JWT** for authentication
- **Deployed on Railway**

### **Database**
- **PostgreSQL** hosted on Railway
- **2,786 resources** imported and indexed
- **User management** with GitHub data
- **Optimized queries** with proper indexing
- YAML export functionality
- Server.cfg file generation
- Dependency management
---

## � Project Status

### **✅ Completed Features**
- **Core Infrastructure** - Backend API, database, authentication
- **Resource Discovery** - Search through 2,786+ resources
- **GitHub OAuth** - Full authentication system working
- **User Dashboard** - Authenticated user experience
- **Production Deployment** - Live on Railway + Vercel

### **🔧 In Development** 
See [TODO.md](./TODO.md) for detailed roadmap:
- **Resource Claiming** - Let users claim resource ownership
- **Review System** - Star ratings and user reviews
- **Resource Details** - Detailed resource pages

### **🎯 Next Phase Goals**
- Enable users to claim and manage resources
- Build community features (reviews, ratings)
- Add resource collections and organization tools

---

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+
- GitHub account (for OAuth)

### **Quick Start**

1. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd resource_search
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Add environment variables (see backend/.env.example)
   npm run dev
   ```

3. **Setup Frontend** 
   ```bash
   cd frontend
   npm install
   # Add environment variables (see frontend/.env.example)
   npm run dev
   ```

4. **GitHub OAuth Setup**
   - Create GitHub OAuth app at https://github.com/settings/applications/new
   - Set callback URL: `http://localhost:3001/auth/github/callback` (development)
   - Add Client ID and Secret to environment variables
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🤝 Contributing

This is an active project welcoming contributions! See [TODO.md](./TODO.md) for current development priorities.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See LICENSE file for details.

---

## 🎯 Project Vision

**Goal:** Create the ultimate FiveM resource discovery platform where developers can easily find, review, and organize server resources.

**Current Status:** Core infrastructure complete, ready for community features.

**Built with ❤️ for the FiveM community**
