import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { FaUser, FaEdit, FaKey, FaBell, FaEye, FaEyeSlash } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

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
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Profile update handlers
  const handleProfileChange = (e) => {
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
  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleNotificationSave = async () => {
    setNotificationLoading(true);
    setNotificationMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotificationMessage('Cài đặt thông báo đã được lưu!');
      setTimeout(() => setNotificationMessage(''), 3000);
    } catch (error) {
      setNotificationMessage('Lưu cài đặt thất bại. Vui lòng thử lại.');
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <Container className="py-4">
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
                      <div
                        className="profile-avatar mx-auto mb-3"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          backgroundColor: '#e9ecef',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2.5rem',
                          color: '#6c757d',
                          fontWeight: 'bold'
                        }}
                      >
                        {getInitials(user?.fullName)}
                      </div>
                      <h4>{user?.fullName}</h4>
                      <p className="text-muted">{user?.email}</p>
                    </div>

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
                    {notificationMessage && (
                      <Alert variant={notificationMessage.includes('thành công') ? 'success' : 'danger'}>
                        {notificationMessage}
                      </Alert>
                    )}

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

                      <div className="d-flex justify-content-end">
                        <Button
                          variant="primary"
                          onClick={handleNotificationSave}
                          disabled={notificationLoading}
                        >
                          {notificationLoading ? 'Đang lưu...' : 'Lưu cài đặt'}
                        </Button>
                      </div>
                    </Form>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 