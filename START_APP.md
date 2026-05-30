# 🚀 SANARCH App Startup Guide

## ✅ Prerequisites (Already Installed)
- ✅ Python 3.10.11
- ✅ Node.js v22.20.0
- ✅ Docker 29.4.1

---

## 📋 Step-by-Step Startup Instructions

### **STEP 1: Configure Environment Variables**

#### **Backend Configuration** (`backend/.env`)

Your backend `.env` file needs to be configured. Check if it has these variables:

```bash
# Navigate to backend folder
cd backend

# View current .env file
type .env
```

**Required variables:**
```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# Database (for local development, use SQLite)
DATABASE_URL=sqlite:///./sanarch.db

# Redis (for Celery)
REDIS_URL=redis://localhost:6379/0

# Storage (Backblaze B2 - optional for local dev)
B2_ENDPOINT_URL=https://s3.us-west-000.backblazeb2.com
B2_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-app-key
B2_BUCKET_NAME=your-bucket-name

# ClamAV (for virus scanning)
CLAMD_HOST=localhost
CLAMD_PORT=3310

# Development mode
DEV_MODE_ENABLED=true
ENVIRONMENT=development
```

#### **Frontend Configuration** (`frontend/.env`)

Your frontend `.env` currently points to production API. For local development:

```env
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000

# OR for Physical Device (use your computer's IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.x:8000
```

**To find your computer's IP:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

---

### **STEP 2: Start Backend Services**

#### **Option A: Using Docker (Recommended)**

```bash
# Navigate to backend folder
cd backend

# Start all services (PostgreSQL, Redis, ClamAV, Backend, Celery Worker)
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Services started:**
- PostgreSQL (database) - Port 5432
- Redis (task queue) - Port 6379
- ClamAV (virus scanner) - Port 3310
- Backend API - Port 8000
- Celery Worker (background tasks)

#### **Option B: Local Development (Without Docker)**

**Terminal 1 - Backend API:**
```bash
cd backend

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (if not done)
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Celery Worker (Optional for document processing):**
```bash
cd backend
.\venv\Scripts\activate

# Start Celery worker
celery -A app.workers.celery_app worker --loglevel=info --pool=solo
```

**Terminal 3 - Redis (Required for Celery):**
```bash
# Install Redis for Windows or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

---

### **STEP 3: Verify Backend is Running**

Open browser and visit:
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

You should see the FastAPI interactive documentation.

---

### **STEP 4: Start Frontend (React Native)**

#### **For Android Emulator:**

**Terminal 4 - Metro Bundler:**
```bash
cd frontend

# Start Expo development server
npx expo start
```

**Terminal 5 - Android Build:**
```bash
cd frontend

# Build and run on Android emulator
npx expo run:android
```

**Important Notes:**
- Make sure Android Studio is installed
- Make sure an Android emulator is running OR a physical device is connected
- Firebase requires a development build (not Expo Go)

#### **For iOS (Mac only):**
```bash
cd frontend

# Build and run on iOS simulator
npx expo run:ios
```

---

### **STEP 5: Enable Firebase Phone Authentication**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Phone** provider
5. Add test phone numbers (optional):
   - Phone: `+910000000000`
   - Code: `123456`

---

### **STEP 6: Test the App**

#### **Dev Mode Login (Bypass Firebase):**
The app has a dev mode for testing without Firebase:

1. Open the app
2. On login screen, look for "Dev Mode" button
3. Tap it to login without OTP

#### **Real Firebase Login:**
1. Enter phone number in E.164 format: `+919876543210`
2. Tap "Send OTP"
3. Enter the 6-digit OTP from SMS
4. Complete onboarding

---

## 🔧 Troubleshooting

### **Backend Issues:**

**"Connection refused" error:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check Docker services
docker-compose ps

# Restart services
docker-compose restart
```

**Database migration errors:**
```bash
cd backend
alembic upgrade head
```

### **Frontend Issues:**

**"Network request failed":**
- Check `EXPO_PUBLIC_API_URL` in `frontend/.env`
- For emulator, use `http://10.0.2.2:8000`
- For physical device, use your computer's IP

**"Firebase not configured":**
- Ensure `google-services.json` is in `android/app/`
- Run `npx expo prebuild` to regenerate native folders
- Run `npx expo run:android` (not `expo start`)

**Metro bundler cache issues:**
```bash
cd frontend
npx expo start --clear
```

---

## 📱 Quick Start Commands

### **Full Stack (Docker):**
```bash
# Terminal 1 - Backend
cd backend
docker-compose up

# Terminal 2 - Frontend
cd frontend
npx expo start
```

### **Development Mode (Local):**
```bash
# Terminal 1 - Backend
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npx expo start
```

---

## 🎯 What to Expect

After successful startup:

1. **Backend API** running at `http://localhost:8000`
2. **API Documentation** at `http://localhost:8000/docs`
3. **Frontend Metro** running with QR code
4. **Android App** installed on emulator/device

**First Time Setup:**
- Login with phone number
- Complete onboarding (name, DOB, etc.)
- Your profile is created in the backend
- You can now upload documents, view timeline, etc.

---

## 📞 Need Help?

**Check logs:**
```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
# Check Metro bundler terminal

# Database
docker-compose logs -f postgres
```

**Reset everything:**
```bash
# Stop all services
docker-compose down -v

# Clear frontend cache
cd frontend
npx expo start --clear

# Restart
docker-compose up -d
```

---

## 🎉 You're Ready!

The app should now be running with:
- ✅ Backend API with Firebase auth
- ✅ Document upload with AI extraction
- ✅ Timeline view
- ✅ Profile management
- ✅ QR code sharing
- ✅ Family member management

Happy coding! 🚀
