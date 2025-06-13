const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GithubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || !profile.emails[0]) {
        return done(new Error('Không thể lấy email từ Google account'), null);
      }

      // Kiểm tra xem user đã tồn tại chưa
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Cập nhật thông tin nếu cần
        if (!user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }
        return done(null, user);
      }

      // Tạo user mới nếu chưa tồn tại
      user = await User.create({
        email: profile.emails[0].value,
        fullName: profile.displayName,
        googleId: profile.id,
        avatar: profile.photos?.[0]?.value,
        emailVerified: true,
        password: Math.random().toString(36).slice(-8), // Random password
        role: 'employee' // Default role
      });

      done(null, user);
    } catch (error) {
      console.error('Google Strategy Error:', error);
      done(error, null);
    }
  }
));

// Github Strategy
passport.use(new GithubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback",
    scope: ['user:email', 'read:user'],
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub Profile:', profile);
      
      // Lấy email từ Github profile
      let email;
      
      // Thử lấy email từ emails array
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      }
      
      // Nếu không có email, trả về lỗi
      if (!email) {
        return done(new Error('Không thể lấy email từ GitHub account. Vui lòng cho phép truy cập email trong cài đặt GitHub.'), null);
      }

      // Kiểm tra user đã tồn tại
      let user = await User.findOne({ 
        $or: [
          { email: email },
          { githubId: profile.id }
        ]
      });
      
      if (user) {
        // Cập nhật thông tin nếu cần
        let needsUpdate = false;
        
        if (!user.githubId) {
          user.githubId = profile.id;
          needsUpdate = true;
        }
        
        if (profile.photos && profile.photos[0] && !user.avatar) {
          user.avatar = profile.photos[0].value;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await user.save();
        }
        
        return done(null, user);
      }

      // Tạo user mới
      user = await User.create({
        email,
        fullName: profile.displayName || profile.username,
        githubId: profile.id,
        avatar: profile.photos?.[0]?.value,
        emailVerified: true,
        password: Math.random().toString(36).slice(-8),
        role: 'employee'
      });

      done(null, user);
    } catch (error) {
      console.error('GitHub Strategy Error:', error);
      done(error, null);
    }
  }
));

module.exports = passport; 