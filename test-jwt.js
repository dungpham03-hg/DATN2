const https = require('http');

// Dữ liệu đăng nhập
const loginData = JSON.stringify({
  email: "admin@example.com",
  password: "Admin123"
});

// Cấu hình request
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/test-login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

console.log('🔐 Đang lấy JWT token...\n');

// Gửi request
const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.token) {
        console.log('✅ Đăng nhập thành công!');
        console.log('📋 Thông tin user:', response.user.fullName, '(' + response.user.role + ')');
        console.log('\n🎫 JWT ACCESS TOKEN:');
        console.log('Bearer', response.token);
        console.log('\n🔄 REFRESH TOKEN:');
        console.log(response.refreshToken);
        console.log('\n💡 Sử dụng token trong API calls:');
        console.log('Authorization: Bearer ' + response.token);
      } else {
        console.log('❌ Lỗi đăng nhập:', response.message);
      }
    } catch (error) {
      console.log('❌ Lỗi parse response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Lỗi kết nối:', error.message);
  console.log('💡 Đảm bảo server đang chạy trên port 5000');
});

// Gửi dữ liệu
req.write(loginData);
req.end(); 