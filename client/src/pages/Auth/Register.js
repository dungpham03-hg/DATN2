import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaCalendarAlt, FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaBuilding, FaBriefcase, FaPhone, FaUserShield } from 'react-icons/fa';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    position: '',
    phone: '',
    role: 'employee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    if (!e?.target) return;
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2 || formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Họ tên phải từ 2-100 ký tự';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số';
    }
    
    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    // Optional field validations
    if (formData.department && formData.department.length > 50) {
      newErrors.department = 'Phòng ban không được vượt quá 50 ký tự';
    }
    
    if (formData.position && formData.position.length > 50) {
      newErrors.position = 'Chức vụ không được vượt quá 50 ký tự';
    }
    
    if (formData.phone && !/^(0|\+84)[3-9]\d{8,9}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Register attempt:', formData.email);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Calling register API...');
      
      // Thử register API thật trước
      let response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          department: formData.department || undefined,
          position: formData.position || undefined,
          phone: formData.phone || undefined,
          role: formData.role
        }),
      });

      let data = await response.json();
      console.log('📝 Register response:', data);

      // Nếu MongoDB error, fallback sang demo API
      if (!response.ok && (data.message?.includes('server') || data.message?.includes('database') || data.message?.includes('MongoDB'))) {
        console.log('🔄 MongoDB error detected, trying demo register API...');
        
        response = await fetch(`${API_BASE_URL}/auth/test-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            department: formData.department || undefined,
            position: formData.position || undefined,
            phone: formData.phone || undefined,
            role: formData.role
          }),
        });

        data = await response.json();
        console.log('📝 Demo register response:', data);
      }

      if (response.ok) {
        setSuccessMessage('Đăng ký thành công! Đang chuyển hướng...');
        console.log('✅ Registration successful');
        
        // Auto navigate to login after success
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Đăng ký thành công! Vui lòng đăng nhập.' 
            }
          });
        }, 2000);
      } else {
        console.log('❌ Registration failed:', data.message);
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors = {};
          data.errors.forEach(error => {
            fieldErrors[error.path] = error.msg;
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.message || 'Đăng ký thất bại' });
        }
      }
    } catch (error) {
      console.error('❌ Register error:', error);
      console.log('🔄 Network error, trying demo register API...');
      
      // Fallback sang demo API khi có lỗi network
      try {
        const response = await fetch(`${API_BASE_URL}/auth/test-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            department: formData.department || undefined,
            position: formData.position || undefined,
            phone: formData.phone || undefined,
            role: formData.role
          }),
        });

        const data = await response.json();
        console.log('📝 Demo register fallback response:', data);

        if (response.ok) {
          setSuccessMessage('Đăng ký thành công! Đang chuyển hướng...');
          console.log('✅ Demo registration successful');
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Đăng ký thành công! Vui lòng đăng nhập.' 
              }
            });
          }, 2000);
        } else {
          setErrors({ general: data.message || 'Đăng ký thất bại' });
        }
      } catch (demoError) {
        console.error('❌ Demo register also failed:', demoError);
        setErrors({ general: 'Lỗi kết nối server. Vui lòng thử lại sau.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="text-center mb-4">
            <FaCalendarAlt size={48} className="text-primary mb-3" />
            <h1 className="h3 mb-3 fw-normal">Đăng ký</h1>
            <p className="text-muted">Tạo tài khoản mới để sử dụng hệ thống</p>
          </div>

          <Card className="border-0 shadow">
            <Card.Body className="p-4">
              {successMessage && (
                <Alert variant="success" className="mb-3">
                  {successMessage}
                </Alert>
              )}
              
              {errors.general && (
                <Alert variant="danger" className="mb-3">
                  {errors.general}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Full Name */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUser className="me-2 text-muted" />
                    Họ và tên *
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên của bạn"
                    isInvalid={!!errors.fullName}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fullName}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaEnvelope className="me-2 text-muted" />
                    Email *
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập email của bạn"
                    isInvalid={!!errors.email}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaLock className="me-2 text-muted" />
                    Mật khẩu *
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Nhập mật khẩu"
                      isInvalid={!!errors.password}
                      disabled={loading}
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
                      style={{ zIndex: 10 }}
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ thường, chữ hoa và số
                  </Form.Text>
                </Form.Group>

                {/* Confirm Password */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaLock className="me-2 text-muted" />
                    Xác nhận mật khẩu *
                  </Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      isInvalid={!!errors.confirmPassword}
                      disabled={loading}
                    />
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent"
                      style={{ zIndex: 10 }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </Button>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Department */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaBuilding className="me-2 text-muted" />
                    Phòng ban
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Nhập phòng ban của bạn (tùy chọn)"
                    isInvalid={!!errors.department}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.department}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Position */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaBriefcase className="me-2 text-muted" />
                    Chức vụ
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Nhập chức vụ của bạn (tùy chọn)"
                    isInvalid={!!errors.position}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.position}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Phone */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaPhone className="me-2 text-muted" />
                    Số điện thoại
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại (tùy chọn)"
                    isInvalid={!!errors.phone}
                    disabled={loading}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phone}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Role */}
                <Form.Group className="mb-4">
                  <Form.Label>
                    <FaUserShield className="me-2 text-muted" />
                    Vai trò *
                  </Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    isInvalid={!!errors.role}
                    disabled={loading}
                  >
                    <option value="employee">Nhân viên</option>
                    <option value="secretary">Thư ký</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Quản trị viên</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.role}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Chọn vai trò phù hợp với chức vụ của bạn trong tổ chức
                  </Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang đăng ký...
                    </>
                  ) : (
                    'Đăng ký'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-decoration-none">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>

          {/* Note about required fields */}
          <Card className="mt-3 border-info">
            <Card.Body className="p-3">
              <h6 className="text-info mb-2">📝 Lưu ý</h6>
              <small className="text-muted">
                Các trường đánh dấu (*) là bắt buộc.<br />
                Sau khi đăng ký thành công, bạn có thể đăng nhập ngay lập tức.
              </small>
            </Card.Body>
          </Card>

          {/* Demo mode info */}
          <Card className="mt-3 border-warning">
            <Card.Body className="p-3">
              <h6 className="text-warning mb-2">🚀 Demo Mode</h6>
              <small className="text-muted">
                Hệ thống tự động sử dụng Demo Mode khi MongoDB không khả dụng.<br />
                Bạn có thể đăng ký bất kỳ email nào (trừ các demo account có sẵn).<br />
                <strong>Demo accounts:</strong> admin@example.com, manager@example.com, user@example.com
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register; 