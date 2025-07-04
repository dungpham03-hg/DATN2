import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEdit, FaKey, FaBell, FaEye, FaEyeSlash, FaCamera } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import AvatarUpload from '../../components/AvatarUpload/AvatarUpload';
import './Profile.css';

const Profile = () => {
  const { user, token, updateProfile, updateUserData, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  // States for editing profile
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    department: user?.department || '',
    position: user?.position || '',
    phone: user?.phone || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // States for change password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // States for notifications
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.notificationSettings?.email ?? true,
    pushNotifications: user?.notificationSettings?.push ?? true,
    meetingReminders: user?.notificationSettings?.meetingReminders ?? true,
    statusUpdates: user?.notificationSettings?.statusUpdates ?? false,
    weeklyReports: user?.notificationSettings?.weeklyReports ?? true
  });


  // States for avatar upload
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // Sync notification settings when user data changes
  useEffect(() => {
    if (user?.notificationSettings) {
      setNotificationSettings({
        emailNotifications: user.notificationSettings.email ?? true,
        pushNotifications: user.notificationSettings.push ?? true,
        meetingReminders: user.notificationSettings.meetingReminders ?? true,
        statusUpdates: user.notificationSettings.statusUpdates ?? false,
        weeklyReports: user.notificationSettings.weeklyReports ?? true
      });
    }
  }, [user?.notificationSettings]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Profile update handlers
  const handleProfileChange = (e) => {
    if (!e?.target) return;
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileMessage('');
    
    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setEditMode(false);
        setProfileMessage('Cập nhật thông tin thành công!');
        setTimeout(() => setProfileMessage(''), 3000);
      }
    } catch (error) {
      setProfileMessage('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileCancel = () => {
    setEditMode(false);
    setProfileData({
      fullName: user?.fullName || '',
      department: user?.department || '',
      position: user?.position || '',
      phone: user?.phone || ''
    });
    setProfileMessage('');
  };

  // Password change handlers
  const handlePasswordChange = (e) => {
    if (!e?.target) return;
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear errors when user types
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    
    if (!validatePassword()) return;
    
    setPasswordLoading(true);
    
    try {
      const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (result.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordMessage('Đổi mật khẩu thành công!');
        setTimeout(() => setPasswordMessage(''), 3000);
      }
    } catch (error) {
      setPasswordMessage('Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Notification handlers
  const handleNotificationChange = async (setting) => {
    const newValue = !notificationSettings[setting];
    
    // Update state immediately for instant UI feedback
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: newValue
    }));

    // Auto-save to server
    try {
      const newSettings = {
        ...notificationSettings,
        [setting]: newValue
      };

      const notificationData = {
        email: newSettings.emailNotifications,
        push: newSettings.pushNotifications,
        meetingReminders: newSettings.meetingReminders,
        statusUpdates: newSettings.statusUpdates,
        weeklyReports: newSettings.weeklyReports
      };

      const result = await updateProfile({ 
        notificationSettings: notificationData
      }, true); // skipToast = true to avoid too many toast messages

      if (result.success) {
        // Update user data in context to keep it in sync
        updateUserData({ 
          notificationSettings: notificationData
        });
      } else {
        // Revert on failure
        setNotificationSettings(prev => ({
          ...prev,
          [setting]: !newValue
        }));
        toast.error('Không thể lưu cài đặt. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Auto-save notification error:', error);
      // Revert on error
      setNotificationSettings(prev => ({
        ...prev,
        [setting]: !newValue
      }));
      toast.error('Không thể lưu cài đặt. Vui lòng thử lại.');
    }
  };



  // Avatar upload handlers
  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarUpload = async (file, setProgress) => {
    setAvatarLoading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.post(`${API_BASE_URL}/auth/upload-avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        // Cập nhật ngay lập tức trong context để đồng bộ
        updateUserData({ avatar: response.data.avatarUrl });
        
        // Sau đó cập nhật vào database 
        await updateProfile({ avatar: response.data.avatarUrl }, true);
        
        // Toast success message
        toast.success('Ảnh đại diện đã được cập nhật!');
        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Cập nhật ảnh đại diện thất bại. Vui lòng thử lại.');
      throw error;
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);

    try {
      const response = await axios.delete(`${API_BASE_URL}/auth/remove-avatar`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Cập nhật ngay lập tức trong context để đồng bộ
        updateUserData({ avatar: null });
        
        // Sau đó cập nhật vào database
        await updateProfile({ avatar: null }, true);
        
        // Toast success message
        toast.success('Đã xóa ảnh đại diện!');
        setShowAvatarModal(false);
      }
    } catch (error) {
      console.error('Remove avatar error:', error);
      toast.error('Xóa ảnh đại diện thất bại. Vui lòng thử lại.');
      throw error;
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <Container className="py-4 profile-page">
      <Row>
        <Col>
          <h2 className="mb-4">Thông tin cá nhân</h2>
          <Card>
            <Card.Body>
              <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link eventKey="info">
                      <FaUser className="me-2" />
                      Thông tin cá nhân
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="password">
                      <FaKey className="me-2" />
                      Đổi mật khẩu
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="notifications">
                      <FaBell className="me-2" />
                      Thông báo
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  {/* Thông tin cá nhân */}
                  <Tab.Pane eventKey="info">
                    <div className="text-center mb-4">
                      <div className="position-relative d-inline-block avatar-container">
                        <div
                          className="profile-avatar mx-auto mb-3"
                          tabIndex={0}
                          role="button"
                          aria-label="Thay đổi ảnh đại diện"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleAvatarClick();
                            }
                          }}
                          style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            backgroundColor: user?.avatar ? 'transparent' : '#e9ecef',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            color: '#6c757d',
                            fontWeight: 'bold',
                            backgroundImage: user?.avatar ? `url(${
                              user.avatar.startsWith('/uploads') 
                                ? `${API_BASE_URL.replace('/api', '')}${user.avatar}`
                                : user.avatar
                            })` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '3px solid #dee2e6',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative'
                          }}
                          onClick={handleAvatarClick}
                        >
                          {!user?.avatar && getInitials(user?.fullName)}
                          
                          {/* Overlay với icon camera */}
                          <div 
                            className="avatar-overlay"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: '50%',
                              background: 'rgba(0, 0, 0, 0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s ease'
                            }}
                          >
                            <FaCamera 
                              style={{
                                color: 'white',
                                fontSize: '1.5rem'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <h4>{user?.fullName}</h4>
                      <p className="text-muted">{user?.email}</p>
                      <Badge bg={
                        user?.role === 'admin' ? 'danger' :
                        user?.role === 'manager' ? 'primary' :
                        user?.role === 'secretary' ? 'info' :
                        'secondary'
                      } className="fs-6">
                        {user?.role === 'admin' ? 'Quản trị viên' :
                         user?.role === 'manager' ? 'Quản lý' :
                         user?.role === 'secretary' ? 'Thư ký' :
                         'Nhân viên'}
                      </Badge>
                    </div>

                    {/* Thông tin về quyền */}
                    <Alert variant="info" className="mb-4">
                      <h6>Quyền hạn của bạn:</h6>
                      {user?.role === 'admin' && (
                        <ul className="mb-0">
                          <li>Xem và quản lý tất cả cuộc họp</li>
                          <li>Tạo, sửa, xóa mọi cuộc họp</li>
                          <li>Quản lý người dùng và hệ thống</li>
                        </ul>
                      )}
                      {user?.role === 'manager' && (
                        <ul className="mb-0">
                          <li>Tạo và quản lý cuộc họp</li>
                          <li>Xem tất cả cuộc họp công khai</li>
                          <li>Xem cuộc họp riêng tư trong phòng ban</li>
                          <li>Mời người tham gia cuộc họp</li>
                        </ul>
                      )}
                      {user?.role === 'secretary' && (
                        <ul className="mb-0">
                          <li>Tạo và quản lý cuộc họp</li>
                          <li>Xem tất cả cuộc họp công khai</li>
                          <li>Xem cuộc họp riêng tư trong phòng ban</li>
                          <li>Hỗ trợ lập biên bản cuộc họp</li>
                        </ul>
                      )}
                      {user?.role === 'employee' && (
                        <ul className="mb-0">
                          <li>Xem cuộc họp công khai</li>
                          <li>Xem cuộc họp riêng tư khi được mời</li>
                          <li>Tham gia và phản hồi lời mời</li>
                          <li><strong>Lưu ý:</strong> Không thể xem cuộc họp riêng tư của phòng ban nếu không được mời</li>
                        </ul>
                      )}
                    </Alert>

                    {profileMessage && (
                      <Alert variant={profileMessage.includes('thành công') ? 'success' : 'danger'}>
                        {profileMessage}
                      </Alert>
                    )}

                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Họ và tên</Form.Label>
                            <Form.Control
                              type="text"
                              name="fullName"
                              value={profileData.fullName}
                              onChange={handleProfileChange}
                              disabled={!editMode}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              value={user?.email}
                              disabled
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Phòng ban</Form.Label>
                            <Form.Control
                              type="text"
                              name="department"
                              value={profileData.department}
                              onChange={handleProfileChange}
                              disabled={!editMode}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Chức vụ</Form.Label>
                            <Form.Control
                              type="text"
                              name="position"
                              value={profileData.position}
                              onChange={handleProfileChange}
                              disabled={!editMode}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={profileData.phone}
                              onChange={handleProfileChange}
                              disabled={!editMode}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <div className="d-flex justify-content-end gap-2">
                        {!editMode ? (
                          <Button
                            variant="primary"
                            onClick={() => setEditMode(true)}
                          >
                            <FaEdit className="me-2" />
                            Chỉnh sửa
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="secondary"
                              onClick={handleProfileCancel}
                              disabled={profileLoading}
                            >
                              Hủy
                            </Button>
                            <Button
                              variant="primary"
                              onClick={handleProfileSave}
                              disabled={profileLoading}
                            >
                              {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </Button>
                          </>
                        )}
                      </div>
                    </Form>
                  </Tab.Pane>

                  {/* Đổi mật khẩu */}
                  <Tab.Pane eventKey="password">
                    {passwordMessage && (
                      <Alert variant={passwordMessage.includes('thành công') ? 'success' : 'danger'}>
                        {passwordMessage}
                      </Alert>
                    )}

                    <Form onSubmit={handlePasswordSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu hiện tại</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type={showPasswords.current ? 'text' : 'password'}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            isInvalid={!!passwordErrors.currentPassword}
                          />
                          <Button
                            variant="link"
                            className="position-absolute end-0 top-50 translate-middle-y"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {passwordErrors.currentPassword}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Mật khẩu mới</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type={showPasswords.new ? 'text' : 'password'}
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            isInvalid={!!passwordErrors.newPassword}
                          />
                          <Button
                            variant="link"
                            className="position-absolute end-0 top-50 translate-middle-y"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {passwordErrors.newPassword}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                        <div className="position-relative">
                          <Form.Control
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            isInvalid={!!passwordErrors.confirmPassword}
                          />
                          <Button
                            variant="link"
                            className="position-absolute end-0 top-50 translate-middle-y"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                          </Button>
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {passwordErrors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <div className="d-flex justify-content-end">
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>

                  {/* Thông báo */}
                  <Tab.Pane eventKey="notifications">

                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="emailNotifications"
                          label="Thông báo qua email"
                          checked={notificationSettings.emailNotifications}
                          onChange={() => handleNotificationChange('emailNotifications')}
                        />
                        <Form.Text className="text-muted">
                          Nhận thông báo qua email khi có cuộc họp mới hoặc thay đổi
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="pushNotifications"
                          label="Thông báo đẩy"
                          checked={notificationSettings.pushNotifications}
                          onChange={() => handleNotificationChange('pushNotifications')}
                        />
                        <Form.Text className="text-muted">
                          Nhận thông báo đẩy trên trình duyệt
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="meetingReminders"
                          label="Nhắc nhở cuộc họp"
                          checked={notificationSettings.meetingReminders}
                          onChange={() => handleNotificationChange('meetingReminders')}
                        />
                        <Form.Text className="text-muted">
                          Nhận nhắc nhở trước khi cuộc họp bắt đầu
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="statusUpdates"
                          label="Cập nhật trạng thái"
                          checked={notificationSettings.statusUpdates}
                          onChange={() => handleNotificationChange('statusUpdates')}
                        />
                        <Form.Text className="text-muted">
                          Nhận thông báo khi có thay đổi trạng thái cuộc họp
                        </Form.Text>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          id="weeklyReports"
                          label="Báo cáo hàng tuần"
                          checked={notificationSettings.weeklyReports}
                          onChange={() => handleNotificationChange('weeklyReports')}
                        />
                        <Form.Text className="text-muted">
                          Nhận báo cáo tổng hợp về các cuộc họp trong tuần
                        </Form.Text>
                      </Form.Group>

                      <div className="text-muted text-center mt-3">
                        <small>Cài đặt được lưu tự động khi bạn thay đổi</small>
                      </div>
                    </Form>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Avatar Upload Modal */}
      <AvatarUpload
        show={showAvatarModal}
        onHide={() => setShowAvatarModal(false)}
        currentAvatar={user?.avatar}
        onUpload={handleAvatarUpload}
        onRemove={handleRemoveAvatar}
        loading={avatarLoading}
        userName={user?.fullName}
      />
    </Container>
  );
};

export default Profile; 