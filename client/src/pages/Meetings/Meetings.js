import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Pagination, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaCalendarAlt, FaClock, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
    
    const { token } = useAuth();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    const navigate = useNavigate();
    const location = useLocation();

    const [filter, setFilter] = useState('all');

    // Demo meetings data
    const demoMeetings = [
        {
            _id: '1',
            title: 'Họp team hàng tuần',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(), // +1 hour
            location: 'Phòng họp A',
            status: 'scheduled',
            organizer: { fullName: 'Admin' },
            attendees: [{ user: { fullName: 'User 1' } }, { user: { fullName: 'User 2' } }]
        },
        {
            _id: '2',
            title: 'Review dự án Q4',
            startTime: new Date(Date.now() + 86400000).toISOString(),
            endTime: new Date(Date.now() + 90000000).toISOString(), // tomorrow +1.5 hours
            location: 'Online - Zoom',
            status: 'scheduled',
            organizer: { fullName: 'Manager' },
            attendees: [{ user: { fullName: 'Team Lead' } }, { user: { fullName: 'Developer' } }]
        },
        {
            _id: '3',
            title: 'Họp với khách hàng',
            startTime: new Date(Date.now() - 86400000).toISOString(),
            endTime: new Date(Date.now() - 82800000).toISOString(), // yesterday
            location: 'Phòng họp VIP',
            status: 'completed',
            organizer: { fullName: 'Sales Manager' },
            attendees: [{ user: { fullName: 'Sales Team' } }]
        }
    ];

    useEffect(() => {
        // Lấy filter từ URL params
        const params = new URLSearchParams(location.search);
        const filterParam = params.get('filter');
        if (filterParam) {
            setFilter(filterParam);
        }
    }, [location.search]);

    const filterMeetings = (meetingsList) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch(filter) {
            case 'today':
                return meetingsList.filter(meeting => {
                    const meetingDate = new Date(meeting.startTime);
                    return meetingDate >= today && meetingDate < tomorrow;
                });
            case 'upcoming':
                return meetingsList.filter(meeting => {
                    const meetingDate = new Date(meeting.startTime);
                    return meetingDate >= tomorrow;
                });
            case 'completed':
                return meetingsList.filter(meeting => meeting.status === 'completed');
            default:
                return meetingsList;
        }
    };

    const fetchMeetings = async (page = 1, search = '') => {
    try {
      setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/meetings`, {
                params: {
                    page,
                    limit: 10,
                    search
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const allMeetings = response.data.meetings || demoMeetings;
            const filteredMeetings = filterMeetings(allMeetings);
            
            setMeetings(filteredMeetings);
            setTotalPages(response.data.totalPages || 1);
            setError('');
    } catch (err) {
            console.error('Error fetching meetings:', err);
            // Sử dụng demo data nếu API lỗi
            const filteredDemoMeetings = filterMeetings(demoMeetings);
            setMeetings(filteredDemoMeetings);
            setTotalPages(1);
            setError('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
        fetchMeetings(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
        setCurrentPage(1);
        fetchMeetings(1, searchTerm);
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            scheduled: { text: 'Đã lên lịch', class: 'bg-info' },
            ongoing: { text: 'Đang diễn ra', class: 'bg-primary' },
            completed: { text: 'Hoàn thành', class: 'bg-success' },
            cancelled: { text: 'Đã hủy', class: 'bg-danger' },
            postponed: { text: 'Hoãn lại', class: 'bg-warning' }
        };
        return statusMap[status] || { text: status, class: 'bg-secondary' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('vi-VN');
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const formatTime = (startTime, endTime) => {
        if (!startTime || !endTime) return 'N/A';
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const startTimeStr = start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            return `${startTimeStr} - ${endTimeStr}`;
        } catch (error) {
            return 'Invalid Time';
        }
    };

    const getFilterTitle = () => {
        switch(filter) {
            case 'today':
                return 'Cuộc họp hôm nay';
            case 'upcoming':
                return 'Cuộc họp sắp tới';
            case 'completed':
                return 'Cuộc họp đã hoàn thành';
            default:
                return 'Tất cả cuộc họp';
        }
    };

    const getFilterIcon = () => {
        switch(filter) {
            case 'today':
                return <FaCalendarAlt className="me-2" />;
            case 'upcoming':
                return <FaClock className="me-2" />;
            case 'completed':
                return <FaCheckCircle className="me-2" />;
            default:
                return null;
        }
  };

  return (
        <Container className="py-4">
            <Row className="mb-4">
          <Col>
                    <div className="d-flex justify-content-between align-items-center">
              <div>
                            <h2>
                                {getFilterIcon()}
                                {getFilterTitle()}
                            </h2>
                            {filter !== 'all' && (
                                <Button 
                                    variant="link" 
                                    className="p-0"
                                    onClick={() => {
                                        setFilter('all');
                                        navigate('/meetings');
                                    }}
                                >
                                    ← Xem tất cả cuộc họp
                                </Button>
                            )}
              </div>
                        <Button 
                            as={Link} 
                            to="/meetings/create" 
                            variant="primary"
                        >
                            <FaPlus className="me-2" />
                            Tạo cuộc họp mới
                        </Button>
            </div>
          </Col>
        </Row>

            <Row className="mb-4">
          <Col md={6}>
                    <Form onSubmit={handleSearch}>
                        <Form.Group>
              <Form.Control
                type="text"
                                placeholder="Tìm kiếm cuộc họp..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Form.Group>
            </Form>
          </Col>
        </Row>

            {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : meetings.length === 0 ? (
                <Card>
                    <Card.Body className="text-center py-5">
                        <h5>Không có cuộc họp nào {filter !== 'all' ? `cho mục "${getFilterTitle()}"` : ''}</h5>
                        <p className="text-muted">
                            {filter === 'today' ? 'Không có cuộc họp nào được lên lịch cho hôm nay.' :
                             filter === 'upcoming' ? 'Không có cuộc họp nào sắp diễn ra.' :
                             filter === 'completed' ? 'Chưa có cuộc họp nào hoàn thành.' :
                             'Hãy tạo cuộc họp đầu tiên của bạn!'}
                        </p>
                        <Button as={Link} to="/meetings/create" variant="primary">
                            <FaPlus className="me-2" />
                            Tạo cuộc họp mới
                        </Button>
                    </Card.Body>
                </Card>
                ) : (
                  <>
                    <Card>
                        <Card.Body>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Tiêu đề</th>
                                        <th>Ngày</th>
                          <th>Thời gian</th>
                                        <th>Địa điểm</th>
                          <th>Trạng thái</th>
                                        <th>Người tổ chức</th>
                                        <th>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                                    {meetings.map((meeting) => (
                                        <tr key={meeting._id}>
                                            <td>{meeting.title}</td>
                                            <td>{formatDate(meeting.startTime)}</td>
                                            <td>{formatTime(meeting.startTime, meeting.endTime)}</td>
                                            <td>{meeting.location || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(meeting.status).class}`}>
                                                    {getStatusBadge(meeting.status).text}
                                                </span>
                            </td>
                                            <td>{meeting.organizer?.fullName || 'N/A'}</td>
                                            <td>
                                                <Button
                                                    as={Link}
                                                    to={`/meetings/${meeting._id}`}
                                                    variant="sm"
                                                    size="sm"
                                                >
                                                    Xem chi tiết
                                                </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                        </Card.Body>
                    </Card>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                                <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
                                
                                {[...Array(totalPages)].map((_, index) => (
                                    <Pagination.Item
                                        key={index + 1}
                                        active={index + 1 === currentPage}
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        {index + 1}
                                    </Pagination.Item>
                                ))}
                                
                                <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
                                <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                        </div>
                    )}
                  </>
                )}
      </Container>
  );
};

export default Meetings; 