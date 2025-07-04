import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBuilding, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const EditMeeting = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
    // isPrivate: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // States cho phòng họp
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [originalMeeting, setOriginalMeeting] = useState(null);

  const fetchMeeting = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const m = res.data.meeting;
      // Check permission
      if (!(user.role === 'admin' || user.role === 'manager' || m.organizer._id === user._id)) {
        navigate('/unauthorized');
        return;
      }
      setOriginalMeeting(m);
      
      // Kiểm tra xem location có phải là phòng họp hay không
      checkIfLocationIsRoom(m.location);
      
      setFormData({
        title: m.title,
        description: m.description || '',
        startTime: new Date(m.startTime).toISOString().slice(0,16),
        endTime: new Date(m.endTime).toISOString().slice(0,16),
        location: m.location || '',
        meetingLink: m.meetingLink || '',
        meetingType: m.meetingType,
        priority: m.priority,
        // isPrivate: m.isPrivate
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải dữ liệu';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeeting(); /* eslint-disable-next-line */ }, [id]);

  // Kiểm tra xem location có phải là phòng họp trong hệ thống không
  const checkIfLocationIsRoom = async (location) => {
    if (!location) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/meeting-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const room = response.data.rooms.find(r => r.name === location);
      if (room) {
        setSelectedRoom(location);
      }
    } catch (error) {
      console.error('Error checking room:', error);
    }
  };

  // Tìm phòng họp khả dụng khi thay đổi ngày/giờ
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (formData.startTime && formData.endTime) {
        try {
          setLoadingRooms(true);
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
        } finally {
          setLoadingRooms(false);
        }
      }
    };

    fetchAvailableRooms();
  }, [formData.startTime, formData.endTime, token]);

  const handleChange = (e) => {
    if (!e?.target) return;
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề là bắt buộc';
    if (!formData.startTime) newErrors.startTime = 'Thời gian bắt đầu là bắt buộc';
    if (!formData.endTime) newErrors.endTime = 'Thời gian kết thúc là bắt buộc';
    if (formData.startTime && new Date(formData.endTime) <= new Date(formData.startTime)) newErrors.endTime = 'Kết thúc phải sau bắt đầu';

    // Link validation
    if (formData.meetingType !== 'offline' && !formData.meetingLink.trim()) {
      newErrors.meetingLink = 'Link họp bắt buộc cho cuộc họp online/hybrid';
    }
    if (formData.meetingType === 'offline') {
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
        location: selectedRoom || formData.location
      };
      if (payload.meetingType === 'offline' || !payload.meetingLink.trim()) {
        delete payload.meetingLink;
      }
      delete payload.isPrivate;

      await axios.put(`${API_BASE_URL}/meetings/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/meetings/${id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Cập nhật thất bại';
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
                <h1 className="meetings-title">Chỉnh sửa cuộc họp</h1>
              {/*<p className="meetings-subtitle">ID: {id}</p>*/}
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="meetings-main-card">
              <Card.Body>
                {loading ? (
                  <div className="text-center py-5"><Spinner animation="border" /></div>
                ) : (
                  <Form onSubmit={handleSubmit}>
                    {serverError && <Alert variant="danger">{serverError}</Alert>}

                    <Form.Group className="mb-3" controlId="title">
                      <Form.Label>Tiêu đề *</Form.Label>
                      <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} isInvalid={!!errors.title} />
                      <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="description">
                      <Form.Label>Mô tả</Form.Label>
                      <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleChange} />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="startTime">
                          <Form.Label>Bắt đầu *</Form.Label>
                          <Form.Control type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} isInvalid={!!errors.startTime} />
                          <Form.Control.Feedback type="invalid">{errors.startTime}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="endTime">
                          <Form.Label>Kết thúc *</Form.Label>
                          <Form.Control type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} isInvalid={!!errors.endTime} />
                          <Form.Control.Feedback type="invalid">{errors.endTime}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="location">
                      <Form.Label>
                        <FaBuilding className="me-2" />
                        Địa điểm
                      </Form.Label>
                      
                      {/* Dropdown chọn phòng họp */}
                      {availableRooms.length > 0 && (
                        <Form.Select 
                          className="mb-2"
                          value={selectedRoom}
                          onChange={(e) => setSelectedRoom(e?.target?.value || '')}
                        >
                          <option value="">-- Chọn phòng họp khả dụng --</option>
                          {availableRooms.map(room => (
                            <option key={room._id} value={room.name}>
                              {room.name} - {room.location.floor} ({room.capacity} người)
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
                          ))}
                        </Form.Select>
                      )}
                      
                      {/* Input nhập địa điểm tùy chỉnh */}
                      {(!selectedRoom || availableRooms.length === 0) && (
                        <Form.Control
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder={availableRooms.length > 0 ? "Hoặc nhập địa điểm khác" : "Nhập địa điểm họp"}
                        />
                      )}
                      
                      {/* Thông báo trạng thái */}
                      {loadingRooms && (
                        <Form.Text className="text-muted">
                          <Spinner size="sm" className="me-2" />
                          Đang tìm phòng họp khả dụng...
                        </Form.Text>
                      )}
                      
                      {!loadingRooms && formData.startTime && formData.endTime && availableRooms.length === 0 && (
                        <Form.Text className="text-warning">
                          Không có phòng họp nào khả dụng trong khung giờ này
                        </Form.Text>
                      )}
                      
                      {selectedRoom && (
                        <div className="mt-2">
                          <Badge bg="success">
                            Đã chọn: {selectedRoom}
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
                        <Form.Label>Link họp *</Form.Label>
                        <Form.Control type="url" name="meetingLink" value={formData.meetingLink} onChange={handleChange} isInvalid={!!errors.meetingLink} />
                        <Form.Control.Feedback type="invalid">{errors.meetingLink}</Form.Control.Feedback>
                      </Form.Group>
                    )}

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="meetingType">
                          <Form.Label>Loại</Form.Label>
                          <Form.Select name="meetingType" value={formData.meetingType} onChange={(e)=>{handleChange(e); if(e?.target?.value==='offline') setFormData(prev=>({...prev,meetingLink:''}));}}>
                            <option value="offline">Offline</option>
                            <option value="online">Online</option>
                            <option value="hybrid">Hybrid</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="priority">
                          <Form.Label>Ưu tiên</Form.Label>
                          <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                            <option value="low">Thấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="high">Cao</option>
                            <option value="urgent">Khẩn cấp</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end">
                      <Button variant="primary" type="submit" disabled={loading}>{loading && <Spinner size="sm" animation="border" className="me-2" />}Lưu</Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default EditMeeting; 