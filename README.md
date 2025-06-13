# Ứng dụng Web Quản lý Cuộc họp

## Mô tả Dự án
Ứng dụng Web quản lý cuộc họp được phát triển bằng MERN Stack (MongoDB, Express.js, React, Node.js) như một phần của Đồ án Tốt nghiệp.

## Tính năng chính
- 🔐 Xác thực người dùng (đăng ký, đăng nhập, phân quyền)
- 📅 Lập lịch cuộc họp (tạo, chỉnh sửa, xóa)
- 📋 Quản lý agenda cuộc họp
- 🔔 Hệ thống thông báo tự động
- 📝 Ghi chép biên bản cuộc họp
- 📁 Chia sẻ và quản lý tệp
- 🔍 Tìm kiếm thông minh

## Cài đặt và Chạy Dự án

### Yêu cầu hệ thống
- Node.js (v16+)
- MongoDB Atlas hoặc MongoDB cục bộ
- npm hoặc yarn

### Bước 1: Clone repository
```bash
git clone https://github.com/your-username/meeting-management-app.git
cd meeting-management-app
```

### Bước 2: Cài đặt dependencies
```bash
npm run install-all
```

### Bước 3: Cấu hình biến môi trường
Ứng dụng gồm hai phần `server` (Backend Node/Express) và `client` (Frontend React) nên mỗi phần cần một file `.env` riêng.

#### 3.1 Backend – server/.env
```env
PORT=5000                               # Cổng chạy Express
NODE_ENV=development                    # Môi trường

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/meeting_db?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret_key

# Client URL dùng cho CORS và redirect OAuth
CLIENT_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxx
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Microsoft OAuth (tuỳ chọn)
MICROSOFT_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
MICROSOFT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxx
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback

# Email SMTP (nếu sử dụng)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

#### 3.2 Frontend – client/.env
React chỉ đọc được các biến bắt đầu bằng `REACT_APP_`:

```env
# Địa chỉ API của backend
REACT_APP_API_BASE_URL=http://localhost:5000

# URL trang web (dùng cho redirect sau login)
REACT_APP_SITE_URL=http://localhost:3000
```

Sau khi tạo xong hai file `.env`, hãy khởi động lại terminal hoặc chạy lại ứng dụng để thay đổi có hiệu lực.

### Bước 4: Chạy ứng dụng
```bash
# Chạy cả frontend và backend
npm run dev

# Hoặc chạy riêng lẻ
npm run server  # Backend (port 5000)
npm run client  # Frontend (port 3000)
```

### Bước 5: Thiết lập dữ liệu mẫu (tùy chọn)
```bash
# Tạo dữ liệu mẫu trong database
npm run seed
```

Sau khi chạy seed, bạn có thể đăng nhập với các tài khoản sau:
- **Admin**: admin@example.com / Admin123
- **Manager**: manager@example.com / Manager123  
- **User**: user@example.com / User123

## Cấu trúc Dự án
```
meeting-management-app/
├── client/           # React Frontend
├── server/           # Express Backend
├── docs/             # Tài liệu dự án
├── package.json      # Root package.json
└── README.md         # Tài liệu này
```

## Công nghệ sử dụng
- **Frontend**: React, React Router, Axios, Bootstrap/Material-UI
- **Backend**: Node.js, Express.js, JWT Authentication
- **Database**: MongoDB với Mongoose ODM
- **Deployment**: Heroku/Vercel
- **Testing**: Jest, React Testing Library

## Lịch trình Phát triển
- **Tuần 1**: Thiết lập dự án và xác thực
- **Tuần 2**: Lập lịch và giao diện
- **Tuần 3**: Agenda và thông báo
- **Tuần 4**: Biên bản và chia sẻ tệp
- **Tuần 5**: Triển khai và kiểm thử
- **Tuần 6**: Hoàn thiện và trình bày

## Đóng góp
Đây là dự án đồ án tốt nghiệp. Mọi đóng góp và phản hồi đều được hoan nghênh.

## Liên hệ
- Email: your.email@gmail.com
- GitHub: [your-username](https://github.com/your-username) 