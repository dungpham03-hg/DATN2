import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Badge, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBuilding, FaUsers, FaWifi, FaTv, FaChalkboard, FaVideo, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import './MeetingRooms.css';

const MeetingRooms = () => {
  const { token, user } = useAuth();
  const { success, error: notify, warning } = useNotification();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    location: {
      floor: '',
      building: 'Tòa nhà chính',
      address: ''
    },
    facilities: [],
    description: ''
  });

  const facilities = [
    { value: 'projector', label: 'Máy chiếu', icon: FaTv },
    { value: 'whiteboard', label: 'Bảng trắng', icon: FaChalkboard },
    { value: 'tv', label: 'TV', icon: FaTv },
    { value: 'video_conference', label: 'Hội nghị truyền hình', icon: FaVideo },
    { value: 'sound_system', label: 'Hệ thống âm thanh', icon: FaVideo },
    { value: 'air_conditioning', label: 'Điều hòa', icon: FaBuilding },
    { value: 'wifi', label: 'WiFi', icon: FaWifi }
  ];

  const canManageRooms = user && ['admin', 'manager'].includes(user.role);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      console.log('Fetching rooms from:', `${API_BASE_URL}/meeting-rooms`);
      
      const response = await axios.get(`${API_BASE_URL}/meeting-rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Rooms response:', response.data);
      setRooms(response.data.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách phòng họp');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        location: room.location,
        facilities: room.facilities || [],
        description: room.description || ''
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        capacity: '',
        location: {
          floor: '',
          building: 'Tòa nhà chính',
          address: ''
        },
        facilities: [],
        description: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRoom(null);
  };

  const handleChange = (e) => {
    if (!e?.target) return;
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      console.log('Submitting room data:', data);

      let response;
      if (editingRoom) {
        response = await axios.put(
          `${API_BASE_URL}/meeting-rooms/${editingRoom._id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Update response:', response.data);
        success('Cập nhật phòng họp thành công');
      } else {
        response = await axios.post(
          `${API_BASE_URL}/meeting-rooms`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Create response:', response.data);
        success('Tạo phòng họp thành công');
      }
      
      handleCloseModal();
      
      // Đợi một chút rồi fetch lại để đảm bảo database đã cập nhật
      setTimeout(() => {
        fetchRooms();
      }, 500);
      
    } catch (err) {
      console.error('Submit error:', err);
      let errorMessage = 'Có lỗi xảy ra';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        // Xử lý lỗi duplicate key đặc biệt
        if (errorMessage.includes('duplicate') || errorMessage.includes('đã tồn tại')) {
          errorMessage = `Tên phòng "${formData.name}" đã tồn tại. Vui lòng chọn tên khác.`;
        }
      } else if (err.response?.data?.errors) {
        errorMessage = err.response.data.errors.map(e => e.msg).join(', ');
      }
      
      notify(errorMessage);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Bạn có chắc muốn vô hiệu hóa phòng họp này?')) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/meeting-rooms/${roomId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      success('Vô hiệu hóa phòng họp thành công');
      fetchRooms();
    } catch (err) {
      notify(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const getFacilityIcon = (facility) => {
    const facilityItem = facilities.find(f => f.value === facility);
    return facilityItem ? facilityItem.icon : null;
  };

  const getFacilityLabel = (facility) => {
    const facilityItem = facilities.find(f => f.value === facility);
    return facilityItem ? facilityItem.label : facility;
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="loading-container fade-in">
          <div className="loading-spinner">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="loading-icon"
            >
              <path 
                d="M3 3V9M3 9H9M3 9L6.293 5.707C7.923 4.077 10.081 3 12.5 3C17.194 3 21 6.806 21 11.5C21 16.194 17.194 20 12.5 20C7.806 20 4 16.194 4 11.5"
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="meeting-rooms-section py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Quản lý phòng họp</h2>
            <div className="d-flex gap-2">
              <Button 
                variant="outline-secondary" 
                className="refresh-btn"
                onClick={fetchRooms} 
                disabled={loading}
                title="Làm mới"
              >
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="refresh-icon"
                >
                  <path 
                    d="M3 3V9M3 9H9M3 9L6.293 5.707C7.923 4.077 10.081 3 12.5 3C17.194 3 21 6.806 21 11.5C21 16.194 17.194 20 12.5 20C7.806 20 4 16.194 4 11.5"
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
              {canManageRooms && (
                <Button variant="primary" onClick={() => handleOpenModal()}>
                  <FaPlus className="me-2" />
                  Thêm phòng họp
                </Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Tên phòng</th>
                    <th>Sức chứa</th>
                    <th>Vị trí</th>
                    <th>Tiện nghi</th>
                    <th>Trạng thái</th>
                    {canManageRooms && <th>Hành động</th>}
                  </tr>
                </thead>
                <tbody>
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={canManageRooms ? 6 : 5} className="text-center py-4 text-muted">
                        Chưa có phòng họp nào được tạo
                      </td>
                    </tr>
                  ) : (
                    rooms.map(room => (
                      <tr key={room._id}>
                        <td>
                          <strong>{room.name}</strong>
                          {room.description && (
                            <div className="text-muted small">{room.description}</div>
                          )}
                        </td>
                        <td>
                          <FaUsers className="me-1" />
                          {room.capacity} người
                        </td>
                        <td>
                          <FaBuilding className="me-1" />
                          {room.location.floor} - {room.location.building}
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {room.facilities.map(facility => {
                              const Icon = getFacilityIcon(facility);
                              return (
                                <Badge key={facility} bg="secondary" className="d-flex align-items-center">
                                  {Icon && <Icon className="me-1" size={12} />}
                                  {getFacilityLabel(facility)}
                                </Badge>
                              );
                            })}
                          </div>
                        </td>
                        <td>
                          <Badge bg={room.isActive ? 'success' : 'danger'}>
                            {room.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                          </Badge>
                        </td>
                        {canManageRooms && (
                          <td>
                            <Button
                              variant="sm"
                              size="sm"
                              className="me-1"
                              onClick={() => handleOpenModal(room)}
                            >
                              <FaEdit />
                            </Button>
                            {user.role === 'admin' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(room._id)}
                              >
                                <FaTrash />
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal thêm/sửa phòng họp */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingRoom ? 'Chỉnh sửa phòng họp' : 'Thêm phòng họp mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên phòng *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="VD: Phòng A2-101, Phòng họp tầng 2, Conference Room 01"
                    required
                  />
                  <Form.Text className="text-muted">
                    Tên phòng phải là duy nhất trong hệ thống
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sức chứa *</Form.Label>
                  <Form.Control
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    max="500"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tầng *</Form.Label>
                  <Form.Control
                    type="text"
                    name="location.floor"
                    value={formData.location.floor}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Tòa nhà</Form.Label>
                  <Form.Control
                    type="text"
                    name="location.building"
                    value={formData.location.building}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control
                    type="text"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Tiện nghi</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                {facilities.map(facility => {
                  const Icon = facility.icon;
                  return (
                    <Form.Check
                      key={facility.value}
                      type="checkbox"
                      id={facility.value}
                      label={
                        <span className="d-flex align-items-center">
                          <Icon className="me-1" />
                          {facility.label}
                        </span>
                      }
                      checked={formData.facilities.includes(facility.value)}
                      onChange={() => handleFacilityToggle(facility.value)}
                    />
                  );
                })}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingRoom ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default MeetingRooms; 