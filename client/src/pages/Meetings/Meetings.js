import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Pagination, Alert, ButtonGroup } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaCalendarAlt, FaClock, FaCheckCircle, FaList, FaCalendar } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import WeeklyCalendar from './WeeklyCalendar';
import './Meetings.css';

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
    
    const { token, user } = useAuth();
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    const navigate = useNavigate();
    const location = useLocation();

    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [dataSource, setDataSource] = useState('loading'); // 'database', 'demo', 'loading'

    // Demo meetings data với thời gian thực tế
    const generateDemoMeetings = () => {
        const today = new Date();
        const meetings = [];
        
        // Hôm nay
        meetings.push({
            _id: '1',
            title: 'Daily Standup',
            startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
            endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
            location: 'Phòng họp A',
            status: 'scheduled',
            organizer: { fullName: 'Scrum Master' },
            attendees: []
        });
        
        meetings.push({
            _id: '2',
            title: 'Họp Planning Sprint 12',
            startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString(),
            endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
            location: 'Phòng Conference',
            status: 'scheduled',
            organizer: { fullName: 'Product Owner' },
            attendees: []
        });
        
        // Ngày mai
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        meetings.push({
            _id: '3',
            title: 'Review Code với Team',
            startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(),
            endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 30).toISOString(),
            location: 'Online - Meet',
            status: 'scheduled',
            organizer: { fullName: 'Tech Lead' },
            attendees: []
        });
        
        meetings.push({
            _id: '4',
            title: 'Thuyết trình Demo khách hàng',
            startTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0).toISOString(),
            endTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 0).toISOString(),
            location: 'Phòng VIP',
            status: 'scheduled',
            organizer: { fullName: 'Sales Manager' },
            attendees: []
        });
        
        // Thứ 3
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        
        meetings.push({
            _id: '5',
            title: 'Họp phòng Marketing',
            startTime: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 8, 30).toISOString(),
            endTime: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 10, 0).toISOString(),
            location: 'Phòng Marketing',
            status: 'scheduled',
            organizer: { fullName: 'Marketing Manager' },
            attendees: []
        });
        
        meetings.push({
            _id: '6',
            title: 'Training Kubernetes',
            startTime: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 19, 0).toISOString(),
            endTime: new Date(dayAfterTomorrow.getFullYear(), dayAfterTomorrow.getMonth(), dayAfterTomorrow.getDate(), 21, 0).toISOString(),
            location: 'Phòng đào tạo',
            status: 'scheduled',
            organizer: { fullName: 'DevOps Engineer' },
            attendees: []
        });
        
        // Hôm qua (completed)
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        meetings.push({
            _id: '7',
            title: 'Retrospective Sprint 11',
            startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16, 0).toISOString(),
            endTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 17, 30).toISOString(),
            location: 'Phòng Retrospective',
            status: 'completed',
            organizer: { fullName: 'Scrum Master' },
            attendees: []
        });
        
        return meetings;
    };
    
    const demoMeetings = generateDemoMeetings();

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

    // Fetch meetings từ database
    const fetchMeetings = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const params = {
                search
            };
            
            // Calendar view cần tất cả meetings, list view dùng pagination
            if (viewMode === 'calendar') {
                params.limit = 100; // Lấy nhiều meetings cho calendar
            } else {
                params.page = page;
                params.limit = 10;
            }
            
            const response = await axios.get(`${API_BASE_URL}/meetings`, {
                params,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.meetings && response.data.meetings.length > 0) {
                // Có data từ database
                const allMeetings = response.data.meetings;
                const filteredMeetings = filterMeetings(allMeetings);
                setMeetings(filteredMeetings);
                setTotalPages(response.data.pagination?.pages || 1);
                setError('');
                setDataSource('database');
            } else {
                // Database trống, dùng demo data
                const filteredDemoMeetings = filterMeetings(demoMeetings);
                setMeetings(filteredDemoMeetings);
                setTotalPages(1);
                setError('');
                setDataSource('demo');
            }
        } catch (err) {
            // API lỗi, fallback về demo data
            const filteredDemoMeetings = filterMeetings(demoMeetings);
            setMeetings(filteredDemoMeetings);
            setTotalPages(1);
            setError('');
            setDataSource('demo');
        } finally {
            setLoading(false);
        }
    };

    // Fetch meetings khi có thay đổi
    useEffect(() => {
        fetchMeetings(currentPage, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, filter, viewMode]);

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
        <div className="meetings-page page-transition">
            <Container>
                <div className="meetings-header">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
                        <div>
                            <h2 className="meetings-title">
                                {getFilterIcon()}
                                {getFilterTitle()}
                            </h2>
                            {filter !== 'all' && (
                                <div className="filter-navigation">
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
                                </div>
                            )}
                        </div>
                        <div className="action-buttons">
                            <ButtonGroup className="view-mode-toggle">
                                <Button 
                                    variant={viewMode === 'list' ? 'primary' : 'outline-primary'}
                                    onClick={() => setViewMode('list')}
                                >
                                    <FaList className="me-1" />
                                    Danh sách
                                </Button>
                                <Button 
                                    variant={viewMode === 'calendar' ? 'primary' : 'outline-primary'}
                                    onClick={() => setViewMode('calendar')}
                                >
                                    <FaCalendar className="me-1" />
                                    Lịch tuần
                                </Button>
                            </ButtonGroup>
                            
                            <Button 
                                variant="outline-secondary" 
                                className="refresh-btn"
                                onClick={() => {
                                    fetchMeetings(currentPage, searchTerm);
                                }}
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
                            
                            <Button 
                                as={Link} 
                                to="/meetings/create" 
                                variant="primary"
                                className="create-meeting-btn"
                            >
                                <FaPlus className="me-2" />
                                Tạo cuộc họp mới
                            </Button>
                        </div>
                    </div>
                </div>

                {viewMode === 'list' && (
                    <div className="search-section fade-in">
                        <Form onSubmit={handleSearch}>
                            <Form.Group>
                                <Form.Control
                                    type="text"
                                    placeholder="Tìm kiếm cuộc họp..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e?.target?.value || '')}
                                />
                            </Form.Group>
                        </Form>
                    </div>
                )}

                {error && <Alert variant="danger" className="error-alert">{error}</Alert>}

                {loading ? (
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
                                    d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C9.61305 21 7.5 19.8956 6.2 18.15"
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round"
                                />
                                <path 
                                    d="M3 18L6.2 18.15L6.05 15"
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : meetings.length === 0 ? (
                    <div className="empty-state fade-in">
                        <h5>Không có cuộc họp nào {filter !== 'all' ? `cho mục "${getFilterTitle()}"` : ''}</h5>
                        <p>
                            {filter === 'today' ? 'Không có cuộc họp nào được lên lịch cho hôm nay.' :
                             filter === 'upcoming' ? 'Không có cuộc họp nào sắp diễn ra.' :
                             filter === 'completed' ? 'Chưa có cuộc họp nào hoàn thành.' :
                             'Hãy tạo cuộc họp đầu tiên của bạn!'}
                        </p>
                        <Button as={Link} to="/meetings/create" variant="primary">
                            <FaPlus className="me-2" />
                            Tạo cuộc họp mới
                        </Button>
                    </div>
                ) : (
                    <>
                        {viewMode === 'calendar' ? (
                            <div className="calendar-container fade-in">
                                <WeeklyCalendar meetings={meetings} user={user} />
                            </div>
                        ) : (
                            <div className="slide-in-right">
                                <Card className="meetings-table-card">
                                    <Card.Body className="p-0">
                                        <Table responsive hover className="meetings-table">
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
                                                        <td>
                                                            <Link 
                                                                to={`/meetings/${meeting._id}`}
                                                                className="meeting-title-link"
                                                            >
                                                                {meeting.title}
                                                            </Link>
                                                        </td>
                                                        <td>{formatDate(meeting.startTime)}</td>
                                                        <td>{formatTime(meeting.startTime, meeting.endTime)}</td>
                                                        <td>{meeting.location || 'N/A'}</td>
                                                        <td>
                                                            <span className={`status-badge status-${meeting.status}`}>
                                                                {getStatusBadge(meeting.status).text}
                                                            </span>
                                                        </td>
                                                        <td>{meeting.organizer?.fullName || 'N/A'}</td>
                                                        <td>
                                                            {user && ['admin', 'manager', 'secretary'].includes(user.role) && (
                                                                <Button
                                                                    as={Link}
                                                                    to={`/meetings/${meeting._id}/edit`}
                                                                    className="action-btn action-btn-primary"
                                                                    size="sm"
                                                                >
                                                                    Chỉnh sửa
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>

                                {totalPages > 1 && (
                                    <div className="pagination-wrapper">
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
                            </div>
                        )}
                    </>
                )}
            </Container>
        </div>
    );
};

export default Meetings; 