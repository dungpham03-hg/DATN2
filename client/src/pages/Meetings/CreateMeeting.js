import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTimes, FaUsers, FaLock, FaGlobe, FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingLink: '',
    meetingType: 'offline',
    priority: 'medium',
    isPrivate: false,
    attendees: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // States cho người dùng
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // States cho phòng họp
  const [availableRooms, setAvailableRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Lấy danh sách người dùng từ hệ thống
  useEffect(() => {
    fetchUsers();
    fetchAllRooms();
  }, []);

  // Lấy tất cả phòng họp
  const fetchAllRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await axios.get(`${API_BASE_URL}/meeting-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error fetching all rooms:', error);
      setAllRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Tìm phòng họp khả dụng khi thay đổi ngày/giờ
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (formData.startTime && formData.endTime) {
        try {
          const response = await axios.get(`${API_BASE_URL}/meeting-rooms`, {
            params: {
              startTime: formData.startTime,
              endTime: formData.endTime
            },
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setAvailableRooms(response.data.rooms);
        } catch (error) {
          console.error('Error fetching available rooms:', error);
          setAvailableRooms([]);
        }
      } else {
        // Khi chưa có thời gian, hiển thị tất cả phòng
        setAvailableRooms(allRooms);
      }
    };

    fetchAvailableRooms();
  }, [formData.startTime, formData.endTime, token, allRooms]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${API_BASE_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Lọc bỏ current user khỏi danh sách
      const filteredUsers = response.data.users.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Nếu API không có, dùng demo data
      setUsers([
        { _id: '1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', department: 'IT' },
        { _id: '2', fullName: 'Trần Thị B', email: 'tranthib@example.com', department: 'HR' },
        { _id: '3', fullName: 'Lê Văn C', email: 'levanc@example.com', department: 'Sales' },
        { _id: '4', fullName: 'Phạm Thị D', email: 'phamthid@example.com', department: 'Marketing' }
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAttendee = (user) => {
    if (!formData.attendees.find(a => a._id === user._id)) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, user]
      }));
    }
    setSearchUser('');
    setShowUserDropdown(false);
  };

  const handleRemoveAttendee = (userId) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a._id !== userId)
    }));
  };

  const filteredUsers = users.filter(user => {
    const search = searchUser.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      (user.department && user.department.toLowerCase().includes(search))
    ) && !formData.attendees.find(a => a._id === user._id);
  });

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
    if (!formData.startTime) newErrors.startTime = 'Thời gian bắt đầu là bắt buộc';
    if (!formData.endTime) newErrors.endTime = 'Thời gian kết thúc là bắt buộc';
    if (formData.startTime && new Date(formData.startTime) <= new Date()) newErrors.startTime = 'Thời gian bắt đầu phải trong tương lai';
    if (formData.endTime && formData.startTime && new Date(formData.endTime) <= new Date(formData.startTime)) newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';

    // Meeting link validation
    if (formData.meetingType !== 'offline' && !formData.meetingLink.trim()) {
      newErrors.meetingLink = 'Link họp bắt buộc cho cuộc họp online/hybrid';
    }
    if (formData.meetingType === 'offline') {
      // Không cho phép nhập link cho offline
      formData.meetingLink = '';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    try {
      setLoading(true);
      const payload = { 
        ...formData,
        // Sử dụng phòng họp đã chọn hoặc địa điểm tùy chỉnh
        location: selectedRoom || formData.location,
        // Chỉ gửi ID của attendees
        attendees: formData.attendees.map(a => a._id)
      };
      if (payload.meetingType === 'offline' || !payload.meetingLink.trim()) {
        delete payload.meetingLink;
      }

      const res = await axios.post(`${API_BASE_URL}/meetings`, payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate(`/meetings/${res.data.meeting._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Tạo cuộc họp thất bại';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="meetings-container">
      <Container>
        <Row>
          <Col>
            <div className="d-flex align-items-center meetings-header mb-4">
              <Link to="/meetings" className="btn btn-outline-secondary me-3">
                <FaArrowLeft />
              </Link>
              <div>
                <h1 className="meetings-title">Tạo cuộc họp mới</h1>
                <p className="meetings-subtitle">Lên lịch cuộc họp cho nhóm của bạn</p>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <Card className="meetings-main-card">
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  {serverError && <Alert variant="danger">{serverError}</Alert>}

                  <Form.Group className="mb-3" controlId="title">
                    <Form.Label>Tiêu đề *</Form.Label>
                    <Form.Control
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      isInvalid={!!errors.title}
                    />
                    <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="description">
                    <Form.Label>Mô tả</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="startTime">
                        <Form.Label>Bắt đầu *</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          isInvalid={!!errors.startTime}
                        />
                        <Form.Control.Feedback type="invalid">{errors.startTime}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="endTime">
                        <Form.Label>Kết thúc *</Form.Label>
                        <Form.Control
                          type="datetime-local"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          isInvalid={!!errors.endTime}
                        />
                        <Form.Control.Feedback type="invalid">{errors.endTime}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3" controlId="location">
                    <Form.Label>
                      <FaBuilding className="me-2" />
                      Địa điểm
                    </Form.Label>
                    
                    {/* Dropdown chọn phòng họp - luôn hiển thị nếu có phòng */}
                    {(availableRooms.length > 0 || allRooms.length > 0) && (
                      <Form.Select 
                        className="mb-2"
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        disabled={loadingRooms}
                      >
                        <option value="">
                          {loadingRooms ? "Đang tải..." : 
                           formData.startTime && formData.endTime ? "-- Chọn phòng họp khả dụng --" : "-- Chọn phòng họp --"}
                        </option>
                        {(availableRooms.length > 0 ? availableRooms : allRooms).map(room => {
                          const isAvailable = !formData.startTime || !formData.endTime || availableRooms.some(ar => ar._id === room._id);
                          return (
                            <option key={room._id} value={room.name}>
                              {!isAvailable ? '🔒 ' : ''}{room.name} - {room.location.floor} ({room.capacity} người)
                              {room.facilities.length > 0 && ` • ${room.facilities.map(f => {
                                const facilityMap = {
                                  'projector': 'Máy chiếu',
                                  'whiteboard': 'Bảng trắng',
                                  'tv': 'TV',
                                  'video_conference': 'HN truyền hình',
                                  'sound_system': 'Âm thanh',
                                  'air_conditioning': 'Điều hòa',
                                  'wifi': 'WiFi'
                                };
                                return facilityMap[f] || f;
                              }).join(', ')}`}
                            </option>
                          );
                        })}
                      </Form.Select>
                    )}
                    
                    {/* Input nhập địa điểm tùy chỉnh */}
                    {!selectedRoom && (
                    <Form.Control
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder={allRooms.length > 0 ? "Hoặc nhập địa điểm khác" : "Nhập địa điểm họp"}
                    />
                    )}
                    
                    {/* Thông báo trạng thái */}
                    {loadingRooms && (
                      <Form.Text className="text-muted">
                        <Spinner size="sm" className="me-2" />
                        Đang tải danh sách phòng họp...
                      </Form.Text>
                    )}
                    
                    {!loadingRooms && allRooms.length === 0 && (
                      <Form.Text className="text-info">
                        Chưa có phòng họp nào trong hệ thống. Bạn có thể nhập địa điểm tùy chỉnh.
                      </Form.Text>
                    )}
                    
                    {!loadingRooms && formData.startTime && formData.endTime && availableRooms.length === 0 && allRooms.length > 0 && (
                      <Form.Text className="text-warning">
                        Không có phòng họp nào khả dụng trong khung giờ này
                      </Form.Text>
                    )}
                    
                    {selectedRoom && (
                      <div className="mt-2">
                        <Badge bg={formData.startTime && formData.endTime && 
                                    availableRooms.some(room => room.name === selectedRoom) ? "success" : "warning"}>
                          Đã chọn: {selectedRoom}
                          {formData.startTime && formData.endTime && 
                           !availableRooms.some(room => room.name === selectedRoom) && " (có thể bận)"}
                          <FaTimes 
                            className="ms-2 cursor-pointer" 
                            onClick={() => setSelectedRoom('')}
                            style={{ cursor: 'pointer' }}
                          />
                        </Badge>
                      </div>
                    )}
                  </Form.Group>

                  {formData.meetingType !== 'offline' && (
                    <Form.Group className="mb-3" controlId="meetingLink">
                      <Form.Label>Link họp (Zoom/Teams/...)*</Form.Label>
                      <Form.Control
                        type="url"
                        name="meetingLink"
                        value={formData.meetingLink}
                        onChange={handleChange}
                        isInvalid={!!errors.meetingLink}
                      />
                      <Form.Control.Feedback type="invalid">{errors.meetingLink}</Form.Control.Feedback>
                    </Form.Group>
                  )}

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="meetingType">
                        <Form.Label>Loại cuộc họp</Form.Label>
                        <Form.Select name="meetingType" value={formData.meetingType} onChange={(e)=>{handleChange(e); if(e.target.value==='offline') setFormData(prev=>({...prev,meetingLink:''}));}}>
                          <option value="offline">Offline</option>
                          <option value="online">Online</option>
                          <option value="hybrid">Hybrid</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="priority">
                        <Form.Label>Mức ưu tiên</Form.Label>
                        <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                          <option value="low">Thấp</option>
                          <option value="medium">Trung bình</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Phần cuộc họp riêng tư */}
                  <Form.Group className="mb-3" controlId="isPrivate">
                    <Form.Check 
                      type="switch"
                      id="private-switch"
                      label={
                        <span>
                          {formData.isPrivate ? <FaLock className="me-2" /> : <FaGlobe className="me-2" />}
                          Cuộc họp riêng tư
                          <small className="text-muted d-block">
                            {formData.isPrivate 
                              ? 'Chỉ người được mời và quản lý cùng phòng ban mới thấy' 
                              : 'Mọi người trong hệ thống đều có thể thấy'}
                          </small>
                          {formData.isPrivate && (
                            <small className="text-info d-block mt-1">
                              <strong>Lưu ý:</strong> Employee chỉ thấy khi được mời. Manager và Secretary cùng phòng ban có thể thấy.
                            </small>
                          )}
                        </span>
                      }
                      name="isPrivate"
                      checked={formData.isPrivate}
                      onChange={handleChange}
                    />
                  </Form.Group>

                  {/* Phần mời người tham gia */}
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FaUsers className="me-2" />
                      Mời người tham gia
                    </Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type="text"
                        placeholder="Tìm kiếm theo tên, email hoặc phòng ban..."
                        value={searchUser}
                        onChange={(e) => {
                          setSearchUser(e.target.value);
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                      />
                      
                      {showUserDropdown && searchUser && (
                        <Card className="position-absolute w-100 mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                          <Card.Body className="p-2">
                            {loadingUsers ? (
                              <div className="text-center py-2">
                                <Spinner size="sm" />
                              </div>
                            ) : filteredUsers.length > 0 ? (
                              filteredUsers.map(user => (
                                <div 
                                  key={user._id}
                                  className="p-2 hover-bg-light cursor-pointer"
                                  onClick={() => handleAddAttendee(user)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="fw-bold">{user.fullName}</div>
                                  <small className="text-muted">{user.email} • {user.department || 'N/A'}</small>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted text-center py-2">
                                Không tìm thấy người dùng
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      )}
                    </div>

                    {/* Hiển thị danh sách người được mời */}
                    {formData.attendees.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted">Người tham gia ({formData.attendees.length})</small>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {formData.attendees.map(attendee => (
                            <Badge 
                              key={attendee._id} 
                              bg="primary" 
                              className="d-flex align-items-center gap-1 p-2"
                            >
                              {attendee.fullName}
                              <FaTimes 
                                className="cursor-pointer" 
                                onClick={() => handleRemoveAttendee(attendee._id)}
                                style={{ cursor: 'pointer' }}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Form.Group>

                  <div className="d-flex justify-content-end">
                    <Button variant="primary" type="submit" disabled={loading}>
                      {loading && <Spinner size="sm" animation="border" className="me-2" />}Tạo cuộc họp
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="meetings-main-card">
              <Card.Header>
                <h6 className="mb-0">Gợi ý</h6>
              </Card.Header>
              <Card.Body>
                <div className="small text-muted">
                  <p>Khi tạo cuộc họp, hãy nhớ:</p>
                  <ul>
                    <li>Đặt tiêu đề rõ ràng</li>
                    <li>Chọn thời gian phù hợp</li>
                    <li>Thêm agenda chi tiết</li>
                    <li>Mời đúng người tham gia</li>
                    <li>Đặt cuộc họp riêng tư nếu nội dung nhạy cảm</li>
                  </ul>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default CreateMeeting; 