# 🔧 Hướng dẫn cấu hình Environment Variables

## 📁 Client (.env)

**Tạo file `client/.env` với nội dung:**

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_API_BASE_URL=http://localhost:5000/api

# For production deployment:
# REACT_APP_API_URL=https://your-server-domain.com
# REACT_APP_API_BASE_URL=https://your-server-domain.com/api

# Development mode
REACT_APP_ENV=development
```

## 📁 Server (.env)

**Tạo file `server/.env` với nội dung:**

```bash
# Database - MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/meeting_management?retryWrites=true&w=majority

# JWT Secret
JWT_SECRET=meeting_management_super_secret_jwt_key_2025_minimum_32_characters

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000

# Email Configuration (optional for now)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```

## 🚀 Deployment URLs

### Development (Local):
- Client: `http://localhost:3000`
- Server: `http://localhost:5000`

### Production Examples:
- **Netlify/Vercel (Frontend):** `https://meeting-app.netlify.app`
- **Heroku/Railway (Backend):** `https://meeting-api.herokuapp.com`
- **MongoDB Atlas:** Cloud database

## 📝 Lưu ý:

1. **NEVER commit .env files to Git** (đã có trong .gitignore)
2. **Thay thế values** bằng thông tin thật của bạn
3. **Production:** Sử dụng HTTPS và domain thật
4. **MongoDB:** Lấy connection string từ MongoDB Atlas dashboard

## 🔄 Restart sau khi thay đổi:

```bash
# Restart client
cd client && npm start

# Restart server  
cd server && npm start
``` 